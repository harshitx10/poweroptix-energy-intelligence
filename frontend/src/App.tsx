import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

import { Dashboard } from './pages/Dashboard';
import { Appliances } from './pages/Appliances';
import { EnergyDna } from './pages/EnergyDna';
import { WasteDetector } from './pages/WasteDetector';
import { AnomalyDetector } from './pages/AnomalyDetector';
import { Optimizer } from './pages/Optimizer';
import { DigitalTwin } from './pages/DigitalTwin';
import { Simulator } from './pages/Simulator';
import { Forecast } from './pages/Forecast';
import { Budget } from './pages/Budget';
import { PaybackAnalyzer } from './pages/PaybackAnalyzer';
import { SolarEvSimulator } from './pages/SolarEvSimulator';
import { Recommendations } from './pages/Recommendations';
import { Assistant } from './pages/Assistant';
import { SettingsPage } from './pages/Settings';
import { PeakLoad } from './pages/PeakLoad';
import { Report } from './pages/Report';
import { Analytics } from './pages/Analytics';

import { api } from './api/client';
import { DashboardSummary } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const fetchSummary = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} summary={summary} refreshSummary={fetchSummary} />;
      case 'appliances':
        return <Appliances onDataChanged={fetchSummary} setActiveTab={setActiveTab} />;
      case 'energy-dna':
        return <EnergyDna />;
      case 'analytics':
        return <Analytics />;
      case 'waste-detector':
        return <WasteDetector />;
      case 'anomaly-detector':
        return <AnomalyDetector />;
      case 'peak-load':
        return <PeakLoad />;
      case 'optimizer':
        return <Optimizer onDataChanged={fetchSummary} />;
      case 'digital-twin':
        return <DigitalTwin onDataChanged={fetchSummary} />;
      case 'simulator':
        return <Simulator onDataChanged={fetchSummary} />;
      case 'forecast':
        return <Forecast />;
      case 'budget':
        return <Budget onDataChanged={fetchSummary} />;
      case 'payback':
        return <PaybackAnalyzer />;
      case 'solar-ev':
        return <SolarEvSimulator />;
      case 'reports':
        return <Report />;
      case 'recommendations':
        return <Recommendations />;
      case 'assistant':
        return <Assistant />;
      case 'settings':
        return <SettingsPage onDataChanged={fetchSummary} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} summary={summary} refreshSummary={fetchSummary} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <Navbar activeTab={activeTab} theme={theme} setTheme={setTheme} summary={summary} />
        <div className="content-body">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
}

export default App;
