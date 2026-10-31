import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldCheck, Activity, LineChart, Volume2 } from 'lucide-react';
import { api } from '../api/client';
import { speakPowerOptix } from '../utils/audioAssistant';

export const AnomalyDetector: React.FC = () => {
  const [anomData, setAnomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const speakAnomalyInfo = (count: number) => {
    if (count > 0) {
      speakPowerOptix('Attention. An unusual energy consumption pattern was detected.', 'HIGH', 'anomaly_detected_evt', 'warning');
    } else {
      speakPowerOptix('Anomaly check completed. No abnormal energy consumption patterns were detected.', 'MEDIUM', 'anomaly_clean_evt', 'success');
    }
  };

  useEffect(() => {
    async function loadAnomalies() {
      try {
        setLoading(true);
        const res = await api.runAnomalyDetection();
        setAnomData(res);
        if (res && res.anomalies_detected_count > 0) {
          speakAnomalyInfo(res.anomalies_detected_count);
        }
      } catch (err) {
        console.error('Error running anomaly detection:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnomalies();
  }, []);

  if (loading || !anomData) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Executing Unsupervised Isolation Forest Anomaly Detection...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(6, 182, 212, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Activity size={18} color="var(--accent-rose)" />
              <span className="badge badge-essential">UNSUPERVISED ML ISOLATION FOREST</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Consumption Anomaly & Spike Detector
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Uses scikit-learn Isolation Forest to isolate abnormal statistical outliers in daily peak and overnight consumption patterns.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Anomalies Flagged</span>
              <strong className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                {anomData.anomalies_detected_count} Outliers
              </strong>
            </div>

            <button
              onClick={() => speakAnomalyInfo(anomData.anomalies_detected_count)}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Listen to Anomaly Alert"
            >
              <Volume2 size={16} color="var(--accent-rose)" />
              Listen
            </button>
          </div>
        </div>
      </div>

      {/* DETECTED ANOMALIES LIST */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Flagged Abnormal Consumption Instances</h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Observed Daily kWh</th>
                <th>Expected Baseline</th>
                <th>Deviation (%)</th>
                <th>Severity</th>
                <th>Model Hypothesis</th>
              </tr>
            </thead>
            <tbody>
              {anomData.detected_anomalies.map((anom: any, idx: number) => (
                <tr key={idx} style={{ background: 'rgba(239, 68, 68, 0.06)' }}>
                  <td className="font-mono" style={{ fontWeight: 700 }}>{anom.date}</td>
                  <td>{anom.day_of_week}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>{anom.observed_kwh} kWh</td>
                  <td className="font-mono">{anom.expected_kwh} kWh</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>+{anom.deviation_percentage}%</td>
                  <td><span className="badge badge-essential">{anom.severity}</span></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{anom.possible_reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
