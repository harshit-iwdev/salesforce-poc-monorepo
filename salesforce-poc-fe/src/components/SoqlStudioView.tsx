'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Download,
  Code2,
  Table as TableIcon,
  Copy,
  Check,
  Clock,
  Database,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

interface SoqlStudioViewProps {
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

interface QueryTemplate {
  name: string;
  query: string;
  description: string;
}

const TEMPLATES: QueryTemplate[] = [
  {
    name: 'Top 10 Accounts by Revenue',
    query: 'SELECT Id, Name, Industry, AnnualRevenue, NumberOfEmployees, BillingCity FROM Account WHERE AnnualRevenue != null ORDER BY AnnualRevenue DESC LIMIT 10',
    description: 'Largest enterprise accounts ranked by reported revenue',
  },
  {
    name: 'Active High-Value Opportunities',
    query: 'SELECT Id, Name, StageName, Amount, CloseDate, Probability, AccountId FROM Opportunity WHERE IsClosed = false ORDER BY Amount DESC LIMIT 10',
    description: 'Open pipeline deals sorted by highest value',
  },
  {
    name: 'Closed Won Wins',
    query: 'SELECT Id, Name, Amount, CloseDate, LeadSource FROM Opportunity WHERE IsWon = true ORDER BY CloseDate DESC LIMIT 15',
    description: 'Recently closed won deals across all channels',
  },
  {
    name: 'Recent Contacts Roster',
    query: 'SELECT Id, FirstName, LastName, Email, Phone, Title, Department FROM Contact ORDER BY CreatedDate DESC LIMIT 20',
    description: 'Latest contacts synced into the CRM',
  },
  {
    name: 'Standard Leads Discovery',
    query: 'SELECT Id, Name, Company, Status, LeadSource, Email FROM Lead ORDER BY CreatedDate DESC LIMIT 10',
    description: 'Recently captured prospective leads',
  },
];

export const SoqlStudioView: React.FC<SoqlStudioViewProps> = ({ onShowToast }) => {
  const [query, setQuery] = useState(TEMPLATES[0].query);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunQuery = async () => {
    if (!query.trim()) {
      onShowToast('error', 'Please enter a SOQL query.');
      return;
    }

    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const records = await api.runQuery(query.trim());
      const end = performance.now();
      setExecutionTime(Math.round(end - start));
      setResults(records);
      onShowToast('success', `Query executed: ${records.length} records returned in ${Math.round(end - start)}ms`);
    } catch (err: any) {
      setError(err.message);
      onShowToast('error', `SOQL execution failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) {
      onShowToast('info', 'No records to export.');
      return;
    }

    // Extract headers (exclude 'attributes' metadata object from jsforce)
    const keys = Array.from(
      new Set(
        results.flatMap((r) => Object.keys(r)).filter((k) => k !== 'attributes')
      )
    );

    const csvRows = [];
    csvRows.push(keys.join(','));

    for (const row of results) {
      const values = keys.map((key) => {
        const val = row[key];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `soql_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('success', 'Exported query results to CSV successfully!');
  };

  const handleCopyJSON = () => {
    if (!results) return;
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setCopied(true);
    onShowToast('success', 'Copied results JSON to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunQuery();
    }
  };

  const tableColumns = results && results.length > 0
    ? Object.keys(results[0]).filter((k) => k !== 'attributes')
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Terminal size={20} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc' }}>
                SOQL Query Studio
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Directly execute arbitrary SOQL commands with instant table formatting & CSV export
              </div>
            </div>
          </div>

          {/* Quick Presets Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Template:</span>
            <select
              className="form-select"
              onChange={(e) => {
                const found = TEMPLATES.find((t) => t.name === e.target.value);
                if (found) setQuery(found.query);
              }}
              style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.825rem' }}
            >
              {TEMPLATES.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Editor Card */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#94a3b8' }}>
            <Code2 size={14} color="#38bdf8" />
            <span>SOQL Statement (Press <span className="code-pill">Ctrl+Enter</span> to run)</span>
          </div>
          <button
            onClick={() => setQuery('')}
            style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>

        <textarea
          className="form-textarea"
          rows={4}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SELECT Id, Name FROM Account LIMIT 10"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: '#38bdf8',
            background: 'rgba(11, 17, 32, 0.95)',
          }}
        />

        {/* Action Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleRunQuery}
              disabled={loading}
              className="btn btn-primary"
            >
              <Play size={16} fill="white" />
              <span>{loading ? 'Executing SOQL...' : 'Run Query'}</span>
            </button>

            {executionTime != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#34d399' }}>
                <Clock size={13} />
                <span>{executionTime}ms</span>
              </div>
            )}

            {results != null && (
              <span className="badge badge-blue">
                {results.length} records returned
              </span>
            )}
          </div>

          {results != null && results.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Table / JSON toggle */}
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
                    background: viewMode === 'table' ? 'rgba(14, 165, 233, 0.25)' : 'transparent',
                    color: viewMode === 'table' ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <TableIcon size={14} />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  style={{
                    background: viewMode === 'json' ? 'rgba(14, 165, 233, 0.25)' : 'transparent',
                    color: viewMode === 'json' ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <Code2 size={14} />
                  <span>JSON</span>
                </button>
              </div>

              {/* Copy JSON */}
              <button
                onClick={handleCopyJSON}
                className="btn btn-secondary btn-sm"
                title="Copy result as JSON"
              >
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>Copy</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                className="btn btn-outline btn-sm"
                title="Export results to CSV"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          color: '#fecdd3',
        }}>
          <AlertCircle size={18} color="#fb7185" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>SOQL Query Error</div>
            <div style={{ fontSize: '0.825rem', marginTop: '0.2rem', fontFamily: 'monospace' }}>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Query Results View */}
      {results != null && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
              Query executed successfully, but 0 matching records were returned.
            </div>
          ) : viewMode === 'table' ? (
            <div className="table-container" style={{ maxHeight: '550px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    {tableColumns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <tr key={idx}>
                      {tableColumns.map((col) => {
                        const val = row[col];
                        let rendered: React.ReactNode;
                        if (val === null || val === undefined) {
                          rendered = <span style={{ color: '#64748b' }}>—</span>;
                        } else if (typeof val === 'boolean') {
                          rendered = <span className={val ? 'badge badge-green' : 'badge badge-gray'}>{String(val)}</span>;
                        } else if (typeof val === 'number') {
                          rendered = <span style={{ color: '#34d399', fontWeight: 600 }}>{val.toLocaleString()}</span>;
                        } else if (typeof val === 'object') {
                          rendered = <span className="code-pill">{JSON.stringify(val)}</span>;
                        } else if (typeof val === 'string' && val.length === 18 && val.startsWith('00')) {
                          rendered = <span className="code-pill">{val}</span>;
                        } else {
                          rendered = String(val);
                        }
                        return <td key={col}>{rendered}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* JSON View */
            <pre style={{
              padding: '1.25rem',
              margin: 0,
              fontSize: '0.825rem',
              lineHeight: 1.5,
              background: 'rgba(10, 15, 29, 0.95)',
              color: '#38bdf8',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              overflowX: 'auto',
              maxHeight: '550px',
            }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
