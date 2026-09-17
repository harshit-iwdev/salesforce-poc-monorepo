'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Building,
  Briefcase,
  Layers,
  LayoutGrid,
  List,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Contact } from '@/lib/api';

interface ContactsViewProps {
  contacts: Contact[];
  loading: boolean;
  onRefresh: () => void;
  limit: number;
  onChangeLimit: (limit: number) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  loading,
  onRefresh,
  limit,
  onChangeLimit,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    const term = searchTerm.toLowerCase();
    return contacts.filter((c) => {
      const fullName = `${c.FirstName || ''} ${c.LastName || ''}`.toLowerCase();
      return (
        fullName.includes(term) ||
        c.Email?.toLowerCase().includes(term) ||
        c.Phone?.toLowerCase().includes(term) ||
        c.Title?.toLowerCase().includes(term) ||
        c.Department?.toLowerCase().includes(term) ||
        c.AccountId?.toLowerCase().includes(term)
      );
    });
  }, [contacts, searchTerm]);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    onShowToast('success', `Copied Contact ID: ${id}`);
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
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={20} color="#c084fc" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc' }}>
                Salesforce Contacts
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {filteredContacts.length} of {contacts.length} records displayed
              </div>
            </div>
          </div>

          {/* Search, View Toggle, and Limit */}
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
                placeholder="Search contacts, emails, titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.3rem', fontSize: '0.825rem' }}
              />
            </div>

            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid var(--card-border)',
            }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                  color: viewMode === 'table' ? '#c084fc' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                  color: viewMode === 'grid' ? '#c084fc' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Grid Cards View"
              >
                <LayoutGrid size={16} />
              </button>
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

            {/* Reload */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              title="Refresh contacts"
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Reload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Contact Name</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Account Association</th>
                  <th>Lead Source</th>
                </tr>
              </thead>
              <tbody>
                {loading && contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Loading Contact records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      {searchTerm ? 'No contacts match your filter.' : 'No Contact records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c) => {
                    const fullName = [c.FirstName, c.LastName].filter(Boolean).join(' ') || 'Unnamed Contact';
                    return (
                      <tr
                        key={c.Id}
                        className="clickable"
                        onClick={() => setSelectedContact(c)}
                      >
                        <td>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{fullName}</div>
                          <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                            ID: <span className="code-pill">{c.Id.slice(0, 10)}...</span>
                          </div>
                        </td>
                        <td>
                          {c.Title ? (
                            <span style={{ color: '#e2e8f0', fontSize: '0.825rem' }}>{c.Title}</span>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                        <td>
                          {c.Department ? (
                            <span className="badge badge-purple">{c.Department}</span>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                        <td>
                          {c.Email ? (
                            <a
                              href={`mailto:${c.Email}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Mail size={13} />
                              <span>{c.Email}</span>
                            </a>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                        <td>
                          {c.Phone ? (
                            <a
                              href={`tel:${c.Phone}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Phone size={13} />
                              <span>{c.Phone}</span>
                            </a>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                        <td>
                          {c.AccountId ? (
                            <span className="code-pill">Acc: {c.AccountId.slice(0, 8)}...</span>
                          ) : (
                            <span style={{ color: '#64748b' }}>None</span>
                          )}
                        </td>
                        <td>
                          {c.LeadSource ? (
                            <span className="badge badge-gray">{c.LeadSource}</span>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {filteredContacts.map((c) => {
            const fullName = [c.FirstName, c.LastName].filter(Boolean).join(' ') || 'Unnamed Contact';
            return (
              <div
                key={c.Id}
                className="glass-card"
                onClick={() => setSelectedContact(c)}
                style={{ padding: '1.35rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: '#f8fafc' }}>{fullName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#c084fc', marginTop: '0.15rem' }}>
                      {c.Title || 'Contact'} {c.Department ? `• ${c.Department}` : ''}
                    </div>
                  </div>
                  <span className="code-pill" style={{ fontSize: '0.7rem' }}>{c.Id.slice(0, 6)}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem' }}>
                  {c.Email && (
                    <a
                      href={`mailto:${c.Email}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Mail size={14} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{c.Email}</span>
                    </a>
                  )}
                  {c.Phone && (
                    <a
                      href={`tel:${c.Phone}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Phone size={14} />
                      <span>{c.Phone}</span>
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {c.AccountId ? `Account: ${c.AccountId.slice(0, 8)}...` : 'Individual'}
                  </span>
                  {c.LeadSource && <span className="badge badge-gray">{c.LeadSource}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact Details Drawer */}
      {selectedContact && (
        <div className="drawer-overlay" onClick={() => setSelectedContact(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Users size={22} color="#c084fc" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                    {[selectedContact.FirstName, selectedContact.LastName].filter(Boolean).join(' ')}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contact Record Details</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    Salesforce Contact ID
                  </div>
                  <div className="code-pill" style={{ marginTop: '0.2rem', fontSize: '0.85rem' }}>
                    {selectedContact.Id}
                  </div>
                </div>
                <button
                  onClick={() => copyId(selectedContact.Id)}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>Copy ID</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="form-label">Title / Role</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 500 }}>
                    {selectedContact.Title || '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Department</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 500 }}>
                    {selectedContact.Department || '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Email</div>
                  <div style={{ fontSize: '0.9rem', color: '#38bdf8' }}>
                    {selectedContact.Email ? (
                      <a href={`mailto:${selectedContact.Email}`} style={{ color: '#38bdf8' }}>
                        {selectedContact.Email}
                      </a>
                    ) : '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Phone</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                    {selectedContact.Phone ? (
                      <a href={`tel:${selectedContact.Phone}`} style={{ color: '#f8fafc' }}>
                        {selectedContact.Phone}
                      </a>
                    ) : '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Associated Account ID</div>
                  <div style={{ fontSize: '0.85rem' }}>
                    {selectedContact.AccountId ? (
                      <span className="code-pill">{selectedContact.AccountId}</span>
                    ) : '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Lead Source</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                    {selectedContact.LeadSource || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
