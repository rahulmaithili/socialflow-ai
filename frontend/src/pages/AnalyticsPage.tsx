import React from 'react';
import { BarChart3, TrendingUp, Users, Eye, ThumbsUp, MessageCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const mockData = [
    { name: 'Mon', engagement: 4000, reach: 2400 },
    { name: 'Tue', engagement: 3000, reach: 1398 },
    { name: 'Wed', engagement: 2000, reach: 9800 },
    { name: 'Thu', engagement: 2780, reach: 3908 },
    { name: 'Fri', engagement: 1890, reach: 4800 },
    { name: 'Sat', engagement: 2390, reach: 3800 },
    { name: 'Sun', engagement: 3490, reach: 4300 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Track your content performance across destinations</p>
        </div>
        <select className="bg-background border rounded-lg px-4 py-2 font-medium focus:ring-2 outline-none">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Month</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reach', value: '45.2K', change: '+12%', icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Total Engagement', value: '12.8K', change: '+24%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Avg. Reactions', value: '842', change: '-2%', icon: ThumbsUp, color: 'text-brand-500', bg: 'bg-brand-500/10' },
          { label: 'Total Comments', value: '143', change: '+8%', icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'text-green-600 bg-green-500/10' : 'text-red-600 bg-red-500/10'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-xl p-6 h-[400px]">
        <h3 className="font-semibold mb-6">Engagement vs Reach (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#0f1117', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
