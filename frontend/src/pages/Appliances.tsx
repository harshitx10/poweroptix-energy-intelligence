import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Zap, AlertCircle, Save, X, Search, ArrowRight, Filter, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Appliance, ApplianceAnalyticsSummary, ApplianceCategory } from '../types';

interface AppliancesProps {
  onDataChanged: () => void;
  setActiveTab?: (tab: string) => void;
}

export const Appliances: React.FC<AppliancesProps> = ({ onDataChanged, setActiveTab }) => {
  const [data, setData] = useState<ApplianceAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter, Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'kwh_desc' | 'kwh_asc' | 'power_desc' | 'name_asc'>('kwh_desc');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appliance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Appliance>>({
    name: '',
    category: 'Cooling',
    rated_power_w: 1000,
    quantity: 1,
    hours_per_day: 4,
    days_per_month: 30,
    standby_power_w: 0,
    priority: 'Medium',
    min_hours_per_day: 1,
    max_hours_per_day: 8,
    is_active: true
  });

  const loadAppliances = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAppliances();
      setData(res);
    } catch (err: any) {
      console.error('Error fetching appliances:', err);
      setError(err?.message || 'Unable to load appliance data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppliances();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setValidationError(null);
    setFormData({
      name: '',
      category: 'Cooling',
      rated_power_w: 1000,
      quantity: 1,
      hours_per_day: 4,
      days_per_month: 30,
      standby_power_w: 0,
      priority: 'Medium',
      min_hours_per_day: 1,
      max_hours_per_day: 8,
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (app: Appliance) => {
    setEditingId(app.id);
    setValidationError(null);
    setFormData({
      name: app.name || '',
      category: app.category || 'Cooling',
      rated_power_w: app.rated_power_w ?? 1000,
      quantity: app.quantity ?? 1,
      hours_per_day: app.hours_per_day ?? 4,
      days_per_month: app.days_per_month ?? 30,
      standby_power_w: app.standby_power_w ?? 0,
      priority: app.priority || 'Medium',
      min_hours_per_day: app.min_hours_per_day ?? 1,
      max_hours_per_day: app.max_hours_per_day ?? 8,
      is_active: app.is_active ?? true
    });
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await api.deleteAppliance(deleteTarget.id);
      setDeleteTarget(null);
      await loadAppliances();
      onDataChanged();
    } catch (err: any) {
      alert(`Error deleting appliance: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!formData.name || !formData.name.trim()) {
      setValidationError('Appliance Name is required.');
      return;
    }
    if ((formData.rated_power_w ?? 0) <= 0) {
      setValidationError('Rated Power must be greater than 0 Watts.');
      return;
    }
    if ((formData.quantity ?? 0) < 1) {
      setValidationError('Quantity must be at least 1.');
      return;
    }
    if ((formData.hours_per_day ?? -1) < 0 || (formData.hours_per_day ?? 25) > 24) {
      setValidationError('Hours per day must be between 0 and 24.');
      return;
    }
    if ((formData.min_hours_per_day ?? 0) < 0 || (formData.max_hours_per_day ?? 25) > 24) {
      setValidationError('Min and Max hours must be between 0 and 24.');
      return;
    }
    if ((formData.min_hours_per_day ?? 0) > (formData.max_hours_per_day ?? 24)) {
      setValidationError('Minimum hours cannot exceed Maximum hours.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await api.updateAppliance(editingId, formData);
      } else {
        await api.createAppliance(formData);
      }
      setShowModal(false);
      await loadAppliances();
      onDataChanged();
    } catch (err: any) {
      setValidationError(`Error saving appliance: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered & Sorted Appliances
  const filteredAppliances = useMemo(() => {
    if (!data || !data.appliances) return [];
    return data.appliances
      .filter((app) => {
        const matchesSearch = (app.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (app.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || app.category === selectedCategory;
        const matchesPriority = selectedPriority === 'ALL' || (app.priority || 'Medium') === selectedPriority;
        return matchesSearch && matchesCategory && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'kwh_desc') return (b.monthly_kwh ?? 0) - (a.monthly_kwh ?? 0);
        if (sortBy === 'kwh_asc') return (a.monthly_kwh ?? 0) - (b.monthly_kwh ?? 0);
        if (sortBy === 'power_desc') return (b.rated_power_w ?? 0) - (a.rated_power_w ?? 0);
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });
  }, [data, searchTerm, selectedCategory, selectedPriority, sortBy]);

  // Top 5 Energy Consumers
  const topConsumers = useMemo(() => {
    if (!data || !data.appliances) return [];
    return [...data.appliances]
      .sort((a, b) => (b.monthly_kwh ?? 0) - (a.monthly_kwh ?? 0))
      .slice(0, 5);
  }, [data]);

  // Loading State
  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: '1rem', color: 'var(--accent-emerald)' }} />
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading Appliance Inventory...</p>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderLeft: '4px solid var(--accent-rose)' }}>
        <AlertCircle size={36} color="var(--accent-rose)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Unable to Load Appliance Data</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Failed to connect to backend server.'}</p>
        <button onClick={loadAppliances} className="btn btn-primary">
          <RefreshCw size={16} />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Appliance Inventory
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Manage appliances, usage patterns, energy consumption and optimization constraints.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} />
          Add Appliance
        </button>
      </div>

      {/* Top KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Appliances</span>
          <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {data.appliances.length}
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Configured household loads</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Consumption</span>
          <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
            {data.total_monthly_kwh} <span style={{ fontSize: '1rem', fontWeight: 600 }}>kWh/mo</span>
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Baseline monthly consumption</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Highest Consumer</span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.highest_consuming_appliance || 'N/A'}
          </h4>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.highest_consuming_kwh} kWh/month</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Estimated Monthly Cost</span>
          <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            ₹{(data.total_monthly_cost ?? 0).toLocaleString()}
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Based on slab tariff rate</span>
        </div>
      </div>

      {/* Top 5 Energy Consumers Bar Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="var(--accent-amber)" />
          Top 5 Energy Consumers
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {topConsumers.map((app, idx) => {
            const pct = app.percentage_contribution ?? 0;
            return (
              <div key={app.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 90px 80px', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {idx + 1}. {app.name}
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(2, pct * 2.2))}%`,
                      background: idx === 0 ? 'var(--accent-rose)' : idx === 1 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
                <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {app.monthly_kwh} kWh
                </span>
                <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optimization Constraints Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)', borderLeft: '4px solid var(--accent-emerald)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <SlidersHorizontal size={18} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Optimization Constraints</h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '750px', lineHeight: 1.5 }}>
              Minimum Hours, Maximum Hours, Priority, Rated Power, and Daily Usage parameters are fed directly into PowerOptix's Linear Programming optimizer (<code style={{ color: 'var(--accent-cyan)' }}>scipy.optimize.linprog</code>) to compute optimal cost-saving appliance schedules.
            </p>
          </div>
          {setActiveTab && (
            <button onClick={() => setActiveTab('optimizer')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              Open LP Optimizer
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search appliance by name or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={14} color="var(--text-muted)" />
          <select className="form-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="ALL">All Categories</option>
            <option value="Cooling">Cooling</option>
            <option value="Heating">Heating</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Lighting">Lighting</option>
            <option value="Laundry">Laundry</option>
            <option value="Misc">Misc</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <select className="form-select" value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)}>
            <option value="ALL">All Priorities</option>
            <option value="Essential">Essential</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="kwh_desc">Sort: Highest kWh</option>
            <option value="kwh_asc">Sort: Lowest kWh</option>
            <option value="power_desc">Sort: Highest Power (W)</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Appliances Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Appliance Inventory & Usage Bounds</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Formula: E = (P × Q × H × D) / 1000 kWh/month + Standby Draw
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {filteredAppliances.length} of {data.appliances.length} items
          </span>
        </div>

        {filteredAppliances.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>No appliances found matching your criteria.</p>
            <button onClick={handleOpenAdd} className="btn btn-secondary">
              <Plus size={16} />
              Add New Appliance
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Appliance</th>
                  <th>Category</th>
                  <th>Power (W)</th>
                  <th>Qty</th>
                  <th>Usage (hrs/day)</th>
                  <th>Min / Max Bounds</th>
                  <th>Standby (W)</th>
                  <th>Monthly kWh</th>
                  <th>Monthly Cost</th>
                  <th>Contribution</th>
                  <th>Priority</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppliances.map((app) => {
                  const isHighest = app.name === data.highest_consuming_appliance;
                  const priorityStr = app.priority || 'Medium';
                  const priorityClass = priorityStr.toLowerCase();

                  return (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {app.name}
                          {isHighest && <span className="badge badge-essential" style={{ fontSize: '0.6rem' }}>TOP</span>}
                        </div>
                      </td>
                      <td><span className="badge badge-medium">{app.category}</span></td>
                      <td className="font-mono">{app.rated_power_w}W</td>
                      <td className="font-mono">{app.quantity}</td>
                      <td className="font-mono">{app.hours_per_day} hr/day</td>
                      <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {app.min_hours_per_day ?? 1}h – {app.max_hours_per_day ?? 24}h
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {app.standby_power_w ?? 0}W
                      </td>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {app.monthly_kwh} kWh
                      </td>
                      <td className="font-mono" style={{ fontWeight: 700 }}>
                        ₹{app.monthly_cost}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '50px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${app.percentage_contribution ?? 0}%`, height: '100%', background: isHighest ? 'var(--accent-rose)' : 'var(--accent-emerald)' }} />
                          </div>
                          <span className="font-mono" style={{ fontSize: '0.75rem' }}>{app.percentage_contribution ?? 0}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${priorityClass}`}>
                          {priorityStr}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => handleOpenEdit(app)} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }} title="Edit Appliance">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(app)} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem' }} title="Delete Appliance">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '560px', padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {editingId ? 'Edit Appliance Entry' : 'Add New Appliance'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {validationError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.15)', borderLeft: '4px solid var(--accent-rose)', color: 'var(--accent-rose)', fontSize: '0.84rem', borderRadius: '4px', marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Appliance Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Inverter Air Conditioner"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
                <select
                  className="form-select"
                  value={formData.category || 'Cooling'}
                  onChange={e => setFormData({ ...formData, category: e.target.value as ApplianceCategory })}
                >
                  <option value="Cooling">Cooling</option>
                  <option value="Heating">Heating</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Laundry">Laundry</option>
                  <option value="Misc">Misc</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Rated Power (Watts) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.rated_power_w || ''}
                  onChange={e => setFormData({ ...formData, rated_power_w: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quantity *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.quantity || 1}
                  onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Hours Used / Day *</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.hours_per_day ?? 0}
                  onChange={e => setFormData({ ...formData, hours_per_day: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Days / Month</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.days_per_month || 30}
                  onChange={e => setFormData({ ...formData, days_per_month: parseInt(e.target.value) || 30 })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Standby Power (Watts)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.standby_power_w ?? 0}
                  onChange={e => setFormData({ ...formData, standby_power_w: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Usage Priority</label>
                <select
                  className="form-select"
                  value={formData.priority || 'Medium'}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="Essential">Essential (Fixed / Protected in LP)</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Min Allowed Usage (hr/day)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.min_hours_per_day ?? 0}
                  onChange={e => setFormData({ ...formData, min_hours_per_day: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Max Allowed Usage (hr/day)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.max_hours_per_day ?? 24}
                  onChange={e => setFormData({ ...formData, max_hours_per_day: parseFloat(e.target.value) || 24 })}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Save size={16} />
                  {submitting ? 'Saving...' : editingId ? 'Update Appliance' : 'Save Appliance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '450px', padding: '1.75rem', background: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent-rose)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertCircle size={24} color="var(--accent-rose)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Delete Appliance?</h3>
            </div>
            
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Are you sure you want to remove <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong> from your household inventory?
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div><strong>Rated Power:</strong> {deleteTarget.rated_power_w}W × {deleteTarget.quantity}</div>
              <div><strong>Monthly Load:</strong> {deleteTarget.monthly_kwh} kWh/month (₹{deleteTarget.monthly_cost})</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary" disabled={submitting}>Cancel</button>
              <button onClick={handleDeleteConfirm} className="btn btn-danger" disabled={submitting}>
                <Trash2 size={16} />
                {submitting ? 'Deleting...' : 'Delete Appliance'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
