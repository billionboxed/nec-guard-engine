import React from 'react';
import type { PlacedEquipment, RoomDimensions, NecEdition } from '../lib/types';
import { getWorkspaceRect, getOrientedEquipmentRect, getDoorsForEquipment } from '../lib/necLogic';

interface Props {
  equipment: PlacedEquipment;
  room: RoomDimensions;
  scale: number;
  edition: NecEdition;
  isSelected?: boolean;
}

export const EquipmentNode: React.FC<Props> = ({ equipment, room, scale, edition, isSelected }) => {
  const bodyRect = getOrientedEquipmentRect(equipment);
  const wsRect = getWorkspaceRect(equipment, room, edition);
  const doors = getDoorsForEquipment(equipment, edition);

  const cx = (bodyRect.x + bodyRect.w / 2) * scale;
  const cy = (room.length - bodyRect.y - bodyRect.h / 2) * scale;

  let tagDx = 0;
  let tagDy = 0;
  let transformAnchor = 'translate(-50%, -50%)';
  
  // Always project the tag OUTWARD, completely outside the architectural room boundary!
  if (equipment.wall === 'N') { tagDy = -(bodyRect.h / 2 * scale + 24); transformAnchor = 'translate(-50%, -100%)'; }
  if (equipment.wall === 'S') { tagDy =  (bodyRect.h / 2 * scale + 24); transformAnchor = 'translate(-50%, 0%)'; }
  if (equipment.wall === 'W') { tagDx = -(bodyRect.w / 2 * scale + 36); transformAnchor = 'translate(-100%, -50%)'; }
  if (equipment.wall === 'E') { tagDx =  (bodyRect.w / 2 * scale + 36); transformAnchor = 'translate(0%, -50%)'; }

  return (
    <>
      {/* Workspace */}
      <div
        className="absolute bg-sky-400/10 border border-sky-400/30 z-0 flex items-center justify-center p-1 pointer-events-none"
        style={{
          boxSizing: 'border-box',
          left: wsRect.x * scale,
          top: (room.length - wsRect.y - wsRect.h) * scale,
          width: wsRect.w * scale,
          height: wsRect.h * scale,
          // Sophisticated architectural hatched pattern
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(56, 189, 248, 0.08) 10px, rgba(56, 189, 248, 0.08) 20px)'
        }}
        title={`Workspace Condition ${equipment.condition}`}
      />

      {/* Equipment Body */}
      <div
        className={`absolute border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-slate-200 flex items-center justify-center text-xs font-bold overflow-hidden rounded-[4px] transition-all duration-300 backdrop-blur-md ${
          isSelected 
            ? 'bg-gradient-to-br from-blue-500/80 to-indigo-600/90 border-blue-300/50 shadow-[0_0_40px_rgba(59,130,246,0.6)] z-50 scale-[1.05]' 
            : 'bg-gradient-to-br from-slate-700/80 via-slate-800/90 to-slate-900/90 z-10 hover:border-slate-400/30'
        }`}
        style={{
          boxSizing: 'border-box',
          left: bodyRect.x * scale,
          top: (room.length - bodyRect.y - bodyRect.h) * scale,
          width: bodyRect.w * scale,
          height: bodyRect.h * scale,
          boxShadow: isSelected ? 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 10px rgba(0,0,0,0.5)' : 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 10px rgba(0,0,0,0.6)'
        }}
        title={equipment.name}
      >
        {isSelected && (
          <div className="absolute inset-0 bg-blue-400/20 animate-pulse pointer-events-none"></div>
        )}
        
        {/* Inner Content Wrapper */}
        <div className="flex items-center justify-center w-full h-full relative z-10 p-1">
          <div className="flex items-center justify-center gap-1.5 opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] shrink-0 ${isSelected ? 'bg-white text-white' : 'bg-sky-400 text-sky-400'}`}></span>
            <span className={`text-[12px] uppercase font-black tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-200'}`}>C{equipment.condition}</span>
          </div>
        </div>
      </div>

      {/* External Architectural Callout Tag Always Rendered */}
      <div className="absolute z-40 pointer-events-none" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          <line 
            x1={cx} y1={cy} 
            x2={cx + tagDx} y2={cy + tagDy} 
            stroke={isSelected ? "#60a5fa" : "#64748b"} 
            strokeWidth="1.5"
          />
          <circle cx={cx} cy={cy} r="2.5" fill={isSelected ? "#60a5fa" : "#94a3b8"} className="drop-shadow-sm" />
        </svg>
        <div 
          className={`absolute z-50 text-[10px] whitespace-nowrap px-2.5 py-1.5 rounded-[4px] border border-white/10 shadow-xl backdrop-blur-md transition-all flex items-center gap-2 ${
            isSelected ? 'bg-blue-900/90 text-blue-50 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-900/90 text-slate-200'
          }`}
          style={{
            left: cx + tagDx,
            top: cy + tagDy,
            transform: transformAnchor,
          }}
        >
          {equipment.affinityColor && (
            <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor] ${equipment.affinityColor}`} />
          )}
          {equipment.name}
        </div>
      </div>

      {/* Door Swing Overlay */}
      {doors.map((door, i) => (
        <div
          key={i}
          className="absolute bg-blue-500/10 border-blue-400/40 border-dashed z-20 pointer-events-none transition-all duration-300"
          style={{
            boxSizing: 'border-box',
            left: door.rect.x * scale,
            top: (room.length - door.rect.y - door.rect.h) * scale,
            width: door.rect.w * scale,
            height: door.rect.h * scale,
            borderTopLeftRadius: door.sweepCorner === 'TL' ? '100%' : '0',
            borderTopRightRadius: door.sweepCorner === 'TR' ? '100%' : '0',
            borderBottomRightRadius: door.sweepCorner === 'BR' ? '100%' : '0',
            borderBottomLeftRadius: door.sweepCorner === 'BL' ? '100%' : '0',
            borderTopWidth: door.sweepCorner === 'TL' || door.sweepCorner === 'TR' ? '1px' : '0',
            borderBottomWidth: door.sweepCorner === 'BL' || door.sweepCorner === 'BR' ? '1px' : '0',
            borderLeftWidth: door.sweepCorner === 'TL' || door.sweepCorner === 'BL' ? '1px' : '0',
            borderRightWidth: door.sweepCorner === 'TR' || door.sweepCorner === 'BR' ? '1px' : '0',
          }}
          title={`Open Door Path (${Math.round(door.rect.w)}")`}
        />
      ))}
    </>
  );
}
