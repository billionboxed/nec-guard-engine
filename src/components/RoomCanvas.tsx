import React, { useMemo, useRef, useEffect, useState } from 'react';
import type { PlacedEquipment, RoomDimensions, NecEdition } from '../lib/types';
import { EquipmentNode } from './EquipmentNode';
import { getEgressPaths } from '../lib/geometry';
import { getDoorRect } from '../lib/necLogic';

interface Props {
  layout: PlacedEquipment[];
  room: RoomDimensions;
  edition: NecEdition;
  selectedEqId?: string | null;
}

export const RoomCanvas: React.FC<Props> = ({ layout, room, edition, selectedEqId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Auto-scale to fit container
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      
      const padding = 40; // max padding
      const scaleX = (cw - padding) / room.width;
      const scaleY = (ch - padding) / room.length;
      setScale(Math.min(scaleX, scaleY, 4)); // cap max scale
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [room.width, room.length]);

  const egressPaths = useMemo(() => getEgressPaths(room), [room]);
  const doorObjs = useMemo(() => room.doors.map(door => getDoorRect(door, room)), [room.doors, room]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative z-10 overflow-hidden">
      <div 
        className="relative shadow-[0_0_60px_rgba(14,165,233,0.15)] rounded-sm bg-slate-950 border border-sky-900/40"
        style={{
          boxSizing: 'content-box',
          width: room.width * scale,
          height: room.length * scale,
          outline: '2px solid rgba(14, 165, 233, 0.4)', // Blueprint blue room boundary
          outlineOffset: '4px'
        }}
      >
        {/* Dynamic Egress Pathfinding Network */}
        {egressPaths.map((path, idx) => (
          <div
            key={`egress-${idx}`}
            className="absolute bg-emerald-500/10 z-0 border border-emerald-500/30 border-dashed backdrop-blur-[1px]"
            style={{
              boxSizing: 'border-box',
              left: path.x * scale,
              top: (room.length - path.y - path.h) * scale,
              width: path.w * scale,
              height: path.h * scale,
            }}
            title={idx === 0 ? "Egress Main Spine" : "Egress Door Branch"}
          >
            {idx === 0 && (
              <div className="w-full h-full flex items-center justify-center text-emerald-400 font-black opacity-30 -rotate-90 whitespace-nowrap tracking-[0.5em] text-[10px]">
                EGRESS SPINE
              </div>
            )}
          </div>
        ))}

        {/* Door Paths (Orange Clearance) */}
        {doorObjs.map((doorObj, index) => (
          <div
            key={`door-${index}`}
            className="absolute bg-orange-500/10 z-0 border border-orange-500/40 border-dashed flex items-center justify-center backdrop-blur-[1px]"
            style={{
              boxSizing: 'border-box',
              left: doorObj.x * scale,
              top: (room.length - doorObj.y - doorObj.h) * scale,
              width: doorObj.w * scale,
              height: doorObj.h * scale,
            }}
            title="Door Swing / Keep Clear"
          >
            <div className="text-orange-500 text-[10px] font-bold opacity-40 uppercase tracking-widest">Door</div>
          </div>
        ))}

        {/* Equipment */}
        {layout.map((eq, i) => (
          <EquipmentNode 
            key={`${eq.id}-${i}`} 
            equipment={eq} 
            room={room} 
            scale={scale} 
            edition={edition} 
            isSelected={selectedEqId === eq.id}
          />
        ))}
        
        {/* Zero Coordinate Marker - Bottom Left */}
        <div className="absolute left-0 bottom-0 translate-x-[-150%] translate-y-[150%] text-xs text-slate-400 font-mono">
          (0,0)
        </div>
      </div>
    </div>
  );
}
