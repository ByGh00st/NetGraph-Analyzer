import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Packet, Node, Link } from '../types';
import { resolveDNS } from '../services/mockNetworkService';

interface Props {
  packets: Packet[];
  onNodeSelect?: (ip: string | null) => void;
  selectedIp?: string | null;
}

const NetworkTopology: React.FC<Props> = ({ packets, onNodeSelect, selectedIp }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const nodesMapRef = useRef<Map<string, Node>>(new Map());
  
  // Static Gateway Node
  const GATEWAY_IP = '192.168.1.1';

  // Initialize Simulation
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;
    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;

    const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, width, height]);
    svg.selectAll("*").remove();

    // Defs & Glows
    const defs = svg.append("defs");
    
    // Grid Pattern
    const pattern = defs.append("pattern").attr("id", "grid").attr("width", 40).attr("height", 40).attr("patternUnits", "userSpaceOnUse");
    pattern.append("circle").attr("cx", 1).attr("cy", 1).attr("r", 0.5).attr("fill", "#334155").attr("opacity", 0.3);

    // Blue Glow (Normal Selection)
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Red Glow (Attacker)
    const filterRed = defs.append("filter").attr("id", "glow-red");
    filterRed.append("feGaussianBlur").attr("stdDeviation", "6").attr("result", "coloredBlur");
    const feMergeRed = filterRed.append("feMerge");
    feMergeRed.append("feMergeNode").attr("in", "coloredBlur");
    feMergeRed.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");
    
    // Background Grid
    g.append("rect").attr("width", width * 10).attr("height", height * 10).attr("x", -width * 5).attr("y", -height * 5).attr("fill", "url(#grid)").on("click", () => { if (onNodeSelect) onNodeSelect(null); });

    g.append("g").attr("class", "links");
    g.append("g").attr("class", "nodes");

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 4]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Physics Engine
    simulationRef.current = d3.forceSimulation<Node, Link>()
      .force("link", d3.forceLink<Node, Link>().id(d => d.id).distance(d => (d.target as any).group === 3 ? 180 : 80).strength(0.3))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40).strength(0.7));

    // Initialize Gateway Node
    nodesMapRef.current.set(GATEWAY_IP, { id: GATEWAY_IP, group: 1, label: 'Gateway', x: width/2, y: height/2, fx: width/2, fy: height/2 });

    return () => {
      simulationRef.current?.stop();
    };
  }, []);

  // Update Data
  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;
    const simulation = simulationRef.current;
    const nodesMap = nodesMapRef.current;

    // Handle CLEAR LOGS (Empty state)
    if (packets.length === 0) {
        // Reset to just Gateway
        nodesMap.clear();
        const width = wrapperRef.current?.clientWidth || 800;
        const height = wrapperRef.current?.clientHeight || 600;
        nodesMap.set(GATEWAY_IP, { id: GATEWAY_IP, group: 1, label: 'Gateway', x: width/2, y: height/2, fx: width/2, fy: height/2 });
    }

    // 1. Identify Attackers and Active Links
    const activeWindow = packets.slice(-200);
    const activeIds = new Set<string>();
    const attackerIds = new Set<string>();
    
    activeIds.add(GATEWAY_IP);

    const linksMap = new Map<string, number>();

    activeWindow.forEach(pkt => {
        activeIds.add(pkt.sourceIp);
        activeIds.add(pkt.destIp);
        
        if (pkt.isAttack) {
            attackerIds.add(pkt.sourceIp);
        }

        const isSrcLocal = pkt.sourceIp.startsWith('192.168.');
        const isDstLocal = pkt.destIp.startsWith('192.168.');

        let linkKey = '';
        if (isSrcLocal && isDstLocal) {
            linkKey = [pkt.sourceIp, pkt.destIp].sort().join('-');
        } else if (isSrcLocal && !isDstLocal) {
            // Visualize Gateway Hop for external traffic
            const k1 = [pkt.sourceIp, GATEWAY_IP].sort().join('-');
            linksMap.set(k1, (linksMap.get(k1) || 0) + 1);
            linkKey = [GATEWAY_IP, pkt.destIp].sort().join('-');
        } else {
            linkKey = [pkt.sourceIp, pkt.destIp].sort().join('-');
        }
        
        if (linkKey) linksMap.set(linkKey, (linksMap.get(linkKey) || 0) + 1);
    });

    // 2. Sync Nodes & Update Groups
    activeIds.forEach(id => {
        const isAttacker = attackerIds.has(id);
        const isLocal = id.startsWith('192.168.');
        const group = isAttacker ? 4 : (id === GATEWAY_IP ? 1 : (isLocal ? 2 : 3));

        if (!nodesMap.has(id)) {
            nodesMap.set(id, { 
                id, 
                group,
                label: resolveDNS(id),
                x: simulation.nodes()[0]?.x + (Math.random() - 0.5) * 50 || 0,
                y: simulation.nodes()[0]?.y + (Math.random() - 0.5) * 50 || 0
            });
        } else {
            // Update existing node group if it becomes an attacker
            const node = nodesMap.get(id);
            if (node && node.group !== group) {
                node.group = group;
            }
        }
    });

    const currentNodes = Array.from(nodesMap.values()).filter(n => activeIds.has(n.id));
    
    // 3. Build Links
    const currentLinks: Link[] = [];
    linksMap.forEach((val, key) => {
        const [source, target] = key.split('-');
        if (nodesMap.has(source) && nodesMap.has(target)) {
            currentLinks.push({ source, target, value: val });
        }
    });

    // 4. Update Simulation
    simulation.nodes(currentNodes);
    (simulation.force("link") as d3.ForceLink<Node, Link>).links(currentLinks);
    if (simulation.alpha() < 0.1) simulation.alpha(0.3).restart();

    // 5. Render D3
    const svg = d3.select(svgRef.current);
    const linkGroup = svg.select(".links");
    const nodeGroup = svg.select(".nodes");

    const link = linkGroup.selectAll<SVGLineElement, Link>("line").data(currentLinks, (d: any) => `${d.source.id}-${d.target.id}`);
    const linkEnter = link.enter().append("line")
        .attr("stroke-width", 0.5);
    link.exit().remove();
    const allLinks = linkEnter.merge(link);

    const node = nodeGroup.selectAll<SVGGElement, Node>("g").data(currentNodes, d => d.id);
    const nodeEnter = node.enter().append("g")
        .attr("cursor", "pointer")
        .on("click", (event, d) => { event.stopPropagation(); if (onNodeSelect) onNodeSelect(d.id); })
        .call(d3.drag<SVGGElement, Node>()
            .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as any);

    // Outer Glow Ring
    nodeEnter.append("circle")
        .attr("class", "glow-ring")
        .attr("fill", "transparent")
        .attr("stroke-width", 1)
        .attr("opacity", 0.5);

    // Inner Core
    nodeEnter.append("circle")
        .attr("class", "main-circle")
        .attr("fill", "#020617")
        .attr("stroke-width", 2);
    
    // Icon/Text
    nodeEnter.append("text")
        .text(d => d.group === 1 ? 'GW' : (d.group === 4 ? '⚠' : ''))
        .attr("dy", 3)
        .attr("text-anchor", "middle")
        .attr("fill", d => d.group === 4 ? '#ef4444' : '#fff')
        .attr("font-size", "8px")
        .attr("font-weight", "bold")
        .style("pointer-events", "none");

    // Labels
    nodeEnter.append("text")
        .text(d => d.label || d.id)
        .attr("dy", d => d.group === 1 ? 35 : 22)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748b")
        .attr("font-size", "8px")
        .style("pointer-events", "none")
        .style("text-shadow", "0 2px 4px #000");

    node.exit().remove();
    const allNodes = nodeEnter.merge(node);

    // --- Styling Updates per Frame ---
    
    // Radius config
    const getRadius = (g: number) => g === 1 ? 25 : g === 4 ? 20 : g === 2 ? 14 : 8;
    const getCoreRadius = (g: number) => g === 1 ? 15 : g === 4 ? 10 : g === 2 ? 6 : 3;

    allNodes.select(".glow-ring")
        .attr("r", d => getRadius(d.group))
        .attr("stroke", d => {
            if (d.id === selectedIp) return "#60a5fa";
            if (d.group === 4) return "#ef4444"; // Attacker Red
            if (d.group === 1) return "#f59e0b"; // Gateway Gold
            if (d.group === 2) return "#10b981"; // Local Green
            return "transparent";
        })
        .style("filter", d => {
             if (d.group === 4) return "url(#glow-red)";
             return "none";
        });

    allNodes.select(".main-circle")
        .attr("r", d => getCoreRadius(d.group))
        .attr("stroke", d => {
            if (d.id === selectedIp) return "#60a5fa";
            if (d.group === 4) return "#ef4444";
            if (d.group === 1) return "#f59e0b";
            if (d.group === 2) return "#10b981";
            return "#64748b";
        })
        .style("filter", d => {
            if (d.id === selectedIp) return "url(#glow)";
            if (d.group === 4) return "url(#glow-red)";
            return "none";
        });

    allLinks
        .attr("stroke", (d: any) => {
            // If either end is attacker, line is red
            if (d.source.group === 4 || d.target.group === 4) return "#ef4444";
            if (selectedIp && ((d.source.id || d.source) === selectedIp || (d.target.id || d.target) === selectedIp)) return "#60a5fa";
            return "#334155";
        })
        .attr("stroke-opacity", (d: any) => {
             if (d.source.group === 4 || d.target.group === 4) return 0.6; // Higher opacity for attack lines
             if (selectedIp) return ((d.source.id || d.source) === selectedIp || (d.target.id || d.target) === selectedIp) ? 0.8 : 0.05;
             return 0.2;
        });

    simulation.on("tick", () => {
      allLinks.attr("x1", d => (d.source as any).x).attr("y1", d => (d.source as any).y).attr("x2", d => (d.target as any).x).attr("y2", d => (d.target as any).y);
      allNodes.attr("transform", d => `translate(${d.x},${d.y})`);
    });

  }, [packets, selectedIp, onNodeSelect]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-transparent overflow-hidden relative select-none">
        <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};

export default React.memo(NetworkTopology);