'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  RefreshCw,
  ExternalLink,
  Phone,
  Globe,
  MapPin,
  Users,
  DollarSign,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Account } from '@/lib/api';

interface AccountsViewProps {
  accounts: Account[];
  loading: boolean;
  onRefresh: () => void;
  limit: number;
  onChangeLimit: (limit: number) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  loading,
  onRefresh,
  limit,
  onChangeLimit,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accounts;
    const term = searchTerm.toLowerCase();
    return accounts.filter(
      (acc) =>
        acc.Name?.toLowerCase().includes(term) ||
        acc.Industry?.toLowerCase().includes(term) ||
        acc.BillingCity?.toLowerCase().includes(term) ||
        acc.BillingCountry?.toLowerCase().includes(term) ||
        acc.Type?.toLowerCase().includes(term)
    );
  }, [accounts, searchTerm]);

  const copyAccountId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    onShowToast('success', `Copied Account ID: ${id}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Filter & Action Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          {/* Title & Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc' }}>
                Salesforce Accounts
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {filteredAccounts.length} of {accounts.length} records displayed
              </div>
            </div>
          </div>

          {/* Search & Limit Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search
                size={16}
                color="#64748b"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, industry, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.3rem', fontSize: '0.825rem' }}
              />
            </div>

            {/* Limit Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Limit:</span>
              <select
                className="form-select"
                value={limit}
                onChange={(e) => onChangeLimit(Number(e.target.value))}
                style={{ width: 'auto', padding: '0.55rem 0.8rem', fontSize: '0.825rem' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              title="Refresh records from Salesforce"
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Reload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Industry</th>
                <th>Annual Revenue</th>
                <th>Phone</th>
                <th>Website</th>
                <th>Location</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {loading && accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Fetching Account records from Salesforce API...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    {searchTerm ? 'No accounts match your search filter.' : 'No Account records found.'}
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr
                    key={acc.Id}
                    className="clickable"
                    onClick={() => setSelectedAccount(acc)}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{acc.Name}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                        ID: <span className="code-pill">{acc.Id.slice(0, 10)}...</span>
                      </div>
                    </td>
                    <td>
                      {acc.Industry ? (
                        <span className="badge badge-blue">{acc.Industry}</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td>
                      {acc.AnnualRevenue != null ? (
                        <span style={{ fontWeight: 600, color: '#34d399' }}>
                          ${acc.AnnualRevenue.toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td>
                      {acc.Phone ? (
                        <a
                          href={`tel:${acc.Phone}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Phone size={13} />
                          <span>{acc.Phone}</span>
                        </a>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td>
                      {acc.Website ? (
                        <a
                          href={acc.Website.startsWith('http') ? acc.Website : `https://${acc.Website}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Globe size={13} />
                          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {acc.Website.replace(/^https?:\/\//, '')}
                          </span>
                        </a>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td>
                      {acc.BillingCity || acc.BillingCountry ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                          <MapPin size={13} color="#64748b" />
                          <span>{[acc.BillingCity, acc.BillingCountry].filter(Boolean).join(', ')}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td>
                      {acc.Type ? (
                        <span className="badge badge-purple">{acc.Type}</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Details Drawer */}
      {selectedAccount && (
        <div className="drawer-overlay" onClick={() => setSelectedAccount(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Building2 size={22} color="#38bdf8" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                    {selectedAccount.Name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Account Record Details</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* ID Bar */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Salesforce Record ID
                  </div>
                  <div className="code-pill" style={{ marginTop: '0.2rem', fontSize: '0.85rem' }}>
                    {selectedAccount.Id}
                  </div>
                </div>
                <button
                  onClick={() => copyAccountId(selectedAccount.Id)}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>Copy ID</span>
                </button>
              </div>

              {/* Attributes List */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="form-label">Industry</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 500 }}>
                    {selectedAccount.Industry || '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Account Type</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 500 }}>
                    {selectedAccount.Type || '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Annual Revenue</div>
                  <div style={{ fontSize: '0.95rem', color: '#34d399', fontWeight: 700 }}>
                    {selectedAccount.AnnualRevenue != null ? `$${selectedAccount.AnnualRevenue.toLocaleString()}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Employees</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 500 }}>
                    {selectedAccount.NumberOfEmployees?.toLocaleString() || '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Phone</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                    {selectedAccount.Phone || '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Website</div>
                  <div style={{ fontSize: '0.9rem', color: '#38bdf8' }}>
                    {selectedAccount.Website ? (
                      <a href={selectedAccount.Website} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>
                        {selectedAccount.Website}
                      </a>
                    ) : '—'}
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
                <div className="form-label">Billing Location</div>
                <div style={{ fontSize: '0.9rem', color: '#f8fafc', marginTop: '0.2rem' }}>
                  {[selectedAccount.BillingCity, selectedAccount.BillingCountry].filter(Boolean).join(', ') || 'No address specified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
