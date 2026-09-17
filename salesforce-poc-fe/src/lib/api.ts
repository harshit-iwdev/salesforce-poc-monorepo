export interface SessionSummary {
  sessionId: string;
  organizationId?: string;
  userId?: string;
  instanceUrl: string;
  username?: string;
  connectedAt: string;
  isDefault?: boolean;
}

export interface SalesforceStatus {
  connected: boolean;
  userId?: string;
  organizationId?: string;
  instanceUrl?: string;
  accessToken?: string;
  authUrl?: string;
  sessionId?: string;
  sessionsCount?: number;
  sessions?: SessionSummary[];
}

export interface Account {
  Id: string;
  Name: string;
  Industry: string | null;
  Phone: string | null;
  Website: string | null;
  BillingCity: string | null;
  BillingCountry: string | null;
  NumberOfEmployees: number | null;
  AnnualRevenue: number | null;
  Type: string | null;
}

export interface Contact {
  Id: string;
  FirstName: string | null;
  LastName: string;
  Email: string | null;
  Phone: string | null;
  Title: string | null;
  AccountId: string | null;
  Department: string | null;
  LeadSource: string | null;
}

export interface Opportunity {
  Id: string;
  Name: string;
  StageName: string;
  Amount: number | null;
  CloseDate: string;
  Probability: number | null;
  AccountId: string | null;
  LeadSource: string | null;
  Type: string | null;
  IsClosed: boolean;
  IsWon: boolean;
}

export interface DescribeField {
  name: string;
  label: string;
  type: string;
  length?: number;
  updateable?: boolean;
  createable?: boolean;
  nillable?: boolean;
  picklistValues?: Array<{ label: string; value: string; active?: boolean; defaultValue?: boolean }>;
  referenceTo?: string[];
  relationshipName?: string;
}

export interface DescribeResult {
  name: string;
  label: string;
  keyPrefix?: string;
  custom?: boolean;
  fields: DescribeField[];
  childRelationships?: Array<{ childSObject: string; field: string; relationshipName?: string }>;
  recordTypeInfos?: Array<{ name: string; recordTypeId: string; active: boolean; defaultRecordTypeMapping: boolean }>;
}

const SESSION_KEY = 'salesforce_active_session_id';
const SESSION_META_KEY = 'salesforce_active_session_meta';

export function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setStoredSession(sessionId: string | null, meta?: any) {
  if (typeof window === 'undefined') return;
  if (sessionId) {
    localStorage.setItem(SESSION_KEY, sessionId);
    if (meta) {
      localStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
    }
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_META_KEY);
  }
}

export function getStoredSessionMeta(): any {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const sessionId = getStoredSessionId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (sessionId && sessionId !== 'default') {
    headers['x-salesforce-session'] = sessionId;
  }

  // Direct backend call first, fallback to rewrites if CORS error
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    try {
      res = await fetch(`/api/backend${endpoint}`, {
        ...options,
        headers,
      });
    } catch {
      throw new Error(`Connection error to Salesforce backend: ${err.message}`);
    }
  }

  if (!res.ok) {
    let errMessage = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody.message) {
        errMessage = Array.isArray(errBody.message) ? errBody.message.join(', ') : errBody.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getStatus: () => request<SalesforceStatus>('/salesforce/status'),

  getSessions: () => request<SessionSummary[]>('/salesforce/auth/sessions'),

  connectPassword: (data: { username: string; password: string; securityToken?: string; userId?: string; loginUrl?: string }) =>
    request<{ sessionId: string; status: SalesforceStatus }>('/salesforce/auth/connect-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  connectToken: (data: { instanceUrl: string; accessToken: string; refreshToken?: string; userId?: string }) =>
    request<{ sessionId: string; status: SalesforceStatus }>('/salesforce/auth/connect-token', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  disconnect: (sessionId?: string) =>
    request<{ success: boolean; message: string }>('/salesforce/auth/disconnect', {
      method: 'POST',
      body: JSON.stringify({ sessionId: sessionId || getStoredSessionId() }),
    }),

  getAccounts: (limit = 25) =>
    request<Account[]>(`/salesforce/accounts?limit=${limit}`),

  getContacts: (limit = 25) =>
    request<Contact[]>(`/salesforce/contacts?limit=${limit}`),

  getOpportunities: (limit = 25) =>
    request<Opportunity[]>(`/salesforce/opportunities?limit=${limit}`),

  runQuery: (soql: string) =>
    request<any[]>('/salesforce/query', {
      method: 'POST',
      body: JSON.stringify({ soql }),
    }),

  describeObject: (objectName: string) =>
    request<DescribeResult>(`/salesforce/describe/${encodeURIComponent(objectName)}`),

  getOAuthUrl: (userId?: string) => {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return `${BASE_URL}/salesforce/auth/login${params}`;
  },
};
