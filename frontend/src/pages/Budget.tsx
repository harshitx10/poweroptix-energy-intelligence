import React, { useState, useEffect } from 'react';
import { Target, DollarSign, Zap, TrendingDown, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { EnergyGoal, OptimizationResponse } from '../types';

interface BudgetProps {
  onDataChanged: () => void;
}

export const Budget: React.FC<BudgetProps> = ({ onDataChanged }) => {
  const [goal, setGoal] = useState<EnergyGoal | null>(null);
  const [inputBudget, setInputBudget] = useState<number>(3000);
  const [optResult, setOptResult] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGoal = async () => {
    try {
      setLoading(true);
      const res = await api.getGoal();
      setGoal(res);
      setInputBudget(res.target_budget);
      const opt = await api.runOptimization(res.target_budget);
      setOptResult(opt);
    } catch (err) {
      console.error('Error loading budget goal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoal();
  }, []);

  const handleUpdateBudget = async () => {
    try {
      setLoading(true);
      await api.updateGoal(inputBudget);
      const opt = await api.runOptimization(inputBudget);
      setOptResult(opt);
      loadGoal();
      onDataChanged();
    } catch (err) {
      alert(`Error updating budget: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !goal || !optResult) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Energy Budget Planner...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Target size={18} color="var(--accent-amber)" />
              <span className="badge badge-high" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)' }}>
                COST ALLOCATION & BUDGET CONTROL
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Energy Target Budget Planner
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Set your target monthly electricity bill limit. The system determines exact required kWh reductions and auto-allocates appliance usage hours to guarantee budget compliance.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Budget (₹)</label>
              <input
                type="number"
                className="form-input font-mono"
                style={{ width: '130px', fontSize: '1.1rem', fontWeight: 800, marginTop: '0.25rem' }}
                value={inputBudget}
                onChange={e => setInputBudget(parseFloat(e.target.value) || 0)}
              />
            </div>

            <button onClick={handleUpdateBudget} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              Save & Re-allocate
            </button>
          </div>
        </div>
      </div>

      {/* BUDGET VARIANCE CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Current Estimated Bill</span>
          <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.3rem' }}>
            ₹{goal.current_bill.toLocaleString()}
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{goal.current_kwh} kWh/month</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-amber)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Monthly Budget</span>
          <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.3rem' }}>
            ₹{goal.target_budget.toLocaleString()}
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Configurable user goal</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: `4px solid ${goal.budget_met ? 'var(--accent-emerald)' : 'var(--accent-rose)'}` }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Budget Overage / Variance</span>
          <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: goal.budget_met ? 'var(--accent-emerald)' : 'var(--accent-rose)', marginTop: '0.3rem' }}>
            {goal.budget_variance > 0 ? `+₹${goal.budget_variance.toLocaleString()}` : `-₹${Math.abs(goal.budget_variance).toLocaleString()}`}
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {goal.budget_met ? 'Within target budget' : 'Exceeding target limit'}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Optimized Bill Target</span>
          <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.3rem' }}>
            ₹{optResult.optimized_monthly_bill.toLocaleString()}
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            {optResult.budget_met ? '✅ Target Budget Met' : '⚠️ Minimal reduction applied'}
          </span>
        </div>
      </div>

      {/* APPLIANCE ALLOCATION PLAN FOR BUDGET */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
          Appliance Usage Allocation Plan to Satisfy ₹{goal.target_budget} Target Budget
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Appliance</th>
                <th>Priority</th>
                <th>Current Usage</th>
                <th>Required Budget Usage</th>
                <th>Daily Reduction</th>
                <th>Monthly Cost Saved</th>
              </tr>
            </thead>
            <tbody>
              {optResult.appliance_results.map(app => (
                <tr key={app.appliance_id}>
                  <td><strong style={{ fontSize: '0.9rem' }}>{app.name}</strong></td>
                  <td><span className={`badge badge-${app.priority.toLowerCase()}`}>{app.priority}</span></td>
                  <td className="font-mono">{app.current_hours} hr/day</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {app.optimized_hours} hr/day
                  </td>
                  <td className="font-mono" style={{ color: app.hours_reduction > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                    {app.hours_reduction > 0 ? `-${app.hours_reduction} hr/day` : '0 hr/day'}
                  </td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    ₹{app.money_saved} / month
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
