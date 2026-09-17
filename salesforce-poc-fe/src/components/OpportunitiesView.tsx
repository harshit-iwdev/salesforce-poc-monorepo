'use client';

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Search,
  RefreshCw,
  DollarSign,
  Calendar,
  Layers,
  Kanban,
  List,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Opportunity } from '@/lib/api';

interface OpportunitiesViewProps {
  opportunities: Opportunity[];
  loading: boolean;
  onRefresh: () => void;
  limit: number;
  onChangeLimit: (limit: number) => void;
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  opportunities,
  loading,
  onRefresh,
  limit,
  onChangeLimit,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter deals
  const filteredOpportunities = useMemo(() => {
    if (!searchTerm.trim()) return opportunities;
    const term = searchTerm.toLowerCase();
    return opportunities.filter(
      (opp) =>
        opp.Name?.toLowerCase().includes(term) ||
        opp.StageName?.toLowerCase().includes(term) ||
        opp.AccountId?.toLowerCase().includes(term) ||
        opp.Type?.toLowerCase().includes(term)
    );
  }, [opportunities, searchTerm]);

  // Group by Stage for Kanban
  const stages = useMemo(() => {
    const stageMap: Record<string, Opportunity[]> = {};
    filteredOpportunities.forEach((opp) => {
      const stage = opp.StageName || 'Unassigned';
      if (!stageMap[stage]) stageMap[stage] = [];
      stageMap[stage].push(opp);
    });
    return stageMap;
  }, [filteredOpportunities]);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    onShowToast('success', `Copied Opportunity ID: ${id}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStageBadgeColor = (stage: string) => {
    const lower = stage.toLowerCase();
    if (lower.includes('won')) return 'badge-green';
    if (lower.includes('lost')) return 'badge-gray';
    if (lower.includes('negotiation') || lower.includes('proposal')) return 'badge-purple';
    if (lower.includes('qualification') || lower.includes('prospect')) return 'badge-blue';
    return 'badge-amber';
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
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Briefcase size={20} color="#fbbf24" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc' }}>
                Salesforce Opportunities Pipeline
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {filteredOpportunities.length} deals totaling $
                {filteredOpportunities.reduce((sum, o) => sum + (o.Amount || 0), 0).toLocaleString()}
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
                placeholder="Search deals, stages, accounts..."
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
                onClick={() => setViewMode('kanban')}
                style={{
                  background: viewMode === 'kanban' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  color: viewMode === 'kanban' ? '#fbbf24' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Kanban Board View"
              >
                <Kanban size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  color: viewMode === 'table' ? '#fbbf24' : '#94a3b8',
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
              title="Refresh opportunities"
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Reload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Kanban or Table */}
      {viewMode === 'kanban' ? (
        /* Kanban Board */
        <div style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          paddingBottom: '1rem',
          minHeight: '480px',
        }}>
          {Object.keys(stages).length === 0 ? (
            <div className="glass-card" style={{ width: '100%', textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
              {loading ? 'Fetching pipeline opportunities...' : 'No opportunities found.'}
            </div>
          ) : (
            Object.entries(stages).map(([stageName, deals]) => {
              const stageTotal = deals.reduce((sum, d) => sum + (d.Amount || 0), 0);
              return (
                <div
                  key={stageName}
                  style={{
                    flex: '0 0 300px',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(15, 23, 42, 0.55)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Column Header */}
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                        {stageName}
                      </span>
                      <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                        {deals.length}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, marginTop: '0.25rem' }}>
                      ${stageTotal.toLocaleString()}
                    </div>
                  </div>

                  {/* Deals Column */}
                  <div style={{
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    overflowY: 'auto',
                    flex: 1,
                  }}>
                    {deals.map((opp) => (
                      <div
                        key={opp.Id}
                        onClick={() => setSelectedOpportunity(opp)}
                        style={{
                          background: 'rgba(30, 41, 59, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f8fafc', lineHeight: 1.3 }}>
                          {opp.Name}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>
                            {opp.Amount ? `$${opp.Amount.toLocaleString()}` : '$0'}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                            {opp.CloseDate}
                          </span>
                        </div>

                        {/* Probability Progress Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>
                            <span>Probability</span>
                            <span>{opp.Probability ?? 0}%</span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '4px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${opp.Probability ?? 0}%`,
                              height: '100%',
                              background: opp.IsWon ? '#10b981' : '#f59e0b',
                              borderRadius: '2px',
                            }} />
                          </div>
                        </div>

                        {/* Badges / Account */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                          <span className="code-pill" style={{ fontSize: '0.68rem' }}>
                            {opp.AccountId ? `Acc: ${opp.AccountId.slice(0, 6)}` : 'No Acc'}
                          </span>
                          {opp.IsWon && (
                            <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Won</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Opportunity Name</th>
                  <th>Stage</th>
                  <th>Amount</th>
                  <th>Probability</th>
                  <th>Close Date</th>
                  <th>Parent Account</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Loading opportunities...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      {searchTerm ? 'No opportunities match your filter.' : 'No opportunities found.'}
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp) => (
                    <tr
                      key={opp.Id}
                      className="clickable"
                      onClick={() => setSelectedOpportunity(opp)}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{opp.Name}</div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                          ID: <span className="code-pill">{opp.Id.slice(0, 10)}...</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStageBadgeColor(opp.StageName)}`}>
                          {opp.StageName}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#34d399' }}>
                          {opp.Amount ? `$${opp.Amount.toLocaleString()}` : '$0'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{opp.Probability ?? 0}%</span>
                          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                            <div style={{ width: `${opp.Probability ?? 0}%`, height: '100%', background: '#38bdf8', borderRadius: '2px' }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                          <Calendar size={13} />
                          <span>{opp.CloseDate}</span>
                        </div>
                      </td>
                      <td>
                        {opp.AccountId ? (
                          <span className="code-pill">Acc: {opp.AccountId.slice(0, 8)}...</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>None</span>
                        )}
                      </td>
                      <td>
                        {opp.IsWon ? (
                          <span className="badge badge-green">Won</span>
                        ) : opp.IsClosed ? (
                          <span className="badge badge-gray">Closed</span>
                        ) : (
                          <span className="badge badge-blue">Open</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opportunity Details Drawer */}
      {selectedOpportunity && (
        <div className="drawer-overlay" onClick={() => setSelectedOpportunity(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Briefcase size={22} color="#fbbf24" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                    {selectedOpportunity.Name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Opportunity Deal Details</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
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
                    Opportunity Record ID
                  </div>
                  <div className="code-pill" style={{ marginTop: '0.2rem', fontSize: '0.85rem' }}>
                    {selectedOpportunity.Id}
                  </div>
                </div>
                <button
                  onClick={() => copyId(selectedOpportunity.Id)}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>Copy ID</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="form-label">Stage Name</div>
                  <span className={`badge ${getStageBadgeColor(selectedOpportunity.StageName)}`}>
                    {selectedOpportunity.StageName}
                  </span>
                </div>
                <div>
                  <div className="form-label">Deal Amount</div>
                  <div style={{ fontSize: '1.1rem', color: '#34d399', fontWeight: 700 }}>
                    {selectedOpportunity.Amount ? `$${selectedOpportunity.Amount.toLocaleString()}` : '$0'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Close Date</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                    {selectedOpportunity.CloseDate}
                  </div>
                </div>
                <div>
                  <div className="form-label">Win Probability</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                    {selectedOpportunity.Probability ?? 0}%
                  </div>
                </div>
                <div>
                  <div className="form-label">Parent Account ID</div>
                  <div style={{ fontSize: '0.85rem' }}>
                    {selectedOpportunity.AccountId ? (
                      <span className="code-pill">{selectedOpportunity.AccountId}</span>
                    ) : '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Lead Source</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                    {selectedOpportunity.LeadSource || '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Opportunity Type</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                    {selectedOpportunity.Type || '—'}
                  </div>
                </div>
                <div>
                  <div className="form-label">Status</div>
                  <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                    {selectedOpportunity.IsWon ? 'Closed Won' : selectedOpportunity.IsClosed ? 'Closed Lost' : 'In Pipeline'}
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
