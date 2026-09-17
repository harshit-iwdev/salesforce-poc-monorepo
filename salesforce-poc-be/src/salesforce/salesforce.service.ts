import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as jsforce from 'jsforce';
import type { AccountDto } from './dto/account.dto.js';
import type { ContactDto } from './dto/contact.dto.js';
import type { OpportunityDto } from './dto/opportunity.dto.js';

export interface StoredSession {
  accessToken: string;
  refreshToken?: string | null;
  instanceUrl: string;
  userId?: string;
  organizationId?: string;
}

export interface DynamicSessionEntry {
  sessionId: string;
  connection: jsforce.Connection;
  instanceUrl: string;
  accessToken: string;
  refreshToken?: string;
  userId?: string;
  organizationId?: string;
  username?: string;
  loginUrl?: string;
  connectedAt: string;
}

export interface ConnectionContext {
  sessionId?: string;
  accessToken?: string;
  instanceUrl?: string;
  refreshToken?: string;
}

export interface SessionSummary {
  sessionId: string;
  organizationId?: string;
  userId?: string;
  instanceUrl: string;
  username?: string;
  connectedAt: string;
  isDefault?: boolean;
}

@Injectable()
export class SalesforceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SalesforceService.name);
  private connection: jsforce.Connection | null = null;
  private oauth2: jsforce.OAuth2;
  private readonly defaultTokenPath = path.resolve(
    process.cwd(),
    '.salesforce-token.json',
  );
  private readonly sessionsFilePath = path.resolve(
    process.cwd(),
    '.salesforce-sessions.json',
  );

  private readonly sessions = new Map<string, DynamicSessionEntry>();

  constructor(private readonly config: ConfigService) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    const loginUrl = this.config.get<string>('salesforce.loginUrl') || 'https://login.salesforce.com';
    const clientId = this.config.get<string>('salesforce.clientId') || '';
    const clientSecret = this.config.get<string>('salesforce.clientSecret') || '';
    const redirectUri = this.config.get<string>('salesforce.redirectUri') || 'http://localhost:8000/salesforce/auth/callback';

    this.oauth2 = new jsforce.OAuth2({
      loginUrl,
      clientId,
      clientSecret,
      redirectUri,
    });

    // 1. Restore dynamic multi-user sessions
    this.loadSavedSessions();

    // 2. Restore default session if token exists
    if (this.loadSavedSession()) {
      return;
    }

    // 3. Fallback: try username/password if configured
    const username = this.config.get<string>('salesforce.username');
    const password = this.config.get<string>('salesforce.password');
    if (username && password) {
      try {
        await this.connectWithPassword(username, password);
        return;
      } catch (err: any) {
        this.logger.warn(
          `Username-Password login not available (${err.message}). Web OAuth authorization will be used.`,
        );
      }
    }

    this.logger.log('Salesforce multi-tenant dynamic service initialized.');
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.connection?.logout();
      for (const entry of this.sessions.values()) {
        try {
          await entry.connection.logout();
        } catch {
          // ignore
        }
      }
      this.logger.log('Salesforce connections closed.');
    } catch {
      // Ignore logout errors during shutdown
    }
  }

  // ─── OAuth 2.0 Web Server Flow (PKCE & Multi-User State) ─────────────────

  private codeVerifiers = new Map<string, string>();

  getAuthorizationUrl(state?: string): string {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const stateKey = state || crypto.randomUUID();
    this.codeVerifiers.set(stateKey, verifier);

    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');

    return this.oauth2.getAuthorizationUrl({
      scope: 'api refresh_token web',
      state: stateKey,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
  }

  async authorizeWithCode(code: string, state?: string): Promise<{
    session: StoredSession;
    sessionId: string;
    userInfo: any;
  }> {
    const conn = new jsforce.Connection({ oauth2: this.oauth2 });
    const params: Record<string, string> = {};

    if (state && this.codeVerifiers.has(state)) {
      params.code_verifier = this.codeVerifiers.get(state)!;
      this.codeVerifiers.delete(state);
    }

    const userInfo = await conn.authorize(code, params);

    const sessionId = state || `sf_${userInfo.organizationId}_${Date.now()}`;

    const session: StoredSession = {
      accessToken: conn.accessToken!,
      refreshToken: conn.refreshToken,
      instanceUrl: conn.instanceUrl,
      userId: userInfo.id,
      organizationId: userInfo.organizationId,
    };

    const entry: DynamicSessionEntry = {
      sessionId,
      connection: conn,
      instanceUrl: conn.instanceUrl,
      accessToken: conn.accessToken!,
      refreshToken: conn.refreshToken ?? undefined,
      userId: userInfo.id,
      organizationId: userInfo.organizationId,
      connectedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, entry);
    this.attachRefreshListener(sessionId, conn);
    this.saveSessions();

    // Also update default if none active
    if (!this.connection) {
      this.connection = conn;
      this.saveSession(session);
    }

    this.logger.log(
      `✅ Dynamically authorized session: ${sessionId} | User: ${userInfo.id} | Org: ${userInfo.organizationId}`,
    );

    return { session, sessionId, userInfo };
  }

  // ─── Dynamic Connections (Token / Password) ──────────────────────────────

  async connectWithToken(
    data: {
      instanceUrl: string;
      accessToken: string;
      refreshToken?: string;
      userId?: string;
    },
    existingSessionId?: string,
  ): Promise<{ sessionId: string; status: any }> {
    const instanceUrl = data.instanceUrl?.trim();
    const accessToken = data.accessToken?.trim();
    const refreshToken = data.refreshToken?.trim();

    const conn = new jsforce.Connection({
      instanceUrl,
      accessToken,
      refreshToken,
      oauth2: this.oauth2,
    });

    let identity: any;
    try {
      identity = await conn.identity();
    } catch (err: any) {
      this.logger.error(`Direct token validation failed: ${err.message}`);
      throw new UnauthorizedException(
        `Invalid Salesforce Access Token or Instance URL (${err.message}). Please check that the token is active.`,
      );
    }

    const sessionId = existingSessionId || data.userId || `sf_${identity.organization_id}_${Date.now().toString(36)}`;

    const entry: DynamicSessionEntry = {
      sessionId,
      connection: conn,
      instanceUrl: conn.instanceUrl,
      accessToken,
      refreshToken,
      userId: identity.user_id,
      organizationId: identity.organization_id,
      username: identity.username,
      connectedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, entry);
    this.attachRefreshListener(sessionId, conn);
    this.saveSessions();

    this.logger.log(
      `✅ Connected dynamic token session ${sessionId} | Org: ${identity.organization_id}`,
    );

    return {
      sessionId,
      status: {
        connected: true,
        userId: identity.user_id,
        organizationId: identity.organization_id,
        instanceUrl: conn.instanceUrl,
        accessToken: `${accessToken.slice(0, 8)}...`,
        sessionId,
      },
    };
  }

  async connectWithCredentials(
    credentials: {
      username: string;
      password: string;
      securityToken?: string;
      loginUrl?: string;
      userId?: string;
    },
    existingSessionId?: string,
  ): Promise<{ sessionId: string; status: any }> {
    const loginUrl = credentials.loginUrl?.trim() || 'https://login.salesforce.com';
    const username = credentials.username?.trim();
    const password = credentials.password?.trim();
    const securityToken = credentials.securityToken?.trim() || '';

    const fullPassword = securityToken ? `${password}${securityToken}` : password;

    const clientId = this.config.get<string>('salesforce.clientId');
    const clientSecret = this.config.get<string>('salesforce.clientSecret');
    const redirectUri = this.config.get<string>('salesforce.redirectUri');

    let conn: jsforce.Connection;
    let userInfo: any;

    try {
      // 1. Try SOAP Login first
      conn = new jsforce.Connection({ loginUrl });
      try {
        userInfo = await conn.login(username, fullPassword);
      } catch (soapErr: any) {
        // 2. Fallback to OAuth2 password flow if Connected App configured
        if (clientId && clientSecret) {
          const oauthConn = new jsforce.Connection({
            loginUrl,
            oauth2: {
              loginUrl,
              clientId,
              clientSecret,
              redirectUri: redirectUri || 'http://localhost:8000/salesforce/auth/callback',
            },
          });
          userInfo = await oauthConn.login(username, fullPassword);
          conn = oauthConn;
        } else {
          throw soapErr;
        }
      }
    } catch (err: any) {
      this.logger.error(`Dynamic Salesforce login failed: ${err.message}`);
      const isAuthFail =
        err.message?.includes('invalid_grant') ||
        err.message?.includes('INVALID_LOGIN') ||
        err.message?.includes('authentication failure');

      if (isAuthFail) {
        throw new UnauthorizedException(
          'Salesforce login failed: Invalid username, password, or missing Security Token. ' +
            'If your organization requires IP verification, please enter your Salesforce Security Token.',
        );
      }
      throw new UnauthorizedException(`Salesforce connection error: ${err.message}`);
    }

    const sessionId = existingSessionId || credentials.userId || `sf_${userInfo.organizationId}_${Date.now().toString(36)}`;

    const entry: DynamicSessionEntry = {
      sessionId,
      connection: conn,
      instanceUrl: conn.instanceUrl,
      accessToken: conn.accessToken!,
      refreshToken: conn.refreshToken ?? undefined,
      userId: userInfo.id,
      organizationId: userInfo.organizationId,
      username,
      loginUrl,
      connectedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, entry);
    this.attachRefreshListener(sessionId, conn);
    this.saveSessions();

    this.logger.log(
      `✅ Connected dynamic credentials session ${sessionId} | User: ${userInfo.id} | Org: ${userInfo.organizationId}`,
    );

    return {
      sessionId,
      status: {
        connected: true,
        userId: userInfo.id,
        organizationId: userInfo.organizationId,
        instanceUrl: conn.instanceUrl,
        accessToken: conn.accessToken ? `${conn.accessToken.slice(0, 8)}...` : 'N/A',
        sessionId,
      },
    };
  }

  async disconnectSession(sessionId?: string): Promise<{ success: boolean; message: string }> {
    if (sessionId && this.sessions.has(sessionId)) {
      const entry = this.sessions.get(sessionId)!;
      try {
        await entry.connection.logout();
      } catch {
        // ignore
      }
      this.sessions.delete(sessionId);
      this.saveSessions();
      this.logger.log(`Session ${sessionId} disconnected.`);
      return { success: true, message: `Session ${sessionId} disconnected successfully.` };
    }
    if (sessionId === 'default' || !sessionId) {
      if (this.connection) {
        try {
          await this.connection.logout();
        } catch {
          // ignore
        }
        this.connection = null;
        if (fs.existsSync(this.defaultTokenPath)) {
          try {
            fs.unlinkSync(this.defaultTokenPath);
          } catch {
            // ignore
          }
        }
      }
      return { success: true, message: 'Disconnected session.' };
    }
    return { success: true, message: 'Disconnected.' };
  }

  listSessions(): SessionSummary[] {
    const list: SessionSummary[] = [];

    for (const [id, s] of this.sessions.entries()) {
      list.push({
        sessionId: id,
        organizationId: s.organizationId,
        userId: s.userId,
        instanceUrl: s.instanceUrl,
        username: s.username,
        connectedAt: s.connectedAt,
        isDefault: false,
      });
    }

    if (this.connection && this.connection.accessToken) {
      const hasDefaultInList = list.some((item) => item.sessionId === 'default');
      if (!hasDefaultInList) {
        list.unshift({
          sessionId: 'default',
          organizationId: this.loadSessionObject()?.organizationId,
          userId: this.loadSessionObject()?.userId,
          instanceUrl: this.connection.instanceUrl,
          connectedAt: new Date().toISOString(),
          isDefault: true,
        });
      }
    }

    return list;
  }

  // ─── Session Resolution & Connection Context ──────────────────────────────

  getConnection(ctx?: string | ConnectionContext): jsforce.Connection {
    if (typeof ctx === 'string') {
      if (this.sessions.has(ctx)) {
        return this.sessions.get(ctx)!.connection;
      }
      if (ctx === 'default' && this.connection && this.connection.accessToken) {
        return this.connection;
      }
    } else if (ctx && typeof ctx === 'object') {
      // 1. Check if direct stateless token and instance URL provided in request headers
      if (ctx.accessToken && ctx.instanceUrl) {
        return new jsforce.Connection({
          instanceUrl: ctx.instanceUrl,
          accessToken: ctx.accessToken,
          refreshToken: ctx.refreshToken,
          oauth2: this.oauth2,
        });
      }
      // 2. Check sessionId
      if (ctx.sessionId && this.sessions.has(ctx.sessionId)) {
        return this.sessions.get(ctx.sessionId)!.connection;
      }
    }

    // 3. Fallback to default active connection if exists
    if (this.connection && this.connection.accessToken) {
      return this.connection;
    }

    throw new UnauthorizedException(
      'No active Salesforce session. Please connect your Salesforce account first.',
    );
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  async getStatus(ctx?: string | ConnectionContext): Promise<{
    connected: boolean;
    userId?: string;
    organizationId?: string;
    instanceUrl?: string;
    accessToken?: string;
    authUrl?: string;
    sessionId?: string;
    sessionsCount: number;
    sessions: SessionSummary[];
  }> {
    const sessions = this.listSessions();
    let conn: jsforce.Connection | null = null;
    let activeSessionId: string | undefined = undefined;

    try {
      conn = this.getConnection(ctx);
      if (typeof ctx === 'string') {
        activeSessionId = ctx;
      } else if (ctx?.sessionId) {
        activeSessionId = ctx.sessionId;
      } else {
        activeSessionId = 'default';
      }
    } catch {
      return {
        connected: false,
        authUrl: 'http://localhost:8000/salesforce/auth/login',
        sessionsCount: sessions.length,
        sessions,
      };
    }

    try {
      const identity = await conn.identity();
      return {
        connected: true,
        userId: identity.user_id,
        organizationId: identity.organization_id,
        instanceUrl: conn.instanceUrl,
        accessToken: conn.accessToken ? `${conn.accessToken.slice(0, 8)}...` : 'N/A',
        sessionId: activeSessionId,
        sessionsCount: sessions.length,
        sessions,
      };
    } catch {
      return {
        connected: false,
        authUrl: 'http://localhost:8000/salesforce/auth/login',
        sessionsCount: sessions.length,
        sessions,
      };
    }
  }

  // ─── Data Access Methods ──────────────────────────────────────────────────

  async getAccounts(limit = 25, ctx?: string | ConnectionContext): Promise<AccountDto[]> {
    const conn = this.getConnection(ctx);
    const result = await conn.query<AccountDto>(
      `SELECT Id, Name, Industry, Phone, Website, BillingCity, BillingCountry,
              NumberOfEmployees, AnnualRevenue, Type
       FROM Account
       ORDER BY CreatedDate DESC
       LIMIT ${limit}`,
    );
    return result.records;
  }

  async getContacts(limit = 25, ctx?: string | ConnectionContext): Promise<ContactDto[]> {
    const conn = this.getConnection(ctx);
    const result = await conn.query<ContactDto>(
      `SELECT Id, FirstName, LastName, Email, Phone, Title, AccountId,
              Department, LeadSource
       FROM Contact
       ORDER BY CreatedDate DESC
       LIMIT ${limit}`,
    );
    return result.records;
  }

  async getOpportunities(limit = 25, ctx?: string | ConnectionContext): Promise<OpportunityDto[]> {
    const conn = this.getConnection(ctx);
    const result = await conn.query<OpportunityDto>(
      `SELECT Id, Name, StageName, Amount, CloseDate, Probability,
              AccountId, LeadSource, Type, IsClosed, IsWon
       FROM Opportunity
       ORDER BY CreatedDate DESC
       LIMIT ${limit}`,
    );
    return result.records;
  }

  async query<T extends jsforce.Record = jsforce.Record>(
    soql: string,
    ctx?: string | ConnectionContext,
  ): Promise<T[]> {
    const conn = this.getConnection(ctx);
    this.logger.debug(`Executing SOQL: ${soql}`);
    const result = await conn.query<T>(soql);
    return result.records;
  }

  async describeObject(
    objectName: string,
    ctx?: string | ConnectionContext,
  ): Promise<jsforce.DescribeSObjectResult> {
    const conn = this.getConnection(ctx);
    return conn.sobject(objectName).describe();
  }

  // ─── Session Persistence Helpers ──────────────────────────────────────────

  private loadSavedSession(): boolean {
    try {
      if (fs.existsSync(this.defaultTokenPath)) {
        const raw = fs.readFileSync(this.defaultTokenPath, 'utf-8');
        const session: StoredSession = JSON.parse(raw);

        this.connection = new jsforce.Connection({
          oauth2: this.oauth2,
          instanceUrl: session.instanceUrl,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken ?? undefined,
        });

        this.attachRefreshListener('default', this.connection);
        this.logger.log(
          `✅ Restored default session (Org: ${session.organizationId ?? 'N/A'})`,
        );
        return true;
      }
    } catch (err: any) {
      this.logger.warn(`Failed to restore saved session: ${err.message}`);
    }
    return false;
  }

  private saveSession(session: StoredSession): void {
    try {
      fs.writeFileSync(
        this.defaultTokenPath,
        JSON.stringify(session, null, 2),
        'utf-8',
      );
    } catch (err: any) {
      this.logger.error(`Could not save token file: ${err.message}`);
    }
  }

  private loadSavedSessions(): void {
    try {
      if (fs.existsSync(this.sessionsFilePath)) {
        const raw = fs.readFileSync(this.sessionsFilePath, 'utf-8');
        const saved: Array<Omit<DynamicSessionEntry, 'connection'>> = JSON.parse(raw);

        for (const item of saved) {
          const conn = new jsforce.Connection({
            instanceUrl: item.instanceUrl,
            accessToken: item.accessToken,
            refreshToken: item.refreshToken,
            oauth2: this.oauth2,
          });

          this.sessions.set(item.sessionId, {
            ...item,
            connection: conn,
          });

          this.attachRefreshListener(item.sessionId, conn);
        }
        this.logger.log(`✅ Restored ${saved.length} dynamic user sessions.`);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to restore dynamic sessions: ${err.message}`);
    }
  }

  private saveSessions(): void {
    try {
      const serializable = Array.from(this.sessions.values()).map((s) => ({
        sessionId: s.sessionId,
        instanceUrl: s.instanceUrl,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        userId: s.userId,
        organizationId: s.organizationId,
        username: s.username,
        loginUrl: s.loginUrl,
        connectedAt: s.connectedAt,
      }));

      fs.writeFileSync(
        this.sessionsFilePath,
        JSON.stringify(serializable, null, 2),
        'utf-8',
      );
    } catch (err: any) {
      this.logger.error(`Could not save sessions file: ${err.message}`);
    }
  }

  private attachRefreshListener(sessionId: string, conn: jsforce.Connection): void {
    conn.on('refresh', (newAccessToken: string) => {
      this.logger.log(`🔄 Salesforce access token refreshed for session ${sessionId}`);
      const entry = this.sessions.get(sessionId);
      if (entry) {
        entry.accessToken = newAccessToken;
        this.saveSessions();
      }
      if (sessionId === 'default' && this.connection) {
        const current = this.loadSessionObject();
        if (current) {
          current.accessToken = newAccessToken;
          this.saveSession(current);
        }
      }
    });
  }

  private loadSessionObject(): StoredSession | null {
    try {
      if (fs.existsSync(this.defaultTokenPath)) {
        return JSON.parse(fs.readFileSync(this.defaultTokenPath, 'utf-8'));
      }
    } catch {
      // ignore
    }
    return null;
  }

  private async connectWithPassword(username: string, password: string): Promise<void> {
    this.connection = new jsforce.Connection({ oauth2: this.oauth2 });
    const userInfo = await this.connection.login(username, password);

    const session: StoredSession = {
      accessToken: this.connection.accessToken!,
      refreshToken: this.connection.refreshToken,
      instanceUrl: this.connection.instanceUrl,
      userId: userInfo.id,
      organizationId: userInfo.organizationId,
    };
    this.saveSession(session);
    this.attachRefreshListener('default', this.connection);

    this.logger.log(
      `✅ Connected to Salesforce | User: ${userInfo.id} | Org: ${userInfo.organizationId}`,
    );
  }
}
