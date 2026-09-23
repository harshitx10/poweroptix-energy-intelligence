import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'var(--accent-emerald)',
  badgeText,
  badgeType = 'success'
}) => {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{title}</span>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>

      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        {value}
      </div>

      {subtext && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{subtext}</span>
          {badgeText && (
            <span className={`badge badge-${badgeType}`} style={{ fontSize: '0.65rem' }}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
