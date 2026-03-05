'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export interface ToolStat {
    name: string;
    value: number;
}

export interface CountryStat {
    country: string;
    count: number;
    tier: 'high' | 'medium' | 'low';
    trend: number;
}

interface AdminChartsProps {
    toolData: ToolStat[];
    countryData: CountryStat[];
    loading: boolean;
    timeRange: string;
    setTimeRange: (val: string) => void;
    toolFilter: string;
    setToolFilter: (val: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#cbd5e1'];

const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode === 'Unknown') return '🌐';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

const getTierColor = (tier: string) => {
    switch (tier) {
        case 'high': return '#10b981'; // Emerald
        case 'medium': return '#fbbf24'; // Amber
        default: return '#94a3b8'; // Slate
    }
};

const getTierLabel = (tier: string) => {
    switch (tier) {
        case 'high': return 'High RPM';
        case 'medium': return 'Medium RPM';
        default: return 'Low RPM';
    }
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const trendIcon = data.trend > 0 ? '⬆️' : data.trend < 0 ? '⬇️' : '⚖️';
        const trendColor = data.trend > 0 ? 'text-green-500' : data.trend < 0 ? 'text-rose-500' : 'text-slate-500';
        const trendText = data.trend > 0 ? `+${data.trend}%` : `${data.trend}%`;

        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-xl flex flex-col gap-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl leading-none" role="img" aria-label={`${label} flag`}>{getFlagEmoji(label)}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{label}</p>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Requests:</span>
                    <span className="font-mono font-bold">{data.count.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Trend:</span>
                    <span className={`font-mono font-bold flex items-center gap-1 ${trendColor}`}>
                        {trendIcon} {Math.abs(data.trend) > 0 ? trendText : '0%'}
                    </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">RPM Tier</span>
                    <Badge
                        variant="secondary"
                        className={`border-0 text-[10px] uppercase tracking-wider ${data.tier === 'high' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30' :
                            data.tier === 'medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30' :
                                'bg-slate-50 text-slate-700 dark:bg-white/5 dark:text-slate-400'
                            }`}
                    >
                        {getTierLabel(data.tier)}
                    </Badge>
                </div>
            </div>
        );
    }
    return null;
};

export default function AdminCharts({ toolData, countryData, loading, timeRange, setTimeRange, toolFilter, setToolFilter }: AdminChartsProps) {
    return (
        <div className="grid lg:grid-cols-2 gap-6">
            {/* Traffic Analytics: Tool Usage */}
            <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Traffic Breakdown by Tool</h3>
                </div>
                <div className="h-[300px] w-full mt-auto">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded animate-pulse">
                            <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
                        </div>
                    ) : toolData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={toolData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {toolData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number | undefined) => [`${value ? value.toLocaleString() : 0} requests`, 'Usage']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 italic">No data available</div>
                    )}
                </div>
            </Card>

            {/* Revenue Analytics: User Demographics */}
            <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Top Geographies (AdSense Priority)</h3>
                            <p className="text-xs text-slate-500">Tier 1 traffic drives higher RPM</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="h-8 w-[120px] text-xs">
                                <SelectValue placeholder="Time Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24h">Last 24h</SelectItem>
                                <SelectItem value="7d">Last 7d</SelectItem>
                                <SelectItem value="30d">Last 30d</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={toolFilter} onValueChange={setToolFilter}>
                            <SelectTrigger className="h-8 w-[110px] text-xs">
                                <SelectValue placeholder="Tool Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tools</SelectItem>
                                <SelectItem value="ping">Ping</SelectItem>
                                <SelectItem value="dns">DNS</SelectItem>
                                <SelectItem value="http">HTTP</SelectItem>
                                <SelectItem value="smtp">SMTP</SelectItem>
                                <SelectItem value="ssl">SSL Check</SelectItem>
                                <SelectItem value="info">IP Info</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="h-[300px] w-full mt-auto text-sm">
                    {loading && countryData.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded animate-pulse">
                            <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
                        </div>
                    ) : countryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis
                                    dataKey="country"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={({ x, y, payload }) => (
                                        <g transform={`translate(${x},${y})`}>
                                            <text x={0} y={15} dy={0} textAnchor="middle" fill="#64748b" fontSize={16} aria-label={`${payload.value} flag`} role="img">
                                                {getFlagEmoji(payload.value)}
                                            </text>
                                        </g>
                                    )}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.1 }} />
                                <Bar dataKey="count" name="Requests" radius={[4, 4, 0, 0]}>
                                    {countryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getTierColor(entry.tier)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 italic">No data available</div>
                    )}
                </div>
            </Card>
        </div>
    );
}
