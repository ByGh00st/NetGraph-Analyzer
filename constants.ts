export const MAX_LOG_ENTRIES = 500; // Limit for performance
export const REFRESH_RATE = 500; // ms between batch updates

export const PROTOCOL_COLORS = {
  TCP: '#3b82f6',   // blue-500
  UDP: '#22c55e',   // green-500
  HTTP: '#60a5fa',  // blue-400
  HTTPS: '#a855f7', // purple-500
  ARP: '#f97316',   // orange-500
  ICMP: '#eab308',  // yellow-500
};

export const ATTACK_COLOR = '#ef4444'; // red-500

// Common ports for simulation
export const COMMON_PORTS = [80, 443, 21, 22, 53, 3306, 8080, 3000];
export const LOCAL_IPS = ['192.168.1.10', '192.168.1.15', '192.168.1.22', '192.168.1.5'];
export const GATEWAY_IP = '192.168.1.1';
