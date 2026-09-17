import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import * as jsforce from 'jsforce';
import { AccountDto } from './dto/account.dto.js';
import { ContactDto } from './dto/contact.dto.js';
import { OpportunityDto } from './dto/opportunity.dto.js';
import { ConnectionContext, SalesforceService } from './salesforce.service.js';

@ApiTags('salesforce')
@Controller('salesforce')
export class SalesforceController {
  constructor(private readonly salesforceService: SalesforceService) {}

  private extractContext(
    sessionId?: string,
    accessToken?: string,
    instanceUrl?: string,
  ): ConnectionContext {
    return {
      sessionId: sessionId?.trim() || undefined,
      accessToken: accessToken?.trim() || undefined,
      instanceUrl: instanceUrl?.trim() || undefined,
    };
  }

  // ─── OAuth 2.0 Web Flow ──────────────────────────────────────────────────

  @Get('auth/login')
  @ApiOperation({
    summary: 'Start Salesforce OAuth Login',
    description:
      'Redirects to the official Salesforce OAuth authorization screen. Pass ?userId=... or ?state=... for dynamic multi-user binding.',
  })
  @ApiQuery({ name: 'state', required: false, description: 'Optional user/state identifier' })
  @ApiQuery({ name: 'userId', required: false, description: 'Optional user ID to associate session' })
  @ApiQuery({ name: 'redirectUrl', required: false, description: 'Frontend redirect URL after login' })
  login(
    @Query('state') state: string,
    @Query('userId') userId: string,
    @Query('redirectUrl') redirectUrl: string,
    @Res() res: Response,
  ): void {
    const customState = state || userId || '';
    const authUrl = this.salesforceService.getAuthorizationUrl(customState);
    res.redirect(authUrl);
  }

  @Get('auth/callback')
  @ApiOperation({
    summary: 'Salesforce OAuth Callback',
    description:
      'Receives authorization code, establishes dynamic session, and redirects to frontend or returns session payload.',
  })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!code) {
      res.status(HttpStatus.BAD_REQUEST).send('Missing authorization code.');
      return;
    }

    const { session, sessionId, userInfo } = await this.salesforceService.authorizeWithCode(code, state);

    // If frontend is running at localhost:3001, redirect with session details
    const frontendUrl = `http://localhost:3001/?session_id=${encodeURIComponent(sessionId)}&org_id=${encodeURIComponent(session.organizationId || '')}&user_id=${encodeURIComponent(session.userId || '')}&connected=true`;

    res.type('html').send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Salesforce Connected</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0b1120; color: #f8fafc; }
          .card { background: #1e293b; padding: 2.5rem; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 480px; border: 1px solid rgba(255,255,255,0.1); }
          h1 { color: #38bdf8; margin: 0.5rem 0 1rem; font-size: 1.6rem; }
          p { line-height: 1.6; color: #94a3b8; font-size: 0.95rem; }
          .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 600; font-size: 0.825rem; border: 1px solid rgba(52, 211, 153, 0.3); }
          .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #0284c7; color: white; border-radius: 10px; text-decoration: none; font-weight: 600; transition: background 0.2s; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4); }
          .btn:hover { background: #0369a1; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● Connected Successfully</div>
          <h1>Salesforce Authorized!</h1>
          <p>Connected to Salesforce Organization <strong>${session.organizationId ?? ''}</strong></p>
          <p>Session ID: <code style="background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8;">${sessionId}</code></p>
          <a class="btn" href="${frontendUrl}">Open Frontend Console</a>
        </div>
        <script>
          // Notify opener if opened as popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'SALESFORCE_AUTH_SUCCESS',
              sessionId: '${sessionId}',
              organizationId: '${session.organizationId}',
              userId: '${session.userId}'
            }, '*');
            setTimeout(() => window.close(), 1500);
          } else {
            // Automatic redirect
            setTimeout(() => { window.location.href = '${frontendUrl}'; }, 1000);
          }
        </script>
      </body>
      </html>
    `);
  }

  // ─── Dynamic Multi-Session Endpoints ─────────────────────────────────────

  @Get('auth/sessions')
  @ApiOperation({
    summary: 'List active Salesforce user sessions',
    description: 'Returns all currently connected user sessions in the dynamic multi-tenant session store.',
  })
  getSessions() {
    return this.salesforceService.listSessions();
  }

  @Post('auth/connect-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connect dynamically using Username, Password, and Security Token',
    description:
      'Creates a dynamic Salesforce session for a specific user without requiring hardcoded server .env credentials.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'MyPassword123' },
        securityToken: { type: 'string', example: 'abc123token' },
        userId: { type: 'string', example: 'user_123' },
        loginUrl: {
          type: 'string',
          example: 'https://login.salesforce.com',
          default: 'https://login.salesforce.com',
        },
      },
    },
  })
  async connectPassword(
    @Body()
    body: {
      username: string;
      password: string;
      securityToken?: string;
      userId?: string;
      loginUrl?: string;
    },
  ) {
    return this.salesforceService.connectWithCredentials(body);
  }

  @Post('auth/connect-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connect dynamically using Access Token and Instance URL',
    description:
      'Directly links a session to an existing active access token and instance URL for a user.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['instanceUrl', 'accessToken'],
      properties: {
        instanceUrl: {
          type: 'string',
          example: 'https://yourorg.my.salesforce.com',
        },
        accessToken: { type: 'string', example: '00D...' },
        refreshToken: { type: 'string' },
        userId: { type: 'string', example: 'user_123' },
      },
    },
  })
  async connectToken(
    @Body()
    body: {
      instanceUrl: string;
      accessToken: string;
      refreshToken?: string;
      userId?: string;
    },
  ) {
    return this.salesforceService.connectWithToken(body);
  }

  @Post('auth/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disconnect a session',
    description: 'Invalidates and removes a dynamic session.',
  })
  async disconnect(
    @Headers('x-salesforce-session') sessionId?: string,
    @Body() body?: { sessionId?: string },
  ) {
    const targetSession = body?.sessionId || sessionId;
    return this.salesforceService.disconnectSession(targetSession);
  }

  // ─── Status ─────────────────────────────────────────────────────────────

  @Get('status')
  @Get('auth/status')
  @ApiOperation({
    summary: 'Connection health check',
    description:
      'Returns the Salesforce connection status along with the logged-in user ID, ' +
      'organization ID, and active sessions list.',
  })
  @ApiHeader({
    name: 'x-salesforce-session',
    required: false,
    description: 'Dynamic session ID from dynamic login',
  })
  @ApiHeader({
    name: 'x-salesforce-access-token',
    required: false,
    description: 'Stateless direct access token',
  })
  @ApiHeader({
    name: 'x-salesforce-instance-url',
    required: false,
    description: 'Stateless direct instance URL',
  })
  async getStatus(
    @Headers('x-salesforce-session') sessionId?: string,
    @Headers('x-salesforce-access-token') accessToken?: string,
    @Headers('x-salesforce-instance-url') instanceUrl?: string,
  ) {
    const ctx = this.extractContext(sessionId, accessToken, instanceUrl);
    return this.salesforceService.getStatus(ctx);
  }

  // ─── Accounts ────────────────────────────────────────────────────────────

  @Get('accounts')
  @ApiOperation({
    summary: 'List Salesforce Accounts',
    description:
      'Returns Account records ordered by most recently created. Supports dynamic session header or stateless token headers.',
  })
  @ApiHeader({ name: 'x-salesforce-session', required: false, description: 'Dynamic session ID' })
  @ApiHeader({ name: 'x-salesforce-access-token', required: false })
  @ApiHeader({ name: 'x-salesforce-instance-url', required: false })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 25,
    description: 'Maximum number of records to return (default: 25)',
  })
  @ApiOkResponse({ type: [AccountDto], description: 'Array of Account records' })
  async getAccounts(
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Headers('x-salesforce-session') sessionId?: string,
    @Headers('x-salesforce-access-token') accessToken?: string,
    @Headers('x-salesforce-instance-url') instanceUrl?: string,
  ): Promise<AccountDto[]> {
    const ctx = this.extractContext(sessionId, accessToken, instanceUrl);
    return this.salesforceService.getAccounts(limit, ctx);
  }

  // ─── Contacts ────────────────────────────────────────────────────────────

  @Get('contacts')
  @ApiOperation({
    summary: 'List Salesforce Contacts',
    description:
      'Returns Contact records ordered by most recently created. Includes name, email, phone, title, and parent Account ID.',
  })
  @ApiHeader({ name: 'x-salesforce-session', required: false, description: 'Dynamic session ID' })
  @ApiHeader({ name: 'x-salesforce-access-token', required: false })
  @ApiHeader({ name: 'x-salesforce-instance-url', required: false })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 25,
    description: 'Maximum number of records to return (default: 25)',
  })
  @ApiOkResponse({ type: [ContactDto], description: 'Array of Contact records' })
  async getContacts(
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Headers('x-salesforce-session') sessionId?: string,
    @Headers('x-salesforce-access-token') accessToken?: string,
    @Headers('x-salesforce-instance-url') instanceUrl?: string,
  ): Promise<ContactDto[]> {
    const ctx = this.extractContext(sessionId, accessToken, instanceUrl);
    return this.salesforceService.getContacts(limit, ctx);
  }

  // ─── Opportunities ────────────────────────────────────────────────────────

  @Get('opportunities')
  @ApiOperation({
    summary: 'List Salesforce Opportunities',
    description:
      'Returns Opportunity records ordered by most recently created. Includes stage, amount, probability, close date, and won status.',
  })
  @ApiHeader({ name: 'x-salesforce-session', required: false, description: 'Dynamic session ID' })
  @ApiHeader({ name: 'x-salesforce-access-token', required: false })
  @ApiHeader({ name: 'x-salesforce-instance-url', required: false })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 25,
    description: 'Maximum number of records to return (default: 25)',
  })
  @ApiOkResponse({
    type: [OpportunityDto],
    description: 'Array of Opportunity records',
  })
  async getOpportunities(
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Headers('x-salesforce-session') sessionId?: string,
    @Headers('x-salesforce-access-token') accessToken?: string,
    @Headers('x-salesforce-instance-url') instanceUrl?: string,
  ): Promise<OpportunityDto[]> {
    const ctx = this.extractContext(sessionId, accessToken, instanceUrl);
    return this.salesforceService.getOpportunities(limit, ctx);
  }

  // ─── Generic SOQL Query ───────────────────────────────────────────────────

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute a raw SOQL query',
    description:
      'Runs any valid SOQL query directly against Salesforce using the user session and returns the raw records.',
  })
  @ApiHeader({ name: 'x-salesforce-session', required: false, description: 'Dynamic session ID' })
  @ApiHeader({ name: 'x-salesforce-access-token', required: false })
  @ApiHeader({ name: 'x-salesforce-instance-url', required: false })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['soql'],
      properties: {
        soql: {
          type: 'string',
          example: 'SELECT Id, Name, StageName, Amount FROM Opportunity WHERE IsWon = true LIMIT 10',
          description: 'Any valid SOQL query string',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Array of records matching the SOQL query',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  async query(
    @Body('soql') soql: string,
    @Headers('x-salesforce-session') sessionId?: string,
    @Headers('x-salesforce-access-token') accessToken?: string,
    @Headers('x-salesforce-instance-url') instanceUrl?: string,
  ): Promise<jsforce.Record[]> {
    const ctx = this.extractContext(sessionId, accessToken, instanceUrl);
    return this.salesforceService.query(soql, ctx);
  }

  // ─── Object Metadata Describe ─────────────────────────────────────────────

  @Get('describe/:object')
  @ApiOperation({
    summary: 'Describe Salesforce Object metadata',
    description:
      'Returns complete metadata for a standard or custom Salesforce object, including all fields, picklist values, and child relationships.',
  })
  @ApiHeader({ name: 'x-salesforce-session', required: false, description: 'Dynamic session ID' })
  @ApiHeader({ name: 'x-salesforce-access-token', required: false })
  @ApiHeader({ name: 'x-salesforce-instance-url', required: false })
  @ApiParam({
    name: 'object',
    example: 'Account',
    description: 'API name of the standard or custom object (e.g., Account, Contact, CustomObject__c)',
  })
  @ApiOkResponse({
    description: 'Object describe metadata',
  })
  async describeObject(
    @Param('object') objectName: string,
    @Headers('x-salesforce-session') sessionId?: string,
    @Headers('x-salesforce-access-token') accessToken?: string,
    @Headers('x-salesforce-instance-url') instanceUrl?: string,
  ): Promise<jsforce.DescribeSObjectResult> {
    const ctx = this.extractContext(sessionId, accessToken, instanceUrl);
    return this.salesforceService.describeObject(objectName, ctx);
  }
}
