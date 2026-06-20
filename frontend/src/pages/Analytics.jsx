import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { riskService } from '../services/riskService';
import { FullPageSpinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';

const RISK_COLORS = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const CATEGORY_COLORS = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl text-sm">
        {label && <p className="text-gray-300 mb-1 font-medium">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill }} className="font-semibold">
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [allRisks, setAllRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats and risks separately so one failure doesn't block the other
        let statsData = null;
        let risksData = [];

        try {
          const statsRes = await riskService.getStats();
          statsData = statsRes.data;
        } catch (e) {
          console.error('Stats fetch failed:', e.response?.status, e.response?.data, e.message);
          toast.error(`Stats error: ${e.response?.status || e.message}`);
        }

        try {
          const risksRes = await riskService.getAll({ size: 1000, page: 0 });
          risksData = risksRes.data?.content || [];
        } catch (e) {
          console.error('Risks fetch failed:', e.response?.status, e.response?.data, e.message);
          toast.error(`Risks error: ${e.response?.status || e.message}`);
        }

        setStats(statsData);
        setAllRisks(risksData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <FullPageSpinner />;

  // Risk level distribution data
  const levelData = [
    { name: 'LOW', value: stats?.lowRisks || 0 },
    { name: 'MEDIUM', value: stats?.mediumRisks || 0 },
    { name: 'HIGH', value: stats?.highRisks || 0 },
    { name: 'CRITICAL', value: stats?.criticalRisks || 0 },
  ];

  // Category breakdown
  const categoryMap = {};
  allRisks.forEach((r) => {
    const cat = r.category?.replace(/_/g, ' ') || 'Unknown';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Scatter: likelihood vs impact colored by level
  const scatterData = allRisks.map((r) => ({
    x: r.likelihood,
    y: r.impact,
    z: r.residualRisk || 10,
    level: r.riskLevel,
    title: r.riskTitle,
  }));

  // Radar: average residual by category
  const catResidualMap = {};
  const catCountMap = {};
  allRisks.forEach((r) => {
    const cat = r.category?.replace(/_/g, ' ').slice(0, 12) || 'Unknown';
    catResidualMap[cat] = (catResidualMap[cat] || 0) + (r.residualRisk || 0);
    catCountMap[cat] = (catCountMap[cat] || 0) + 1;
  });
  const radarData = Object.keys(catResidualMap)
    .slice(0, 8)
    .map((cat) => ({
      category: cat,
      avgResidual: catResidualMap[cat] / catCountMap[cat],
    }));

  // Control effectiveness histogram
  const ceRanges = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 },
  ];
  allRisks.forEach((r) => {
    const ce = r.controlEffectiveness || 0;
    if (ce <= 20) ceRanges[0].count++;
    else if (ce <= 40) ceRanges[1].count++;
    else if (ce <= 60) ceRanges[2].count++;
    else if (ce <= 80) ceRanges[3].count++;
    else ceRanges[4].count++;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Visualise your risk portfolio — {allRisks.length} records analysed
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Risks', value: stats?.totalRisks ?? 0, color: 'text-primary-400' },
          { label: 'Critical', value: stats?.criticalRisks ?? 0, color: 'text-red-400' },
          { label: 'Avg Residual', value: Number(stats?.averageResidualRisk || 0).toFixed(1), color: 'text-orange-400' },
          { label: 'Open Risks', value: stats?.openRisks ?? 0, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie — Risk Levels */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Risk Level Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={levelData.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                dataKey="value"
                label={({ name, value, percent }) =>
                  value > 0 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
                }
              >
                {levelData.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span className="text-gray-300 text-xs">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar — By Category */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Risks by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={90} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar — Avg Residual by Category */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Average Residual Risk by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 9 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 8 }} />
              <Radar name="Avg Residual" dataKey="avgResidual" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar — Control Effectiveness */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Control Effectiveness Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ceRanges} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="count" name="Count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scatter: Likelihood vs Impact */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-white mb-1">Risk Heat Map — Likelihood vs Impact</h2>
        <p className="text-gray-500 text-xs mb-4">Bubble size represents residual risk score</p>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              type="number"
              dataKey="x"
              name="Likelihood"
              domain={[0, 11]}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              label={{ value: 'Likelihood', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Impact"
              domain={[0, 11]}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              label={{ value: 'Impact', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl max-w-xs">
                      <p className="text-white font-medium mb-1 truncate">{d?.title}</p>
                      <p className="text-gray-400">Likelihood: {d?.x} · Impact: {d?.y}</p>
                      <p className="text-gray-400">Residual: {d?.z?.toFixed(1)}</p>
                      <span
                        className="badge mt-1"
                        style={{ background: RISK_COLORS[d?.level] + '33', color: RISK_COLORS[d?.level] }}
                      >
                        {d?.level}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
              <Scatter
                key={level}
                name={level}
                data={scatterData.filter((d) => d.level === level)}
                fill={RISK_COLORS[level]}
                opacity={0.75}
              />
            ))}
            <Legend formatter={(v) => <span className="text-gray-300 text-xs">{v}</span>} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
