import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Navbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} />
      {sidebarOpen && (
        <div className="dashboard-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <main className="dashboard-content">
        <div className="dashboard-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
