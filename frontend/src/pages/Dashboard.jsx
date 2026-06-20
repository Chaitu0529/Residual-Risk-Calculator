import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { riskService } from '../services/riskService';
import { auditService } from '../services/auditService';
import { FullPageSpinner } from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { statusBadgeClass, formatStatus } from '../utils/riskUtils';

const RISK_COLORS = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const STATUS_COLORS = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  MITIGATED: '#22c55e',
  ACCEPTED: '#a855f7',
  CLOSED: '#6b7280',
};

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
        {label && <p className="text-gray-400 text-xs mb-1">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentAudit, setRecentAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, auditRes] = await Promise.allSettled([
          riskService.getStats(),
          isAdmin ? auditService.getRecent() : Promise.resolve(null),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (auditRes.status === 'fulfilled' && auditRes.value) {
          setRecentAudit(auditRes.value.data?.slice(0, 8) || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (loading) return <FullPageSpinner />;

  const riskLevelData = stats
    ? [
        { name: 'LOW', value: stats.lowRisks || 0 },
        { name: 'MEDIUM', value: stats.mediumRisks || 0 },
        { name: 'HIGH', value: stats.highRisks || 0 },
        { name: 'CRITICAL', value: stats.criticalRisks || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const statusData = stats
    ? [
        { name: 'Open', value: stats.openRisks || 0, color: STATUS_COLORS.OPEN },
        { name: 'In Progress', value: stats.inProgressRisks || 0, color: STATUS_COLORS.IN_PROGRESS },
        { name: 'Mitigated', value: stats.mitigatedRisks || 0, color: STATUS_COLORS.MITIGATED },
        { name: 'Accepted', value: stats.acceptedRisks || 0, color: STATUS_COLORS.ACCEPTED },
        { name: 'Closed', value: stats.closedRisks || 0, color: STATUS_COLORS.CLOSED },
      ]
    : [];

  const monthlyData = stats?.monthlyTrend || [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.fullName?.split(' ')[0] || user?.username}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isAdmin && (
          <Link to="/risks/new" className="btn-primary">
            <PlusIcon className="w-4 h-4" />
            New Risk Record
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Risks"
          value={stats?.totalRisks}
          icon={ShieldExclamationIcon}
          color="bg-primary-600"
          subtitle="All risk records"
        />
        <StatCard
          title="Critical"
          value={stats?.criticalRisks}
          icon={ExclamationTriangleIcon}
          color="bg-red-600"
          subtitle="Require immediate action"
        />
        <StatCard
          title="Open"
          value={stats?.openRisks}
          icon={InformationCircleIcon}
          color="bg-blue-600"
          subtitle="Awaiting mitigation"
        />
        <StatCard
          title="Mitigated"
          value={stats?.mitigatedRisks}
          icon={CheckCircleIcon}
          color="bg-green-600"
          subtitle="Controls applied"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="High"
          value={stats?.highRisks}
          icon={ExclamationTriangleIcon}
          color="bg-orange-600"
        />
        <StatCard
          title="Medium"
          value={stats?.mediumRisks}
          icon={ShieldExclamationIcon}
          color="bg-yellow-600"
        />
        <StatCard
          title="Low"
          value={stats?.lowRisks}
          icon={CheckCircleIcon}
          color="bg-emerald-600"
        />
        <StatCard
          title="Avg Residual"
          value={stats?.averageResidualRisk != null ? Number(stats.averageResidualRisk).toFixed(1) : '—'}
          icon={ShieldExclamationIcon}
          color="bg-purple-600"
          subtitle="Average residual score"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie — Risk Levels */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Risk Distribution by Level</h2>
          {riskLevelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskLevelData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {riskLevelData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-gray-300 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No data</div>
          )}
        </div>

        {/* Bar — Status */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Risks by Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart — Monthly Trend */}
      {monthlyData.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Monthly Risk Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Risks" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Audit Log */}
      {isAdmin && recentAudit.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            <Link to="/audit" className="text-primary-400 text-sm hover:text-primary-300">View all →</Link>
          </div>
          <div className="divide-y divide-gray-700">
            {recentAudit.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-300 text-xs font-bold">
                      {log.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-200">
                      <span className="font-medium text-white">{log.username}</span>{' '}
                      <span className="text-primary-400">{log.action}</span>{' '}
                      {log.entityType}
                    </p>
                    {log.description && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">{log.description}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex-shrink-0">
                  {log.timestamp ? format(new Date(log.timestamp), 'MMM d, HH:mm') : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
