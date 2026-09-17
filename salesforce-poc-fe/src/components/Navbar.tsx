'use client';

import React from 'react';
import {
  Cloud,
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  Terminal,
  Database,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { SalesforceStatus } from '@/lib/api';

export type TabType = 'overview' | 'accounts' | 'contacts' | 'opportunities' | 'soql' | 'schema';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  status: SalesforceStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenConnect: () => void;
  onDisconnect: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  status,
  loading,
  onRefresh,
  onOpenConnect,
  onDisconnect,
  onShowToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  const isConnected = status?.connected ?? false;

  const copyOrgId = () => {
    if (status?.organizationId) {
      navigator.clipboard.writeText(status.organizationId);
      setCopied(true);
      onShowToast('success', `Copied Org ID: ${status.organizationId}`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'accounts', label: 'Accounts', icon: <Building2 size={18} /> },
    { id: 'contacts', label: 'Contacts', icon: <Users size={18} /> },
    { id: 'opportunities', label: 'Opportunities', icon: <Briefcase size={18} /> },
    { id: 'soql', label: 'SOQL Studio', icon: <Terminal size={18} /> },
    { id: 'schema', label: 'Schema Inspector', icon: <Database size={18} /> },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(7, 11, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--card-border)',
    }}>
      {/* Top Banner: Brand & Telemetry */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00a1e0 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 161, 224, 0.4)',
          }}>
            <Cloud size={24} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Salesforce
              </span>
              <span style={{
                background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                fontSize: '1.15rem',
              }}>
                POC Console
              </span>
              <span style={{
                fontSize: '0.68rem',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 600,
              }}>
                v2.0 Next.js
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Multi-Credential Integration & API Studio
            </div>
          </div>
        </div>

        {/* Telemetry Badge & Connection Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Status Badge */}
          <div className={`pulse-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="pulse-dot" />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>

          {isConnected && status?.organizationId && (
            <div
              onClick={copyOrgId}
              title="Click to copy Org ID"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.7rem',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              <span>Org:</span>
              <span className="code-pill">{status.organizationId.slice(0, 8)}...</span>
              {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
            </div>
          )}

          {isConnected && status?.instanceUrl && (
            <a
              href={status.instanceUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.7rem',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#38bdf8',
                textDecoration: 'none',
              }}
            >
              <span>Open Org</span>
              <ExternalLink size={12} />
            </a>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            title="Refresh connection & data"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{
              animation: loading ? 'spin 1s linear infinite' : 'none'
            }} />
            <span>Refresh</span>
          </button>

          {/* Connect / Switch Org Button */}
          <button
            onClick={onOpenConnect}
            className="btn btn-primary btn-sm"
          >
            <SlidersHorizontal size={14} />
            <span>{isConnected ? 'Switch Org' : 'Connect Org'}</span>
          </button>

          {/* Disconnect Button */}
          {isConnected && (
            <button
              onClick={onDisconnect}
              className="btn btn-danger btn-sm"
              title="Disconnect active session"
            >
              <LogOut size={14} />
              <span>Disconnect</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.85rem 1.15rem',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #0ea5e9' : '2px solid transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ color: isActive ? '#38bdf8' : '#64748b' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};
