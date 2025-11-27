import { Packet, Protocol, AttackType, SystemStats, Device } from '../types';

// API CONFIGURATION
const API_BASE = 'http://localhost:5000/api';

// --- FALLBACK MOCK DATA GENERATORS (Used if Backend is offline) ---
const GATEWAY_IP = '192.168.1.1';
const MOCK_DEVICES: Device[] = [
  { ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:01', vendor: 'Apple Inc.', hostname: 'Admin-MacBook', type: 'desktop', isBlocked: false, lastSeen: Date.now(), bandwidthUsage: 0 },
  { ip: '192.168.1.15', mac: 'AA:BB:CC:DD:EE:02', vendor: 'Samsung', hostname: 'Galaxy-S23', type: 'mobile', isBlocked: false, lastSeen: Date.now(), bandwidthUsage: 0 },
];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- REAL API CLIENT ---

export const fetchDevices = async (): Promise<Device[]> => {
  try {
    const response = await fetch(`${API_BASE}/devices`);
    if (!response.ok) throw new Error("API Error");
    const data = await response.json();
    
    // Map backend data to frontend Device type
    return data.map((d: any) => ({
      ip: d.ip,
      mac: d.mac,
      vendor: d.vendor || 'Unknown',
      hostname: d.hostname || d.ip,
      type: 'desktop', // Defaulting for now
      isBlocked: d.isBlocked,
      lastSeen: Date.now(),
      bandwidthUsage: 0
    }));

  } catch (e) {
    console.warn("Backend offline, using mock devices.");
    return MOCK_DEVICES;
  }
};

export const fetchSecurityData = async (): Promise<{ packets: Packet[], system: SystemStats }> => {
  try {
    const response = await fetch(`${API_BASE}/traffic`);
    if (!response.ok) throw new Error("API Error");
    const data = await response.json();

    return {
      packets: data.packets,
      system: data.system
    };

  } catch (e) {
    // FALLBACK: Generate Fake Data if Python server is not running
    // This ensures the UI still looks good during development/preview
    return generateMockTraffic(); 
  }
};

export const toggleBlockDevice = async (ip: string, isBlocked: boolean): Promise<boolean> => {
    try {
        await fetch(`${API_BASE}/block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, action: isBlocked ? 'unblock' : 'block' })
        });
        return true;
    } catch (e) {
        console.error("Failed to toggle block status via API");
        return false;
    }
}

export const getPublicIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    return 'Unavailable';
  }
};

export const resolveDNS = (ip: string): string => {
  if (ip === GATEWAY_IP) return 'Gateway';
  if (ip.startsWith('192.168')) return 'Local Device';
  return ip;
};

// --- HELPER: MOCK GENERATOR ---
const generateMockTraffic = () => {
   const packets: Packet[] = [];
   // Simulating System Stats
   const system = {
      cpuUsage: Math.floor(Math.random() * 30) + 10,
      ramUsage: Math.floor(Math.random() * 20) + 40,
      activeProcesses: 150,
      threatLevel: 'LOW' as const
   };
   
   // Generate 1 random packet
   packets.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      sourceIp: '192.168.1.10',
      destIp: '8.8.8.8',
      protocol: Protocol.HTTPS,
      size: randomInt(100, 1000),
      info: 'Demo Mode (Backend Offline)',
      isAttack: false,
      attackType: null,
      latency: 20
   });
   
   return { packets, system };
}
