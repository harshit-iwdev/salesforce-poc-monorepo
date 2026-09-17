'use client';

import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  Globe,
  Server,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Info,
  Check,
  Trash2,
  Users,
} from 'lucide-react';
import { api, setStoredSession, getStoredSessionId, SalesforceStatus, SessionSummary } from '@/lib/api';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (status: SalesforceStatus) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  currentStatus: SalesforceStatus | null;
}

type AuthMethod = 'oauth' | 'token' | 'password' | 'sessions';

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  onShowToast,
  currentStatus,
}) => {
  const [method, setMethod] = useState<AuthMethod>('oauth');
  const [loading, setLoading] = useState(false);

  // Password Flow Form
  const [loginUrl, setLoginUrl] = useState('https://login.salesforce.com');
  const [customLoginUrl, setCustomLoginUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityToken, setSecurityToken] = useState('');
  const [userIdInput, setUserIdInput] = useState('');

  // Token Flow Form
  const [instanceUrl, setInstanceUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');

  if (!isOpen) return null;

  const activeSessionId = getStoredSessionId();
  const sessions = currentStatus?.sessions || [];

  const handleOAuthConnect = () => {
    const oauthUrl = api.getOAuthUrl(userIdInput || undefined);
    window.location.href = oauthUrl;
  };

  const handlePasswordConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      onShowToast('error', 'Username and Password are required.');
      return;
    }

    setLoading(true);
    try {
      const effectiveUrl = loginUrl === 'custom' ? customLoginUrl : loginUrl;
      const res = await api.connectPassword({
        username,
        password,
        securityToken: securityToken || undefined,
        userId: userIdInput || undefined,
        loginUrl: effectiveUrl,
      });

      setStoredSession(res.sessionId, { username, instanceUrl: res.status.instanceUrl });
      onShowToast('success', `Connected successfully to Org ${res.status.organizationId ?? ''}!`);
      onConnected(res.status);
      onClose();
    } catch (err: any) {
      onShowToast('error', `Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceUrl || !accessToken) {
      onShowToast('error', 'Instance URL and Access Token are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.connectToken({
        instanceUrl,
        accessToken,
        userId: userIdInput || undefined,
      });

      setStoredSession(res.sessionId, { instanceUrl: res.status.instanceUrl });
      onShowToast('success', `Direct token connection active! Org: ${res.status.organizationId ?? ''}`);
      onConnected(res.status);
      onClose();
    } catch (err: any) {
      onShowToast('error', `Token connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSession = async (session: SessionSummary) => {
    setLoading(true);
    try {
      if (session.isDefault || session.sessionId === 'default') {
        setStoredSession(null);
      } else {
        setStoredSession(session.sessionId, {
          instanceUrl: session.instanceUrl,
          organizationId: session.organizationId,
          username: session.username,
        });
      }

      const status = await api.getStatus();
      if (status.connected) {
        onShowToast('success', `Switched to Org ${session.organizationId || session.sessionId}`);
        onConnected(status);
        onClose();
      } else {
        onShowToast('error', 'Selected session is no longer active.');
      }
    } catch (err: any) {
      onShowToast('error', `Failed to switch session: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.disconnect(sessionId);
      if (getStoredSessionId() === sessionId) {
        setStoredSession(null);
      }
      onShowToast('info', `Session ${sessionId} disconnected.`);
      const updatedStatus = await api.getStatus();
      onConnected(updatedStatus);
    } catch (err: any) {
      onShowToast('error', `Failed to disconnect: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}>
              <Sparkles size={18} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Multi-Org Connection Gateway
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Connect dynamic Salesforce accounts or switch active user sessions
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Auth Method Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.4rem',
          padding: '1rem 1.5rem 0.5rem',
        }}>
          <button
            type="button"
            onClick={() => setMethod('oauth')}
            className={`btn btn-sm ${method === 'oauth' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.6rem 0.3rem' }}
          >
            <Globe size={14} />
            <span>OAuth Web</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('token')}
            className={`btn btn-sm ${method === 'token' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.6rem 0.3rem' }}
          >
            <KeyRound size={14} />
            <span>Access Token</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('password')}
            className={`btn btn-sm ${method === 'password' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.6rem 0.3rem' }}
          >
            <ShieldCheck size={14} />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('sessions')}
            className={`btn btn-sm ${method === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.6rem 0.3rem' }}
          >
            <Users size={14} />
            <span>Sessions ({sessions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* Method 1: OAuth Web Flow */}
          {method === 'oauth' && (
            <div>
              <div style={{
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <Info size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    <strong>Recommended Dynamic Multi-User Flow:</strong> Authenticate via official Salesforce OAuth. 
                    Users never share passwords, and tokens automatically refresh in the background.
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">User / Tenant Identifier (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. user_tenant_492 (defaults to org id)"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={handleOAuthConnect}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
              >
                <span>Authorize & Connect with Salesforce</span>
                <ExternalLink size={16} />
              </button>
            </div>
          )}

          {/* Method 2: Access Token */}
          {method === 'token' && (
            <form onSubmit={handleTokenConnect}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.825rem',
                color: '#cbd5e1',
              }}>
                Direct token connection using an active Bearer Token or Session ID and Instance Domain.
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
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

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Salesforce Access / Session Token *</label>
                <textarea
                  className="input"
                  style={{ minHeight: '75px', fontFamily: 'var(--font-mono)' }}
                  placeholder="00Dg800000... (Bearer Token / Session ID)"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">User / Session Alias (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. user_finance_team"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '0.8rem' }}
              >
                {loading ? 'Validating Token...' : 'Connect Direct Token'}
              </button>
            </form>
          )}

          {/* Method 3: Password Flow */}
          {method === 'password' && (
            <form onSubmit={handlePasswordConnect}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
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
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
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

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
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

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
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
                style={{ width: '100%', padding: '0.8rem' }}
              >
                {loading ? 'Authenticating with Salesforce...' : 'Connect with Password'}
              </button>
            </form>
          )}

          {/* Method 4: Active Sessions List */}
          {method === 'sessions' && (
            <div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                Switch between active user Salesforce connections in the multi-tenant session store:
              </div>

              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No active sessions found. Connect an org using OAuth, Token, or Password.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {sessions.map((s) => {
                    const isCurrent = activeSessionId === s.sessionId || (!activeSessionId && s.isDefault);
                    return (
                      <div
                        key={s.sessionId}
                        onClick={() => handleSwitchSession(s)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          background: isCurrent ? 'rgba(14, 165, 233, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                          border: isCurrent ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                              {s.organizationId || s.sessionId}
                            </span>
                            {s.isDefault && (
                              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', background: '#0369a1', color: '#e0f2fe', borderRadius: '4px' }}>
                                Default
                              </span>
                            )}
                            {isCurrent && (
                              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', background: '#065f46', color: '#a7f3d0', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Check size={10} /> Active
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                            {s.instanceUrl} {s.username ? `• ${s.username}` : ''}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={(e) => handleDisconnectSession(s.sessionId, e)}
                            title="Disconnect this session"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
