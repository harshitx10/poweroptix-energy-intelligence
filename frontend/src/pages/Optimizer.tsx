import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Zap, DollarSign, TrendingDown, HelpCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { OptimizationResponse } from '../types';

interface OptimizerProps {
  onDataChanged: () => void;
}

export const Optimizer: React.FC<OptimizerProps> = ({ onDataChanged }) => {
  const [targetBudget, setTargetBudget] = useState<number>(3000);
  const [optResult, setOptResult] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runOptimizer = async (budgetVal?: number) => {
    try {
      setLoading(true);
      const b = budgetVal !== undefined ? budgetVal : targetBudget;
      const res = await api.runOptimization(b);
      setOptResult(res);
      onDataChanged();
    } catch (err) {
      alert(`Optimization error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runOptimizer(3000);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner & Control */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-low" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
                MATHEMATICAL LINEAR PROGRAMMING SOLVER
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>scipy.optimize.linprog (Highs Method)</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Mathematical Energy Usage Allocation Engine
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Minimizes total monthly energy consumption and tariff charges subject to appliance operational bounds, essential service guarantees, and monthly budget constraints.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Budget (₹)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="number"
                  className="form-input font-mono"
                  style={{ width: '130px', fontSize: '1.1rem', fontWeight: 800 }}
                  value={targetBudget}
                  onChange={e => setTargetBudget(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <button onClick={() => runOptimizer()} disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              <SlidersHorizontal size={18} />
              {loading ? 'Solving LP...' : 'Execute Optimizer'}
            </button>
          </div>
        </div>
      </div>

      {optResult && (
        <>
          {/* COMPARISON RESULTS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Consumption</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.4rem' }}>
                <span className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{optResult.optimized_total_kwh} kWh</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{optResult.current_total_kwh} kWh</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                ⚡ Saved {optResult.total_kwh_saved} kWh/month
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Monthly Bill</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.4rem' }}>
                <span className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  ₹{optResult.optimized_monthly_bill.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ₹{optResult.current_monthly_bill.toLocaleString()}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                💰 Save ₹{optResult.monthly_money_saved.toLocaleString()}/month
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-amber)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Annual Financial Impact</span>
              <h3 className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.4rem' }}>
                ₹{optResult.annual_money_saved.toLocaleString()} / year
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct household savings</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Budget Status</span>
              <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {optResult.budget_met ? (
                  <>
                    <CheckCircle2 size={24} color="var(--accent-emerald)" />
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>Target Met</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={24} color="var(--accent-amber)" />
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>Tight Budget</span>
                  </>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target: ₹{targetBudget}</span>
            </div>
          </div>

          {/* EXPLAINABILITY PANEL */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <HelpCircle size={20} color="var(--accent-cyan)" />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>WHY DID POWEROPTIX RECOMMEND THIS USAGE PLAN?</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Dynamic mathematical explainability log derived from scipy LP solution vector x and appliance constraints.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {optResult.appliance_results.map((res) => (
                <div key={res.appliance_id} style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 2fr 1fr 1fr 2fr',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  {/* Appliance info */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{res.name}</h4>
                    <span className={`badge badge-${res.priority.toLowerCase()}`} style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
                      {res.priority}
                    </span>
                  </div>

                  {/* Hours Change */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Current</span>
                      <strong className="font-mono" style={{ fontSize: '1rem' }}>{res.current_hours} hr/d</strong>
                    </div>
                    <ArrowRight size={16} color="var(--accent-cyan)" />
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent-emerald)', display: 'block' }}>Optimized</span>
                      <strong className="font-mono" style={{ fontSize: '1rem', color: 'var(--accent-emerald)' }}>{res.optimized_hours} hr/d</strong>
                    </div>
                  </div>

                  {/* Energy Saved */}
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Energy Saved</span>
                    <strong className="font-mono" style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                      {res.kwh_saved > 0 ? `-${res.kwh_saved} kWh` : '0 kWh'}
                    </strong>
                  </div>

                  {/* Money Saved */}
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Monthly Saving</span>
                    <strong className="font-mono" style={{ color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>
                      {res.money_saved > 0 ? `₹${res.money_saved}` : '₹0'}
                    </strong>
                  </div>

                  {/* Explainability Reasoning */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Reason: </strong>
                    {res.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
