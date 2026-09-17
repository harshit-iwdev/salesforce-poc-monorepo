'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabType } from '@/components/Navbar';
import { ConnectModal } from '@/components/ConnectModal';
import { LoginGatewayView } from '@/components/LoginGatewayView';
import { ToastContainer, ToastItem } from '@/components/ToastContainer';
import { OverviewView } from '@/components/OverviewView';
import { AccountsView } from '@/components/AccountsView';
import { ContactsView } from '@/components/ContactsView';
import { OpportunitiesView } from '@/components/OpportunitiesView';
import { SoqlStudioView } from '@/components/SoqlStudioView';
import { SchemaInspectorView } from '@/components/SchemaInspectorView';
import {
  api,
  SalesforceStatus,
  Account,
  Contact,
  Opportunity,
  setStoredSession,
  getStoredSessionId,
} from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [status, setStatus] = useState<SalesforceStatus | null>(null);
  const [initialChecked, setInitialChecked] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Limits
  const [accountsLimit, setAccountsLimit] = useState(25);
  const [contactsLimit, setContactsLimit] = useState(25);
  const [opportunitiesLimit, setOpportunitiesLimit] = useState(25);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch status and data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check live status from backend
      const statusRes = await api.getStatus();
      setStatus(statusRes);

      if (statusRes.connected) {
        // 2. Load accounts, contacts, opportunities in parallel for active session
        const [accs, conts, opps] = await Promise.allSettled([
          api.getAccounts(accountsLimit),
          api.getContacts(contactsLimit),
          api.getOpportunities(opportunitiesLimit),
        ]);

        if (accs.status === 'fulfilled') setAccounts(accs.value);
        if (conts.status === 'fulfilled') setContacts(conts.value);
        if (opps.status === 'fulfilled') setOpportunities(opps.value);
      } else {
        setAccounts([]);
        setContacts([]);
        setOpportunities([]);
      }
    } catch (err: any) {
      showToast('error', `Failed to load Salesforce data: ${err.message}`);
      setStatus({ connected: false });
    } finally {
      setInitialChecked(true);
      setLoading(false);
    }
  }, [accountsLimit, contactsLimit, opportunitiesLimit, showToast]);

  // Check URL params from OAuth callback & message events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSessionId = urlParams.get('session_id');
      const oauthOrgId = urlParams.get('org_id');

      if (oauthSessionId) {
        setStoredSession(oauthSessionId, { organizationId: oauthOrgId });
        showToast('success', `Authorized with Salesforce Org ${oauthOrgId || oauthSessionId}!`);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        loadData();
      }

      // Listen for popup messages
      const handleAuthMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SALESFORCE_AUTH_SUCCESS') {
          setStoredSession(event.data.sessionId, { organizationId: event.data.organizationId });
          showToast('success', `Connected to Salesforce Org: ${event.data.organizationId}`);
          loadData();
        }
      };

      window.addEventListener('message', handleAuthMessage);
      return () => window.removeEventListener('message', handleAuthMessage);
    }
  }, [showToast, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDisconnect = async () => {
    try {
      const currentSessionId = getStoredSessionId();
      await api.disconnect(currentSessionId || undefined);
    } catch {
      // ignore
    } finally {
      setStoredSession(null);
      showToast('info', 'Disconnected Salesforce session.');
      // Fetch latest sessions list but keep UI on Login Gateway
      try {
        const sessions = await api.getSessions();
        setStatus({ connected: false, sessionsCount: sessions.length, sessions });
      } catch {
        setStatus({ connected: false, sessionsCount: 0, sessions: [] });
      }
      setAccounts([]);
      setContacts([]);
      setOpportunities([]);
    }
  };

  const handleConnected = (newStatus: SalesforceStatus) => {
    setStatus(newStatus);
    loadData();
  };

  const isConnected = status?.connected ?? false;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* When Connected: Show Full Console Header */}
      {isConnected && (
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          status={status}
          loading={loading}
          onRefresh={loadData}
          onOpenConnect={() => setConnectModalOpen(true)}
          onDisconnect={handleDisconnect}
          onShowToast={showToast}
        />
      )}

      {/* Main Content Area */}
      <main style={{
        maxWidth: isConnected ? '1400px' : '1000px',
        width: '100%',
        margin: '0 auto',
        padding: isConnected ? '1.75rem 1.5rem' : '0',
        flex: 1,
      }}>
        {!initialChecked ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8' }}>
            Initializing Salesforce Console...
          </div>
        ) : !isConnected ? (
          /* When NOT connected: Render Login / Connect Gateway */
          <LoginGatewayView
            onConnected={handleConnected}
            onShowToast={showToast}
            availableSessions={status?.sessions}
          />
        ) : (
          /* When CONNECTED: Render Active Tab View */
          <>
            {activeTab === 'overview' && (
              <OverviewView
                status={status}
                accounts={accounts}
                contacts={contacts}
                opportunities={opportunities}
                loading={loading}
                onSelectTab={setActiveTab}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'accounts' && (
              <AccountsView
                accounts={accounts}
                loading={loading}
                onRefresh={loadData}
                limit={accountsLimit}
                onChangeLimit={setAccountsLimit}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'contacts' && (
              <ContactsView
                contacts={contacts}
                loading={loading}
                onRefresh={loadData}
                limit={contactsLimit}
                onChangeLimit={setContactsLimit}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'opportunities' && (
              <OpportunitiesView
                opportunities={opportunities}
                loading={loading}
                onRefresh={loadData}
                limit={opportunitiesLimit}
                onChangeLimit={setOpportunitiesLimit}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'soql' && (
              <SoqlStudioView onShowToast={showToast} />
            )}

            {activeTab === 'schema' && (
              <SchemaInspectorView onShowToast={showToast} />
            )}
          </>
        )}
      </main>

      {/* Dynamic Switch Org Modal (when already connected) */}
      {isConnected && (
        <ConnectModal
          isOpen={connectModalOpen}
          onClose={() => setConnectModalOpen(false)}
          onConnected={handleConnected}
          onShowToast={showToast}
          currentStatus={status}
        />
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '1.25rem 1.5rem',
        background: 'rgba(7, 11, 20, 0.95)',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.78rem',
          color: '#64748b',
        }}>
          <div>
            Salesforce Multi-Tenant Console • React 19 & Next.js App Router • Vanilla CSS Design System
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>Backend: <strong style={{ color: '#94a3b8' }}>salesforce-poc-be (:8000)</strong></span>
            <span>REST & SOQL Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
