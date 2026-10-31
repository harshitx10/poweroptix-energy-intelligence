import React, { useState, useEffect } from 'react';
import { Sun, Moon, Zap, ShieldCheck, Target, Volume2, VolumeX } from 'lucide-react';
import { DashboardSummary } from '../types';
import { isAudioAssistantEnabled, setAudioAssistantEnabled } from '../utils/audioAssistant';

interface NavbarProps {
  activeTab: string;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  summary: DashboardSummary | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, theme, setTheme, summary }) => {
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  useEffect(() => {
    setAudioEnabled(isAudioAssistantEnabled());
  }, []);

  const handleToggleAudio = () => {
    const newState = setAudioAssistantEnabled(!audioEnabled);
    setAudioEnabled(newState);
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Executive Smart Energy Dashboard';
      case 'appliances': return 'Appliance Inventory & Consumption Entry';
      case 'optimizer': return 'Mathematical Energy Optimizer (SciPy Linprog)';
      case 'digital-twin': return 'What-If Energy Digital Twin Engine';
      case 'simulator': return 'Real-Time Interactive What-If Simulator';
      case 'forecast': return 'ML Electricity Consumption Forecaster';
      case 'budget': return 'Target Budget & Cost Allocation Planner';
      case 'recommendations': return 'Explainable Smart Recommendations';
      case 'settings': return 'Tariff Slabs & System Configuration';
      default: return 'PowerOptix Dashboard';
    }
  };

  return (
    <header style={{
      padding: '1.25rem 2rem',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{getTabTitle(activeTab)}</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          AI-Based Electricity Consumption Forecasting, Cost Optimization & Energy Digital Twin
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Quick Stats Badges */}
        {summary && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="glass-panel" style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
              <Zap size={14} color="var(--accent-emerald)" />
              <span style={{ color: 'var(--text-muted)' }}>Consumption:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{summary.monthly_consumption_kwh} kWh</strong>
            </div>

            <div className="glass-panel" style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
              <Target size={14} color={summary.is_over_budget ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
              <span style={{ color: 'var(--text-muted)' }}>Bill:</span>
              <strong style={{ color: summary.is_over_budget ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                {summary.currency}{summary.estimated_monthly_bill.toLocaleString()}
              </strong>
            </div>
          </div>
        )}

        {/* Audio Assistant Toggle */}
        <button
          onClick={handleToggleAudio}
          className={`btn ${audioEnabled ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease'
          }}
          title={audioEnabled ? 'Audio Assistant ON (Click to Mute)' : 'Audio Assistant OFF (Click to Enable)'}
          aria-label="Toggle Audio Assistant"
        >
          {audioEnabled ? (
            <>
              <Volume2 size={16} color="#ffffff" />
              <span style={{ fontWeight: 600 }}>Audio ON</span>
            </>
          ) : (
            <>
              <VolumeX size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Audio OFF</span>
            </>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} color="var(--accent-amber)" /> : <Moon size={18} color="var(--accent-cyan)" />}
        </button>
      </div>
    </header>
  );
};
