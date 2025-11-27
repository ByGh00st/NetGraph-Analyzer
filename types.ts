export enum Protocol {
  TCP = 'TCP',
  UDP = 'UDP',
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
  ARP = 'ARP',
  ICMP = 'ICMP',
  SSH = 'SSH',
  DNS = 'DNS',
  QUIC = 'QUIC'
}

export type AttackType = 'DoS/DDoS' | 'Port Scan' | 'ARP Spoof' | 'Malware C2' | 'Ransomware Beacon' | 'SQL Injection' | 'MITM' | null;

export interface Device {
  ip: string;
  mac: string;
  vendor: string; // Apple, Samsung, Intel...
  hostname: string;
  type: 'mobile' | 'desktop' | 'server' | 'iot';
  isBlocked: boolean;
  lastSeen: number;
  bandwidthUsage: number; // in bytes
}

export interface Packet {
  id: string;
  timestamp: number;
  sourceIp: string;
  destIp: string;
  protocol: Protocol;
  size: number;
  sourcePort?: number;
  destPort?: number;
  info: string;
  isAttack: boolean;
  attackType: AttackType;
  latency?: number;
  processName?: string;
  processId?: number;
  deviceMac?: string; // Associated MAC address
}

export interface Node {
  id: string;
  group: number; // 1: Gateway, 2: Local Device, 3: External Server, 4: Attacker
  label?: string;
  isBlocked?: boolean;
  // D3 Simulation properties
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  index?: number;
}

export interface SystemStats {
  cpuUsage: number;
  ramUsage: number;
  activeProcesses: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface NetworkStats {
  totalPackets: number;
  totalAttacks: number;
  bandwidthIn: number;
  activeIPs: number;
  protocolDistribution: { name: string; value: number }[];
  system?: SystemStats;
  onlineDevices: number;
}