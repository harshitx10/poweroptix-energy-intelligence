import React, { useState, useEffect } from 'react';
import { Printer, Download, ShieldCheck, Zap, Award, FileText } from 'lucide-react';

export const Report: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8001/api/reports/generate', { method: 'POST' }).then(r => r.json());
        setReport(res);
      } catch (err) {
        console.error('Error generating report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  if (loading || !report) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Generating Energy Optimization Report...</div>;
  }

  const s = report.executive_summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER & ACTION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
            OFFICIAL ENERGY REPORT
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.25rem' }}>
            PowerOptix Comprehensive Energy Optimization Report
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Report Reference: {report.report_id} | Generated: {report.generated_at}
          </p>
        </div>

        <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
          <Printer size={16} />
          Print / Export PDF
        </button>
      </div>

      {/* EXECUTIVE SUMMARY CARDS */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid var(--accent-emerald)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Executive Summary & Audit Outcomes</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Bill</span>
            <h4 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)' }}>₹{s.current_monthly_bill} / mo</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.current_monthly_kwh} kWh/month</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Optimized Bill</span>
            <h4 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{s.optimized_monthly_bill} / mo</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.optimized_monthly_kwh} kWh/month</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Annual Financial Saving</span>
            <h4 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>₹{s.annual_money_saved.toLocaleString()} / yr</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>₹{s.monthly_money_saved}/month</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Efficiency Score</span>
            <h4 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{s.efficiency_score} / 100</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.energy_dna}</span>
          </div>
        </div>
      </div>

      {/* APPLIANCE BREAKDOWN TABLE */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Appliance Inventory & Consumption Breakdown</h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Appliance</th>
                <th>Category</th>
                <th>Rated Power</th>
                <th>Daily Hours</th>
                <th>Monthly kWh</th>
                <th>Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {report.appliance_breakdown.map((item: any) => (
                <tr key={item.appliance_id}>
                  <td style={{ fontWeight: 700 }}>{item.name}</td>
                  <td><span className="badge badge-low">{item.category}</span></td>
                  <td className="font-mono">{item.rated_power_w} W</td>
                  <td className="font-mono">{item.hours_per_day} hrs/day</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{item.total_kwh} kWh</td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>₹{roundVal(item.total_kwh * 8.5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

function roundVal(val: number): number {
  return Math.round(val * 100) / 100;
}
