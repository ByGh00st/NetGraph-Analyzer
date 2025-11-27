import React from 'react';
import { Packet, Protocol } from '../types';
import { PROTOCOL_COLORS } from '../constants';
import { resolveDNS } from '../services/mockNetworkService';

interface Props {
  packets: Packet[];
  filter: string;
  onlyAttacks?: boolean;
}

const PacketTable: React.FC<Props> = ({ packets, filter, onlyAttacks }) => {
  const filteredPackets = React.useMemo(() => {
    let data = packets;

    if (onlyAttacks) {
        data = data.filter(p => p.isAttack);
    }

    if (!filter) return data;
    
    const lowerFilter = filter.toLowerCase();
    return data.filter(p => 
      p.sourceIp.includes(lowerFilter) || 
      p.destIp.includes(lowerFilter) || 
      p.protocol.toLowerCase().includes(lowerFilter) ||
      p.info.toLowerCase().includes(lowerFilter) ||
      (p.processName && p.processName.toLowerCase().includes(lowerFilter))
    );
  }, [packets, filter, onlyAttacks]);

  return (
    <div className="flex flex-col h-full w-full bg-transparent text-xs font-sans">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/[0.02] border-b border-white/5 text-slate-500 font-bold uppercase tracking-widest text-[9px] select-none sticky top-0 z-10 backdrop-blur-md">
        <div className="col-span-2">Time / PID</div>
        <div className="col-span-1">Proto</div>
        <div className="col-span-3">Source</div>
        <div className="col-span-3">Destination</div>
        <div className="col-span-3">Payload Info</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-scrollbar">
        {filteredPackets.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-700 pb-10">
              <span className="text-[10px] uppercase tracking-widest border border-white/5 px-4 py-2 rounded-full">No Data Captured</span>
           </div>
        ) : (
          filteredPackets.map((pkt) => (
            <div 
              key={pkt.id} 
              className={`grid grid-cols-12 gap-4 px-6 py-2 border-b border-white/[0.02] hover:bg-white/[0.04] transition-colors group items-center ${
                  pkt.isAttack 
                  ? pkt.attackType === 'ARP Spoof' ? 'bg-red-500/10 border-l-2 border-l-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]' : 'bg-red-500/5 border-l-2 border-l-red-500' 
                  : 'border-l-2 border-l-transparent'
              }`}
            >
              <div className="col-span-2 text-slate-400 group-hover:text-slate-200 flex flex-col justify-center">
                  <span className="font-mono text-[10px]">{new Date(pkt.timestamp).toLocaleTimeString().split(' ')[0]}</span>
                  {pkt.processId && <span className="text-[9px] text-slate-600 mt-0.5">PID: <span className="text-slate-500">{pkt.processId}</span></span>}
              </div>
              
              <div className="col-span-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-white/5 bg-white/5" style={{ color: pkt.isAttack ? '#ef4444' : PROTOCOL_COLORS[pkt.protocol as keyof typeof PROTOCOL_COLORS] || '#888' }}>
                    {pkt.protocol}
                  </span>
              </div>
              
              <div className="col-span-3 text-slate-400 truncate group-hover:text-slate-200" title={pkt.sourceIp}>
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-slate-300">{pkt.sourceIp}</span>
                    <span className="text-[9px] text-slate-600 group-hover:text-blue-400/70 transition-colors">{pkt.processName || resolveDNS(pkt.sourceIp)}</span>
                  </div>
              </div>
              
              <div className="col-span-3 text-slate-400 truncate group-hover:text-slate-200" title={pkt.destIp}>
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-slate-300">{pkt.destIp}</span>
                    <span className="text-[9px] text-slate-600">{resolveDNS(pkt.destIp)}</span>
                  </div>
              </div>
              
              <div className={`col-span-3 truncate flex flex-col justify-center ${pkt.isAttack ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-400'}`} title={pkt.info}>
                  <span className="text-[11px]">{pkt.info}</span>
                  {pkt.isAttack && <span className="text-[8px] uppercase tracking-wider text-red-500 font-bold mt-0.5 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                      {pkt.attackType}
                  </span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(PacketTable);