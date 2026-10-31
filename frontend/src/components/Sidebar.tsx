import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Dna,
  AlertTriangle,
  Activity,
  LineChart,
  SlidersHorizontal,
  Cpu,
  Sliders,
  Target,
  PiggyBank,
  Sun,
  Sparkles,
  MessageSquare,
  FileText,
  BarChart2,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'energy-dna', label: 'Energy DNA Profile', icon: Dna, highlight: true },
    { id: 'appliances', label: 'Appliance Inventory', icon: Zap },
    { id: 'analytics', label: 'Consumption Analytics', icon: BarChart2 },
    { id: 'forecast', label: 'AI Energy Forecast', icon: LineChart },
    { id: 'optimizer', label: 'LP Energy Optimizer', icon: SlidersHorizontal, highlight: true },
    { id: 'digital-twin', label: 'Energy Digital Twin', icon: Cpu, highlight: true },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'anomaly-detector', label: 'Anomaly Center', icon: Activity },
    { id: 'peak-load', label: 'Peak Load Analyzer', icon: Activity },
    { id: 'budget', label: 'Savings Goals', icon: Target },
    { id: 'payback', label: 'Payback Analyzer', icon: PiggyBank },
    { id: 'solar-ev', label: 'Solar & EV Sandbox', icon: Sun },
    { id: 'waste-detector', label: 'Waste Radar', icon: AlertTriangle },
    { id: 'reports', label: 'Report Center', icon: FileText },
    { id: 'recommendations', label: 'Smart Recommendations', icon: Sparkles },
    { id: 'assistant', label: 'Natural Language AI', icon: MessageSquare },
    { id: 'settings', label: 'Tariff & Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
        }}>
          <Zap size={20} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.03em' }}>POWER<span style={{ color: 'var(--accent-emerald)' }}>OPTIX</span></h2>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>See. Predict. Optimize. Save.</p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '0.75rem 0.65rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 0.75rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Intelligence Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.85rem',
                margin: '0.15rem 0',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--accent-emerald-glow)' : 'transparent',
                color: isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid var(--accent-emerald)' : '3px solid transparent'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--accent-emerald)' : 'var(--text-muted)'} />
              <span>{item.label}</span>
              {item.highlight && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.6rem',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--accent-emerald)',
                  fontWeight: 700
                }}>CORE</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>PowerOptix Intelligence Platform</p>
        <p>AI-Based Energy Optimization</p>
      </div>
    </aside>
  );
};
