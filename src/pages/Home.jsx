import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { FiUsers, FiShoppingCart, FiTrendingUp, FiArrowUpRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getUsers } from '../services/userService';
import { getCarts } from '../services/cartService';
import Loader from '../components/Loader';
import { fullName, formatDate, totalCartQuantity } from '../utils/format';
import '../styles/shared.css';
import './Home.css';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [u, c] = await Promise.all([getUsers(), getCarts()]);
        if (!active) return;
        setUsers(u);
        setCarts(c);
      } catch (error) {
        toast.error(error.message || 'Failed to load dashboard data.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const recentUsers = useMemo(() => [...users].slice(-5).reverse(), [users]);
  const recentCarts = useMemo(() => [...carts].slice(-5).reverse(), [carts]);

  const cartTrend = useMemo(() => {
    return carts
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((cart, idx) => ({
        name: `#${cart.id}`,
        items: totalCartQuantity(cart.products),
        idx,
      }));
  }, [carts]);

  const usersByActivity = useMemo(() => {
    const buckets = { Admin: 0, Customer: 0 };
    users.forEach((u) => {
      buckets[u.username?.toLowerCase().includes('adm') ? 'Admin' : 'Customer'] += 1;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [users]);

  if (isLoading) return <Loader fullScreen={false} label="Loading dashboard…" size="lg" />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p className="page-subtitle">A snapshot of your store's users and carts.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          icon={<FiUsers size={18} />}
          label="Total Users"
          value={users.length}
          accent="accent"
        />
        <StatCard
          icon={<FiShoppingCart size={18} />}
          label="Total Carts"
          value={carts.length}
          accent="secondary"
        />
        <StatCard
          icon={<FiTrendingUp size={18} />}
          label="Items in carts"
          value={carts.reduce((sum, c) => sum + totalCartQuantity(c.products), 0)}
          accent="accent"
        />
        <StatCard
          icon={<FiArrowUpRight size={18} />}
          label="Avg items / cart"
          value={
            carts.length
              ? (carts.reduce((sum, c) => sum + totalCartQuantity(c.products), 0) / carts.length).toFixed(1)
              : '0'
          }
          accent="secondary"
        />
      </div>

      <div className="chart-grid">
        <div className="card chart-card">
          <h3>Cart size by order</h3>
          <p className="page-subtitle">Total quantity of items per cart, in order placed.</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cartTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
              />
              <Area type="monotone" dataKey="items" stroke="var(--accent)" fill="url(#cartGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>User segments</h3>
          <p className="page-subtitle">Username pattern breakdown.</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={usersByActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
              />
              <Bar dataKey="value" fill="var(--accent-secondary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-grid">
        <div className="table-card">
          <div className="recent-header">
            <h3>Recent users</h3>
            <Link to="/users" className="recent-link">View all</Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th></tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="cell-primary">{fullName(u)}</td>
                    <td>{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="recent-header">
            <h3>Recent carts</h3>
            <Link to="/carts" className="recent-link">View all</Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Cart</th><th>Date</th><th>Items</th></tr>
              </thead>
              <tbody>
                {recentCarts.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-primary">#{c.id}</td>
                    <td>{formatDate(c.date)}</td>
                    <td>{totalCartQuantity(c.products)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card-icon">{icon}</div>
      <div>
        <div className="stat-card-value mono">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}
