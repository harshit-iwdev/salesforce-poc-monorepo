'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Info,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api, DescribeResult, DescribeField } from '@/lib/api';

interface SchemaInspectorViewProps {
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const COMMON_OBJECTS = [
  'Account',
  'Contact',
  'Opportunity',
  'Lead',
  'Case',
  'User',
  'Task',
  'Campaign',
];

export const SchemaInspectorView: React.FC<SchemaInspectorViewProps> = ({ onShowToast }) => {
  const [selectedObject, setSelectedObject] = useState('Account');
  const [customInput, setCustomInput] = useState('');
  const [describeData, setDescribeData] = useState<DescribeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedPicklist, setExpandedPicklist] = useState<string | null>(null);

  const fetchSchema = async (objectName: string) => {
    setLoading(true);
    try {
      const data = await api.describeObject(objectName);
      setDescribeData(data);
      setSelectedObject(objectName);
      onShowToast('success', `Described object ${objectName} (${data.fields.length} fields)`);
    } catch (err: any) {
      onShowToast('error', `Failed to describe ${objectName}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema('Account');
  }, []);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      fetchSchema(customInput.trim());
    }
  };

  const copyFieldName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedField(name);
    onShowToast('success', `Copied field: ${name}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filter fields
  const filteredFields = useMemo(() => {
    if (!describeData?.fields) return [];
    if (!fieldSearch.trim()) return describeData.fields;
    const term = fieldSearch.toLowerCase();
    return describeData.fields.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.label.toLowerCase().includes(term) ||
        f.type.toLowerCase().includes(term)
    );
  }, [describeData, fieldSearch]);

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'id':
      case 'reference':
        return 'badge-blue';
      case 'currency':
      case 'double':
      case 'int':
        return 'badge-green';
      case 'picklist':
      case 'multipicklist':
        return 'badge-purple';
      case 'boolean':
        return 'badge-amber';
      default:
        return 'badge-gray';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header & Object Selector */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
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
              <Database size={20} color="#c084fc" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc' }}>
                Salesforce Schema & Object Inspector
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Discover field schemas, types, picklists, and relationship metadata for standard & custom objects
              </div>
            </div>
          </div>

          {/* Custom Object Input Form */}
          <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Invoice__c or Lead"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              style={{ width: '200px', fontSize: '0.825rem', padding: '0.5rem 0.8rem' }}
            />
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              <span>Inspect</span>
            </button>
          </form>
        </div>

        {/* Quick Select Buttons */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {COMMON_OBJECTS.map((obj) => {
            const isSelected = selectedObject === obj;
            return (
              <button
                key={obj}
                onClick={() => fetchSchema(obj)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #0ea5e9' : '1px solid var(--card-border)',
                  background: isSelected ? 'rgba(14, 165, 233, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                  color: isSelected ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {obj}
              </button>
            );
          })}
        </div>
      </div>

      {/* Object Metadata Telemetry */}
      {describeData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Object Label
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.25rem' }}>
              {describeData.label}
            </div>
            <div className="code-pill" style={{ marginTop: '0.35rem', display: 'inline-block' }}>
              {describeData.name}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Fields
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>
              {describeData.fields.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              {describeData.fields.filter((f) => f.type === 'picklist').length} picklists,{' '}
              {describeData.fields.filter((f) => f.type === 'reference').length} relations
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Child Relationships
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c084fc', marginTop: '0.25rem' }}>
              {describeData.childRelationships?.length ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Parent-child linkages
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Record Types
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginTop: '0.25rem' }}>
              {describeData.recordTypeInfos?.length ?? 1}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              {describeData.custom ? 'Custom Object' : 'Standard Salesforce Object'}
            </div>
          </div>
        </div>
      )}

      {/* Field Explorer Table Card */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {/* Search Bar */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              Fields ({filteredFields.length})
            </h3>
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search
              size={15}
              color="#64748b"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search field name, label, type..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.8rem', padding: '0.45rem 0.8rem 0.45rem 2.2rem' }}
            />
          </div>
        </div>

        {/* Fields Table */}
        <div className="table-container" style={{ maxHeight: '600px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Field Label</th>
                <th>API Name</th>
                <th>Data Type</th>
                <th>Length</th>
                <th>Permissions</th>
                <th>Picklist / Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Describing {selectedObject} metadata...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFields.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                    No fields match your search.
                  </td>
                </tr>
              ) : (
                filteredFields.map((field) => (
                  <React.Fragment key={field.name}>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{field.label}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="code-pill">{field.name}</span>
                          <button
                            onClick={() => copyFieldName(field.name)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            title="Copy API Name"
                          >
                            {copiedField === field.name ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadgeClass(field.type)}`}>
                          {field.type}
                        </span>
                        {field.referenceTo && field.referenceTo.length > 0 && (
                          <span style={{ fontSize: '0.725rem', color: '#94a3b8', marginLeft: '0.35rem' }}>
                            → {field.referenceTo.join(', ')}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                          {field.length ?? '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', fontSize: '0.7rem' }}>
                          {field.createable && <span className="badge badge-green">Create</span>}
                          {field.updateable && <span className="badge badge-blue">Update</span>}
                          {!field.nillable && <span className="badge badge-amber">Required</span>}
                        </div>
                      </td>
                      <td>
                        {field.picklistValues && field.picklistValues.length > 0 ? (
                          <button
                            onClick={() =>
                              setExpandedPicklist(
                                expandedPicklist === field.name ? null : field.name
                              )
                            }
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                          >
                            <span>{field.picklistValues.length} Values</span>
                            {expandedPicklist === field.name ? (
                              <ChevronDown size={13} />
                            ) : (
                              <ChevronRight size={13} />
                            )}
                          </button>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Picklist Values Drawer Row */}
                    {expandedPicklist === field.name && field.picklistValues && (
                      <tr style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                        <td colSpan={6} style={{ padding: '0.9rem 1.25rem' }}>
                          <div style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Picklist Values for {field.label} ({field.name}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {field.picklistValues.map((pv) => (
                              <span
                                key={pv.value}
                                className="code-pill"
                                style={{
                                  background: pv.active !== false ? 'rgba(168, 85, 247, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                  borderColor: pv.active !== false ? 'rgba(168, 85, 247, 0.3)' : 'rgba(100, 116, 139, 0.3)',
                                  color: pv.active !== false ? '#e9d5ff' : '#94a3b8',
                                }}
                              >
                                {pv.label} ({pv.value})
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
