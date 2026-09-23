import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Zap, AlertCircle, Save, X } from 'lucide-react';
import { api } from '../api/client';
import { Appliance, ApplianceAnalyticsSummary, ApplianceCategory } from '../types';

interface AppliancesProps {
  onDataChanged: () => void;
}

export const Appliances: React.FC<AppliancesProps> = ({ onDataChanged }) => {
  const [data, setData] = useState<ApplianceAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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
      const res = await api.getAppliances();
      setData(res);
    } catch (err) {
      console.error('Error fetching appliances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppliances();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
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
    setFormData({ ...app });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this appliance?')) {
      await api.deleteAppliance(id);
      loadAppliances();
      onDataChanged();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateAppliance(editingId, formData);
      } else {
        await api.createAppliance(formData);
      }
      setShowModal(false);
      loadAppliances();
      onDataChanged();
    } catch (err) {
      alert(`Error saving appliance: ${err}`);
    }
  };

  if (loading || !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Appliance Inventory...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Household kWh</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{data.total_monthly_kwh} kWh</h3>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Monthly Bill</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{data.total_monthly_cost.toLocaleString()}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Highest Consumer</span>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-rose)' }}>{data.highest_consuming_appliance || 'N/A'}</h4>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{data.highest_consuming_kwh} kWh/month</span>
        </div>
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={18} />
            Add Appliance
          </button>
        </div>
      </div>

      {/* Appliances Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Appliance Consumption & Constraint Inventory</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Dynamic formula: E_i = (P_i × Q_i × H_i × D_i) / 1000 kWh/month + standby draw
            </p>
          </div>
        </div>

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
                <th>Monthly kWh</th>
                <th>Monthly Cost</th>
                <th>Contribution</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.appliances.map((app) => {
                const isHighest = app.name === data.highest_consuming_appliance;
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
                      {app.min_hours_per_day}h – {app.max_hours_per_day}h
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {app.monthly_kwh} kWh
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      ₹{app.monthly_cost}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${app.percentage_contribution}%`, height: '100%', background: isHighest ? 'var(--accent-rose)' : 'var(--accent-emerald)' }} />
                        </div>
                        <span className="font-mono" style={{ fontSize: '0.75rem' }}>{app.percentage_contribution}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${app.priority.toLowerCase()}`}>
                        {app.priority}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEdit(app)} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(app.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem' }}>
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
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '550px', padding: '2rem', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {editingId ? 'Edit Appliance Entry' : 'Smart Electricity Usage Entry'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Appliance Name</label>
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
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Rated Power (Watts)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.rated_power_w || 0}
                  onChange={e => setFormData({ ...formData, rated_power_w: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.quantity || 1}
                  onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Hours Used / Day</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.hours_per_day || 0}
                  onChange={e => setFormData({ ...formData, hours_per_day: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Days / Month</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.days_per_month || 30}
                  onChange={e => setFormData({ ...formData, days_per_month: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Standby Power (Watts)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.standby_power_w || 0}
                  onChange={e => setFormData({ ...formData, standby_power_w: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Usage Priority</label>
                <select
                  className="form-select"
                  value={formData.priority || 'Medium'}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="Essential">Essential (Fixed / No Cut)</option>
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
                  value={formData.min_hours_per_day || 0}
                  onChange={e => setFormData({ ...formData, min_hours_per_day: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Max Allowed Usage (hr/day)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.max_hours_per_day || 24}
                  onChange={e => setFormData({ ...formData, max_hours_per_day: parseFloat(e.target.value) })}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  Save Appliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
