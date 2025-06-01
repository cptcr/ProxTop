// src/renderer/components/DemoComponents.tsx
import React from 'react';
import { 
  Activity, 
  Server, 
  Monitor, 
  Database, 
  Cpu,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// Demo data for when not connected
const generateDemoData = () => {
  const data = [];
  const now = Date.now();
  for (let i = 30; i >= 0; i--) {
    data.push({
      timestamp: now - (i * 2000),
      cpu: Math.random() * 40 + 20,
      memory: Math.random() * 30 + 40,
      network_in: Math.random() * 50,
      network_out: Math.random() * 30
    });
  }
  return data;
};

export const DemoModeIndicator: React.FC = () => (
  <div className="fixed z-50 transform -translate-x-1/2 top-4 left-1/2">
    <div className="flex items-center px-4 py-2 space-x-2 bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg dark:bg-yellow-900/20 dark:border-yellow-800">
      <Activity className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
        Demo Mode - Connect to Proxmox for real data
      </span>
    </div>
  </div>
);

export const DemoDashboard: React.FC = () => {
  const demoData = generateDemoData();
  
  const MetricCard: React.FC<{
    title: string;
    value: string;
    icon: React.ComponentType<any>;
    color: string;
  }> = ({ title, value, icon: Icon, color }) => (
    <div className="p-6 transition-all duration-300 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-900 dark:border-gray-800 hover:shadow-md">
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  const GaugeChart: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={color}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {value.toFixed(0)}%
            </span>
          </div>
        </div>
        <span className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <DemoModeIndicator />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
            Dashboard Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Preview of ProxTop features - Connect to see real data
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-4 py-2 space-x-2 text-gray-700 bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-300">
            <Zap className="w-4 h-4" />
            <span>Demo Mode</span>
          </div>
        </div>
      </div>

      {/* Demo Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Demo Cluster"
          value="3/3"
          icon={Server}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        
        <MetricCard
          title="Virtual Machines"
          value="12/15"
          icon={Monitor}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        
        <MetricCard
          title="Containers"
          value="8/10"
          icon={Database}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        
        <MetricCard
          title="CPU Usage"
          value="34.2%"
          icon={Cpu}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Demo Gauges */}
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resource Utilization (Demo)</h3>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <GaugeChart value={34} label="CPU" color="#3b82f6" />
          <GaugeChart value={67} label="Memory" color="#8b5cf6" />
          <GaugeChart value={45} label="Storage" color="#10b981" />
          <GaugeChart value={23} label="Network" color="#f59e0b" />
        </div>
      </div>

      {/* Demo Chart */}
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Demo (Simulated Data)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sample real-time charts - Connect to Proxmox for live data
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={demoData}>
            <defs>
              <linearGradient id="cpuGradientDemo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="memGradientDemo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                second: '2-digit' 
              })}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelFormatter={(value) => new Date(value).toLocaleTimeString()}
              formatter={(value: any, name: string) => [
                `${value.toFixed(1)}%`, 
                name === 'cpu' ? 'CPU' : name === 'memory' ? 'Memory' : 'Network'
              ]}
            />
            <Area
              type="monotone"
              dataKey="cpu"
              stroke="#3b82f6"
              fill="url(#cpuGradientDemo)"
              strokeWidth={2}
              name="cpu"
            />
            <Area
              type="monotone"
              dataKey="memory"
              stroke="#8b5cf6"
              fill="url(#memGradientDemo)"
              strokeWidth={2}
              name="memory"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Demo Nodes Table */}
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          Demo Cluster Nodes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Node</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">CPU</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">Memory</th>
                <th className="px-4 py-3 text-sm font-medium text-left text-gray-600 dark:text-gray-400">VMs/CTs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {['pve-node1', 'pve-node2', 'pve-node3'].map((nodeName, index) => (
                <tr key={nodeName} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <Server className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{nodeName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        online
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div 
                          className="h-2 bg-blue-600 rounded-full"
                          style={{ width: `${20 + index * 15}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {20 + index * 15}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div 
                          className="h-2 bg-purple-600 rounded-full"
                          style={{ width: `${40 + index * 10}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {40 + index * 10}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-3 h-3" />
                        <span>{3 + index}/5</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Database className="w-3 h-3" />
                        <span>{2 + index}/4</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};