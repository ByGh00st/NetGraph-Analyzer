import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPublicIP, fetchSecurityData, fetchDevices, toggleBlockDevice as apiBlockDevice } from './services/mockNetworkService';
import NetworkTopology from './components/NetworkTopology';
import TrafficCharts from './components/TrafficCharts';
import PacketTable from './components/PacketTable';
import { 
  ShieldAlertIcon, TrashIcon, SearchIcon,
  LayoutDashboardIcon, NetworkIcon, BarChartIcon, ListIcon
} from './components/Icons';
import { Packet, NetworkStats, SystemStats, Device } from './types';
import { MAX_LOG_ENTRIES } from './constants';

type ViewMode = 'overview' | 'topology' | 'analytics' | 'logs' | 'devices';

const App: React.FC = () => {
  const [isSniffing, setIsSniffing] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [filter, setFilter] = useState('');
  const [activeView, setActiveView] = useState<ViewMode>('overview');
  
  // System State
  const [publicIP, setPublicIP] = useState<string>('Scanning...');
  const [systemStats, setSystemStats] = useState<SystemStats>({ 
    cpuUsage: 0, ramUsage: 0, activeProcesses: 0, threatLevel: 'LOW' 
  });
  
  const [selectedNodeIp, setSelectedNodeIp] = useState<string | null>(null);

  const initialStats: NetworkStats = {
    totalPackets: 0,
    totalAttacks: 0,
    bandwidthIn: 0,
    activeIPs: 0,
    protocolDistribution: [],
    onlineDevices: 0
  };

  const [stats, setStats] = useState<NetworkStats>(initialStats);

  const sessionStatsRef = useRef({
    totalPackets: 0,
    totalAttacks: 0,
    bandwidthIn: 0,
    seenIps: new Set<string>(),
    protoCounts: {} as Record<string, number>,
  });

  // Init
  useEffect(() => {
    getPublicIP().then(ip => setPublicIP(ip));
    
    // Initial Device Fetch
    fetchDevices().then(devs => setDevices(devs));
    
    // Poll for devices
    const devInterval = setInterval(() => {
        fetchDevices().then(devs => setDevices(devs));
    }, 5000); 
    
    return () => clearInterval(devInterval);
  }, []);

  const processTraffic = useCallback(async () => {
    const { packets: newPackets, system } = await fetchSecurityData();
    setSystemStats(system);

    if (newPackets.length === 0) return;

    setPackets(prev => {
      const combined = [...prev, ...newPackets];
      return combined.slice(-MAX_LOG_ENTRIES);
    });

    const s = sessionStatsRef.current;
    let newBytes = 0;
    let newAttacks = 0;

    newPackets.forEach(p => {
      newBytes += p.size;
      if (p.isAttack) newAttacks++;
      s.seenIps.add(p.sourceIp);
      s.seenIps.add(p.destIp);
      s.protoCounts[p.protocol] = (s.protoCounts[p.protocol] || 0) + 1;
    });

    s.totalPackets += newPackets.length;
    s.totalAttacks += newAttacks;
    s.bandwidthIn += newBytes;

    setStats({
      totalPackets: s.totalPackets,
      totalAttacks: s.totalAttacks,
      bandwidthIn: s.bandwidthIn,
      activeIPs: s.seenIps.size,
      protocolDistribution: Object.entries(s.protoCounts).map(([name, value]) => ({ name, value })),
      onlineDevices: devices.length
    });

  }, [devices.length]);

  useEffect(() => {
    let trafficInterval: ReturnType<typeof setInterval>;
    if (isSniffing) {
      trafficInterval = setInterval(processTraffic, 1000);
    }
    return () => clearInterval(trafficInterval);
  }, [isSniffing, processTraffic]);

  // --- DELETE ALL FUNCTIONALITY ---
  const clearLogs = () => {
    // 1. Clear Packets
    setPackets([]);
    
    // 2. Reset Internal Counters
    sessionStatsRef.current = { 
        totalPackets: 0, 
        totalAttacks: 0, 
        bandwidthIn: 0, 
        seenIps: new Set(), 
        protoCounts: {} 
    };
    
    // 3. Reset UI Stats
    setStats({ ...initialStats, onlineDevices: devices.length }); // Keep online device count accurate
    
    // 4. Reset Selections
    setSelectedNodeIp(null);
  };

  const toggleBlockDevice = async (ip: string) => {
    const dev = devices.find(d => d.ip === ip);
    if (!dev) return;

    await apiBlockDevice(ip, dev.isBlocked);
    setDevices(prev => prev.map(d => d.ip === ip ? { ...d, isBlocked: !d.isBlocked } : d));
  };

  const hasThreats = stats.totalAttacks > 0;

  return (
    <div className="flex h-screen w-full bg-[#030304] text-slate-300 font-sans overflow-hidden selection:bg-blue-500/20">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen"></div>

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#0a0a0a]/80 border-r border-white/5 flex flex-col z-20 backdrop-blur-2xl shadow-2xl">
        <div className="h-20 flex items-center px-6 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] mr-3 ring-1 ring-white/10">
            NET
          </div>
          <div>
             <h1 className="font-bold text-sm text-white tracking-widest">NETGUARD<span className="text-blue-500">PRO</span></h1>
             <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 ONLINE
             </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-600 px-3 mb-3 uppercase tracking-widest">Dashboard</div>
            <NavButton view="overview" icon={LayoutDashboardIcon} label="Overview" active={activeView === 'overview'} onClick={() => setActiveView('overview')} />
            <NavButton view="devices" icon={NetworkIcon} label="Devices" active={activeView === 'devices'} onClick={() => setActiveView('devices')} />
            <NavButton view="topology" icon={NetworkIcon} label="Topology Map" active={activeView === 'topology'} onClick={() => setActiveView('topology')} />
            
            <div className="text-[10px] font-bold text-slate-600 px-3 mt-8 mb-3 uppercase tracking-widest">Analysis</div>
            <NavButton view="analytics" icon={BarChartIcon} label="Traffic Stats" active={activeView === 'analytics'} onClick={() => setActiveView('analytics')} />
            <NavButton view="logs" icon={ListIcon} label="Packet Logs" active={activeView === 'logs'} onClick={() => setActiveView('logs')} />
            
            <div className="mt-auto pt-10 px-3">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">System Health</div>
                    <div className="space-y-4">
                        <ResourceBar label="CPU Load" value={systemStats.cpuUsage} color="bg-blue-500" />
                        <ResourceBar label="Memory" value={systemStats.ramUsage} color="bg-violet-500" />
                    </div>
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20">
             <button
                onClick={() => setIsSniffing(!isSniffing)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 ${
                isSniffing 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-500/50'
                }`}
            >
                {isSniffing ? 'STOP MONITORING' : 'START MONITORING'}
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col z-10 relative overflow-hidden">
        <header className="h-20 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
            <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                    {activeView === 'devices' ? 'Device Management' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                    {hasThreats && (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-bold text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                            <ShieldAlertIcon className="w-3.5 h-3.5" /> THREAT DETECTED
                        </span>
                    )}
                </h2>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                   Gateway: <span className="text-slate-300">192.168.1.1</span> <span className="mx-2 opacity-20">|</span> Public IP: <span className="text-blue-400">{publicIP}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search IP, MAC, Protocol..." 
                        className="bg-black/20 border border-white/10 text-xs text-white rounded-lg pl-10 pr-4 py-2.5 w-72 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/[0.02] transition-all font-sans placeholder:text-slate-600"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="h-8 w-px bg-white/10 mx-2"></div>
                <button 
                    onClick={clearLogs} 
                    className="group relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-95"
                    title="Clear All Data"
                >
                    <TrashIcon className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                    <span className="absolute right-0 top-0 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-0 group-hover:opacity-75"></span>
                    </span>
                </button>
            </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden relative">
            {activeView === 'overview' && (
                <div className="grid grid-cols-12 grid-rows-12 gap-6 h-full max-w-[2000px] mx-auto">
                    {/* Top Stats Row */}
                    <div className="col-span-12 row-span-2 grid grid-cols-4 gap-6">
                         <StatCard label="Total Bandwidth" value={(stats.bandwidthIn / 1024 / 1024).toFixed(2)} unit="MB" sub="Inbound + Outbound" />
                         <StatCard label="Active Devices" value={stats.onlineDevices} unit="NODES" sub="Connected to LAN" color="text-emerald-400" />
                         <StatCard label="Threats Blocked" value={stats.totalAttacks} unit="EVENTS" sub="Firewall Actions" color="text-red-500" isAlert={stats.totalAttacks > 0} />
                         <StatCard label="Packet Volume" value={stats.totalPackets} unit="PKTS" sub="Total Captured" color="text-blue-400" />
                    </div>

                    {/* Main Topology Map */}
                    <div className="col-span-8 row-span-6 relative group">
                        <WidgetContainer title="Network Topology" badge="REALTIME" onViewAll={() => setActiveView('topology')}>
                           {packets.length > 0 ? (
                               <NetworkTopology 
                                 packets={packets} 
                                 selectedIp={selectedNodeIp}
                                 onNodeSelect={(ip) => { setActiveView('topology'); setSelectedNodeIp(ip); }} 
                               />
                           ) : <EmptyState />}
                        </WidgetContainer>
                    </div>

                    {/* Analytics Chart */}
                    <div className="col-span-4 row-span-6">
                        <WidgetContainer title="Protocol Distribution" onViewAll={() => setActiveView('analytics')}>
                            <TrafficCharts stats={stats} />
                        </WidgetContainer>
                    </div>

                    {/* Bottom Logs */}
                    <div className="col-span-12 row-span-4">
                        <WidgetContainer title="Live Traffic Feed" badge="SNIFFER" onViewAll={() => setActiveView('logs')}>
                            <PacketTable packets={packets} filter={filter} />
                        </WidgetContainer>
                    </div>
                </div>
            )}

            {activeView === 'devices' && (
                <div className="w-full h-full bg-[#0a0a0a]/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden flex flex-col p-6 shadow-2xl">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-white">Connected Devices</h3>
                            <p className="text-xs text-slate-500 mt-1">Manage access control for devices on 192.168.1.0/24</p>
                        </div>
                        <button className="text-[10px] font-bold tracking-widest bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all">REFRESH SCAN</button>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.01]">
                                    <th className="p-4 font-semibold">Hostname</th>
                                    <th className="p-4 font-semibold">IP Address</th>
                                    <th className="p-4 font-semibold">MAC Address</th>
                                    <th className="p-4 font-semibold">Vendor</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 text-right font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {devices.map(dev => (
                                    <tr key={dev.ip} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                                        <td className="p-4 text-white flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-black ${dev.isBlocked ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
                                            {dev.hostname}
                                        </td>
                                        <td className="p-4 text-slate-400 font-mono text-xs">{dev.ip}</td>
                                        <td className="p-4 text-slate-500 font-mono text-xs">{dev.mac}</td>
                                        <td className="p-4 text-blue-400/80 text-xs">{dev.vendor}</td>
                                        <td className="p-4">
                                            {dev.isBlocked 
                                                ? <span className="text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">BLOCKED</span> 
                                                : <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">ONLINE</span>
                                            }
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => toggleBlockDevice(dev.ip)}
                                                className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-wider transition-all ${
                                                    dev.isBlocked 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' 
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                                                }`}
                                            >
                                                {dev.isBlocked ? 'ALLOW ACCESS' : 'BLOCK NETWORK'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeView === 'topology' && (
                <div className="w-full h-full bg-[#0a0a0a]/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative flex">
                    <div className="flex-1 relative">
                        <NetworkTopology packets={packets} selectedIp={selectedNodeIp} onNodeSelect={setSelectedNodeIp} />
                    </div>
                    {/* Overlay Info */}
                    <div className="absolute top-4 left-4 p-4 bg-black/80 backdrop-blur border border-white/10 rounded-xl pointer-events-none">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Nodes</div>
                        <div className="text-2xl font-mono text-white">{packets.length > 0 ? stats.activeIPs : 0}</div>
                    </div>
                </div>
            )}
            
            {activeView === 'analytics' && (
                 <div className="h-full bg-[#0a0a0a]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-8 shadow-2xl">
                     <h3 className="text-lg font-bold text-white mb-6">Traffic Analysis</h3>
                     <TrafficCharts stats={stats} />
                 </div>
            )}

            {activeView === 'logs' && (
                 <div className="w-full h-full bg-[#0a0a0a]/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-2xl">
                    <div className="flex-1 min-h-0">
                        <PacketTable packets={packets} filter={filter} />
                    </div>
                 </div>
            )}
        </main>
      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const NavButton = ({ view, icon: Icon, label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`group flex items-center w-full px-4 py-2.5 mb-1 transition-all duration-200 rounded-lg ${
        active 
          ? 'bg-blue-600/10 text-blue-400 border-r-2 border-blue-500' 
          : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
      }`}
    >
      <Icon className={`w-4 h-4 mr-3 transition-colors ${active ? 'text-blue-400 shadow-blue-500/50' : 'text-slate-600 group-hover:text-slate-400'}`} />
      <span className="text-[11px] font-bold tracking-wide">{label}</span>
    </button>
);

const WidgetContainer = ({ title, children, badge, onViewAll }: any) => (
    <div className="flex flex-col h-full bg-[#0a0a0a]/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden group hover:border-white/10 transition-colors">
        <div className="h-10 px-5 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                {badge && <span className="text-[9px] px-2 py-0.5 rounded border bg-blue-500/5 text-blue-400 border-blue-500/20 font-mono shadow-[0_0_10px_rgba(59,130,246,0.1)]">{badge}</span>}
            </div>
            <button onClick={onViewAll} className="opacity-0 group-hover:opacity-100 transition-all text-[9px] text-blue-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1">
                Expand <span className="text-xs">↗</span>
            </button>
        </div>
        <div className="flex-1 min-h-0 relative p-0.5">{children}</div>
    </div>
);

const ResourceBar = ({ label, value, color }: any) => (
    <div>
        <div className="flex justify-between mb-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
            <span className="text-[9px] font-mono text-slate-300">{value}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
            <div 
                className={`h-full ${color} transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]`} 
                style={{ width: `${value}%` }}
            ></div>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center animate-pulse">
            <NetworkIcon className="w-6 h-6 opacity-30" />
        </div>
        <div className="text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Idle</div>
            <div className="text-[10px] text-slate-600 mt-1">Waiting for packet stream...</div>
        </div>
    </div>
);

const StatCard = ({ label, value, unit, sub, color = "text-white", isAlert }: any) => (
    <div className={`bg-[#0a0a0a]/40 backdrop-blur-md border rounded-2xl p-5 flex flex-col justify-between transition-all group hover:border-white/10 ${isAlert ? 'border-red-500/30 bg-red-900/5' : 'border-white/5'}`}>
        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2 flex justify-between">
            {label}
            {isAlert && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
        </div>
        <div>
            <div className={`text-3xl font-sans font-medium ${color} tracking-tight flex items-baseline gap-1`}>
                {value}
                <span className="text-xs font-bold text-slate-600 ml-1 opacity-50">{unit}</span>
            </div>
            <div className={`text-[10px] mt-2 font-medium ${isAlert ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-400'}`}>{sub}</div>
        </div>
    </div>
);

export default App;