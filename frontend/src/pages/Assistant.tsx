import React, { useState } from 'react';
import { Sparkles, Send, HelpCircle, Zap, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';

export const Assistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([
    {
      q: 'How much electricity does my AC consume?',
      a: 'Your Air Conditioner (1.5 Ton split) consumes 272.16 kWh/month (38.3% of total consumption), costing approximately ₹2,313/month.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    'How much electricity does my AC consume?',
    'Why is my bill high?',
    'What happens if I reduce AC usage by 2 hours?',
    'Which appliance should I optimize first?',
    'How much can I save this month?'
  ];

  const handleSend = async (qStr?: string) => {
    const text = qStr || query;
    if (!text.trim()) return;

    try {
      setLoading(true);
      const res = await api.askAssistant(text);
      setHistory(prev => [...prev, { q: text, a: res.answer }]);
      setQuery('');
    } catch (err) {
      console.error('Assistant error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sparkles size={18} color="var(--accent-cyan)" />
          <span className="badge badge-low" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
            POWEROPTIX CALCULATED ADVISORY ASSISTANT
          </span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Natural Language Energy Assistant
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
          Ask natural language questions about your appliances, bill drivers, and energy savings. PowerOptix responds using exact calculated metrics from your database.
        </p>
      </div>

      {/* SAMPLE QUERIES CHIPS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {sampleQueries.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          >
            <HelpCircle size={14} color="var(--accent-cyan)" />
            {sq}
          </button>
        ))}
      </div>

      {/* CONVERSATION FEED */}
      <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '400px' }}>
          {history.map((h, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* User question */}
              <div style={{ alignSelf: 'flex-end', background: 'rgba(6, 182, 212, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', maxWidth: '80%', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <strong>You: </strong>{h.q}
              </div>
              {/* Assistant answer */}
              <div style={{ alignSelf: 'flex-start', background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: '85%', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--accent-emerald)' }}>⚡ PowerOptix Intelligence: </strong>{h.a}
              </div>
            </div>
          ))}
        </div>

        {/* INPUT BAR */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: '0.95rem' }}
            placeholder="Ask anything (e.g. Why is my bill high?)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button onClick={() => handleSend()} disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
            <Send size={16} />
            Ask
          </button>
        </div>
      </div>

    </div>
  );
};
