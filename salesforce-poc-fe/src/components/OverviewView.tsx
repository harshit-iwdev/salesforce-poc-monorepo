'use client';

import React from 'react';
import {
  Building2,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Terminal,
  Database,
  ArrowRight,
  Shield,
  Server,
  Activity,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react';
import { SalesforceStatus, Account, Contact, Opportunity } from '@/lib/api';
import { TabType } from './Navbar';

interface OverviewViewProps {
  status: SalesforceStatus | null;
  accounts: Account[];
  contacts: Contact[];
  opportunities: Opportunity[];
  loading: boolean;
  onSelectTab: (tab: TabType) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  status,
  accounts,
  contacts,
  opportunities,
  loading,
  onSelectTab,
  onShowToast,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    onShowToast('success', `Copied ${label}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isConnected = status?.connected ?? false;

  // Compute metrics
  const totalPipeline = opportunities.reduce((sum, opp) => sum + (opp.Amount || 0), 0);
  const wonDeals = opportunities.filter((o) => o.IsWon);
  const wonPipeline = wonDeals.reduce((sum, opp) => sum + (opp.Amount || 0), 0);
  const avgProbability = opportunities.length > 0
    ? Math.round(opportunities.reduce((sum, opp) => sum + (opp.Probability || 0), 0) / opportunities.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Telemetry Banner */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
              <div className={`pulse-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                <span className="pulse-dot" />
                <span>{isConnected ? 'Active Salesforce Org' : 'Not Connected'}</span>
              </div>
              {status?.sessionId && (
                <span className="code-pill">Session: {status.sessionId.slice(0, 8)}</span>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Salesforce Operational Telemetry
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Real-time synchronization across CRM core objects, custom SOQL query engine, and schema metadata.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => onSelectTab('soql')}
              className="btn btn-outline btn-sm"
            >
              <Terminal size={15} />
              <span>Query Studio</span>
            </button>
            <button
              onClick={() => onSelectTab('schema')}
              className="btn btn-secondary btn-sm"
            >
              <Database size={15} />
              <span>Inspect Schema</span>
            </button>
          </div>
        </div>

        {/* Telemetry Detail Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          {/* Org ID */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Organization ID
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
              <span className="code-pill" style={{ fontSize: '0.85rem' }}>
                {status?.organizationId || 'Unavailable'}
              </span>
              {status?.organizationId && (
                <button
                  onClick={() => copyText('Organization ID', status.organizationId!)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  title="Copy Org ID"
                >
                  {copiedField === 'Organization ID' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* User ID */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Logged-in User ID
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
              <span className="code-pill" style={{ fontSize: '0.85rem' }}>
                {status?.userId || 'Unavailable'}
              </span>
              {status?.userId && (
                <button
                  onClick={() => copyText('User ID', status.userId!)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  title="Copy User ID"
                >
                  {copiedField === 'User ID' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Instance URL */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Instance Endpoint
            </div>
            <div style={{ marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <a
                href={status?.instanceUrl || '#'}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#38bdf8', fontSize: '0.825rem', textDecoration: 'none' }}
              >
                {status?.instanceUrl ? status.instanceUrl.replace('https://', '') : 'Not connected'}
              </a>
            </div>
          </div>

          {/* Token Status */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Access Token Security
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
              <Shield size={14} color="#10b981" />
              <span style={{ fontSize: '0.825rem', color: '#34d399', fontWeight: 500 }}>
                {status?.accessToken ? `Masked (${status.accessToken})` : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Total Accounts */}
        <div
          className="glass-card"
          onClick={() => onSelectTab('accounts')}
          style={{ padding: '1.35rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 500 }}>Accounts</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Building2 size={20} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.75rem' }}>
            {loading ? '...' : accounts.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.5rem' }}>
            <span>Explore directory</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* Total Contacts */}
        <div
          className="glass-card"
          onClick={() => onSelectTab('contacts')}
          style={{ padding: '1.35rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 500 }}>Contacts</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={20} color="#c084fc" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.75rem' }}>
            {loading ? '...' : contacts.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#c084fc', marginTop: '0.5rem' }}>
            <span>View contacts roster</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* Total Opportunities */}
        <div
          className="glass-card"
          onClick={() => onSelectTab('opportunities')}
          style={{ padding: '1.35rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 500 }}>Opportunities</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Briefcase size={20} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.75rem' }}>
            {loading ? '...' : opportunities.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.5rem' }}>
            <span>Kanban & Pipeline</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* Total Pipeline Value */}
        <div
          className="glass-card"
          onClick={() => onSelectTab('opportunities')}
          style={{ padding: '1.35rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 500 }}>Total Pipeline</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <DollarSign size={20} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#34d399', marginTop: '0.75rem' }}>
            {loading ? '...' : `$${totalPipeline.toLocaleString()}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#34d399', marginTop: '0.5rem' }}>
            <span>${wonPipeline.toLocaleString()} won</span>
          </div>
        </div>
      </div>

      {/* Quick Launchpad & High Value Opportunities */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Quick Launchpad */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.35rem' }}>
            API & Feature Quick Launch
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            Direct access to core Salesforce POC capabilities and testing tools.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => onSelectTab('soql')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#f8fafc',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Terminal size={18} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Execute SOQL Queries</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Run custom SOQL syntax and export results to CSV</div>
                </div>
              </div>
              <ArrowRight size={16} color="#64748b" />
            </button>

            <button
              onClick={() => onSelectTab('schema')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#f8fafc',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Database size={18} color="#a855f7" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Describe Object Schemas</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Inspect standard and custom object fields & types</div>
                </div>
              </div>
              <ArrowRight size={16} color="#64748b" />
            </button>

            <button
              onClick={() => onSelectTab('opportunities')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#f8fafc',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Briefcase size={18} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Visual Kanban Pipeline</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Monitor deal stages, win probabilities, and values</div>
                </div>
              </div>
              <ArrowRight size={16} color="#64748b" />
            </button>
          </div>
        </div>

        {/* High-Value Deals Preview */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
              Top Pipeline Deals
            </h2>
            <button
              onClick={() => onSelectTab('opportunities')}
              className="btn btn-outline btn-sm"
            >
              View all
            </button>
          </div>

          {opportunities.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              {loading ? 'Loading opportunities...' : 'No opportunities found in this Salesforce org.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {opportunities.slice(0, 4).map((opp) => (
                <div
                  key={opp.Id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.9rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {opp.Name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      {opp.StageName} • {opp.Probability ?? 0}% Win Prob
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399' }}>
                      {opp.Amount ? `$${opp.Amount.toLocaleString()}` : '$0'}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      {opp.CloseDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
