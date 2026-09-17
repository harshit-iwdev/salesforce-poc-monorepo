'use client';

import React, { useState } from 'react';
import {
  Cloud,
  KeyRound,
  Shield,
  Globe,
  Server,
  ArrowRight,
  Terminal,
  Building2,
  Briefcase,
  Database,
  Info,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Users,
} from 'lucide-react';
import { api, setStoredSession, SalesforceStatus, SessionSummary } from '@/lib/api';

interface LoginGatewayViewProps {
  onConnected: (status: SalesforceStatus) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  availableSessions?: SessionSummary[];
}

type AuthMethod = 'oauth' | 'token' | 'password' | 'server' | 'sessions';

export const LoginGatewayView: React.FC<LoginGatewayViewProps> = ({
  onConnected,
  onShowToast,
  availableSessions = [],
}) => {
  const [method, setMethod] = useState<AuthMethod>('oauth');
  const [loading, setLoading] = useState(false);

  // Form State - Password Flow
  const [loginUrl, setLoginUrl] = useState('https://login.salesforce.com');
  const [customLoginUrl, setCustomLoginUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityToken, setSecurityToken] = useState('');
  const [userIdInput, setUserIdInput] = useState('');

  // Form State - Token Flow
  const [instanceUrl, setInstanceUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const handleOAuthConnect = () => {
    const oauthUrl = api.getOAuthUrl(userIdInput || undefined);
    window.location.href = oauthUrl;
  };

  const handlePasswordConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      onShowToast('error', 'Username and Password are required.');
      return;
    }

    setLoading(true);
    try {
      const effectiveUrl = loginUrl === 'custom' ? customLoginUrl : loginUrl;
      const res = await api.connectPassword({
        username: username.trim(),
        password: password.trim(),
        securityToken: securityToken.trim() || undefined,
        userId: userIdInput.trim() || undefined,
        loginUrl: effectiveUrl,
      });

      setStoredSession(res.sessionId, { username, instanceUrl: res.status.instanceUrl });
      onShowToast('success', `Connected to Salesforce Org: ${res.status.organizationId ?? ''}`);
      onConnected(res.status);
    } catch (err: any) {
      onShowToast('error', `Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceUrl.trim() || !accessToken.trim()) {
      onShowToast('error', 'Instance URL and Access Token are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.connectToken({
        instanceUrl: instanceUrl.trim(),
        accessToken: accessToken.trim(),
        userId: userIdInput.trim() || undefined,
      });

      setStoredSession(res.sessionId, { instanceUrl: res.status.instanceUrl });
      onShowToast('success', `Direct token connect successful! Org: ${res.status.organizationId ?? ''}`);
      onConnected(res.status);
    } catch (err: any) {
      onShowToast('error', `Token connect failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaultOrg = async () => {
    setLoading(true);
    try {
      setStoredSession('default');
      const status = await api.getStatus();
      if (status.connected) {
        onShowToast('success', `Connected to Server Org (${status.organizationId ?? 'Default'})`);
        onConnected(status);
      } else {
        setStoredSession(null);
        onShowToast('error', 'Server org session is not active. Please authenticate using OAuth or token.');
      }
    } catch (err: any) {
      setStoredSession(null);
      onShowToast('error', `Failed to connect server org: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (session: SessionSummary) => {
    setLoading(true);
    try {
      if (session.isDefault || session.sessionId === 'default') {
        setStoredSession('default');
      } else {
        setStoredSession(session.sessionId, {
          instanceUrl: session.instanceUrl,
          organizationId: session.organizationId,
          username: session.username,
        });
      }

      const status = await api.getStatus();
      if (status.connected) {
        onShowToast('success', `Connected to Org: ${session.organizationId || session.sessionId}`);
        onConnected(status);
      } else {
        onShowToast('error', 'Selected session is no longer active.');
      }
    } catch (err: any) {
      onShowToast('error', `Failed to connect session: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      {/* Hero Branding */}
      <div style={{ textAlign: 'center', maxWidth: '680px', marginBottom: '2rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #00a1e0 0%, #0284c7 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(0, 161, 224, 0.45)',
          marginBottom: '1rem',
        }}>
          <Cloud size={32} color="white" />
        </div>
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: '0 0 0.5rem',
          background: 'linear-gradient(135deg, #f8fafc 30%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Salesforce Dynamic Gateway
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
          Connect Salesforce accounts dynamically or choose your authentication flow.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="card" style={{
        width: '100%',
        maxWidth: '580px',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(14, 165, 233, 0.1)',
      }}>
        {/* Method Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.4rem',
          marginBottom: '1.75rem',
          padding: '0.35rem',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <button
            type="button"
            onClick={() => setMethod('oauth')}
            className={`btn btn-sm ${method === 'oauth' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.55rem 0.25rem' }}
          >
            <Globe size={14} />
            <span>OAuth Web</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('token')}
            className={`btn btn-sm ${method === 'token' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.55rem 0.25rem' }}
          >
            <KeyRound size={14} />
            <span>Access Token</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('password')}
            className={`btn btn-sm ${method === 'password' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.55rem 0.25rem' }}
          >
            <Shield size={14} />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('server')}
            className={`btn btn-sm ${method === 'server' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.55rem 0.25rem' }}
          >
            <Server size={14} />
            <span>Server .env</span>
          </button>
        </div>

        {/* Method 1: OAuth Web Flow */}
        {method === 'oauth' && (
          <div>
            <div style={{
              background: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              borderRadius: '12px',
              padding: '1.15rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <Sparkles size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 0.35rem' }}>
                    Multi-User OAuth 2.0 Flow
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    Connects directly through Salesforce login with automatic token refresh.
                  </p>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">User / Tenant Identifier (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. user_acme_corp or user_101"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={handleOAuthConnect}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }}
            >
              <span>Sign In & Authorize with Salesforce</span>
              <ExternalLink size={16} />
            </button>
          </div>
        )}

        {/* Method 2: Direct Access Token */}
        {method === 'token' && (
          <form onSubmit={handleTokenConnect}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.825rem',
              color: '#cbd5e1',
            }}>
              Connect using an active Salesforce Bearer Token or Session ID and Instance URL.
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Salesforce Instance URL *</label>
              <input
                type="url"
                className="input"
                placeholder="https://yourorg.my.salesforce.com"
                value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Salesforce Access / Session Token *</label>
              <textarea
                className="input"
                style={{ minHeight: '85px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                placeholder="00Dg800000... (Bearer Token)"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">User / Session Alias (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. user_finance_app"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {loading ? 'Validating Token...' : 'Connect Direct Token'}
            </button>
          </form>
        )}

        {/* Method 3: Password Flow */}
        {method === 'password' && (
          <form onSubmit={handlePasswordConnect}>
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label">Salesforce Login Domain</label>
              <select
                className="input select"
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
              >
                <option value="https://login.salesforce.com">Production / Developer Edition (login.salesforce.com)</option>
                <option value="https://test.salesforce.com">Sandbox Org (test.salesforce.com)</option>
                <option value="custom">Custom My Domain URL</option>
              </select>
            </div>

            {loginUrl === 'custom' && (
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Custom Domain URL *</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://company.my.salesforce.com"
                  value={customLoginUrl}
                  onChange={(e) => setCustomLoginUrl(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label">Username (Email) *</label>
              <input
                type="email"
                className="input"
                placeholder="user@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="input"
                placeholder="Salesforce Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Security Token (Optional if IP is whitelisted)</label>
              <input
                type="password"
                className="input"
                placeholder="Salesforce Security Token"
                value={securityToken}
                onChange={(e) => setSecurityToken(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {loading ? 'Authenticating...' : 'Connect with Password'}
            </button>
          </form>
        )}

        {/* Method 4: Server .env Session */}
        {method === 'server' && (
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '1.15rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <Server size={20} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 0.35rem' }}>
                    Server Default Org Session
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    Connect instantly using the server's existing authenticated session (`.salesforce-token.json` or `.env`).
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUseDefaultOrg}
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }}
            >
              <span>Connect Using Server Session</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
