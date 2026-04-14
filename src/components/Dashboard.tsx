import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { RoomCanvas } from './RoomCanvas';
import type { Equipment, PlacedEquipment, RoomDimensions, NecEdition } from '../lib/types';
import { runTurboSolver } from '../lib/solver';
import { getWorkspaceDepth } from '../lib/necLogic';

const DEFAULT_ROOM: RoomDimensions = {
  width: 240, 
  length: 300, 
  doors: [{ wall: 'S', offset: 20, width: 36 }]
};

const DEFAULT_EQUIPMENT: Equipment[] = [
  { id: '1', name: 'Main Switchgear', width: 72, depth: 36, voltage: 480 },
  { id: '2', name: 'Panel L1', width: 42, depth: 8, voltage: 208 },
  { id: '3', name: 'Panel H1', width: 42, depth: 8, voltage: 480 },
  { id: '4', name: 'XFMR-1', width: 36, depth: 24, voltage: 480 },
];

export const Dashboard: React.FC = () => {
  const [room, setRoom] = useState<RoomDimensions>(DEFAULT_ROOM);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(DEFAULT_EQUIPMENT);
  const [necEdition, setNecEdition] = useState<NecEdition>('2023');
  
  const [layout, setLayout] = useState<PlacedEquipment[]>([]);
  const [unplaced, setUnplaced] = useState<Equipment[]>([]);
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);
  
  const [solveStatus, setSolveStatus] = useState<'idle' | 'solving' | 'done'>('idle');
  const [solveLatency, setSolveLatency] = useState(0);
  const [fitnessScore, setFitnessScore] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSolve = () => {
    setSolveStatus('solving');
    setFitnessScore(null);
    setProgress(0);
    const startTime = performance.now();

    runTurboSolver(
      equipmentList,
      room,
      necEdition,
      (p) => setProgress(p),
      (result) => {
        const endTime = performance.now();
        setSolveLatency(Math.round(endTime - startTime));
        setSolveStatus('done');
        
        if (result) {
          setLayout(result.layout);
          setUnplaced(result.unplaced);
          setFitnessScore(result.score);
        } else {
          setLayout([]);
          setUnplaced(equipmentList);
          setFitnessScore(-999999);
        }
      }
    );
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-300 relative">
      <Sidebar 
        room={room}
        setRoom={setRoom}
        equipmentList={equipmentList}
        setEquipmentList={setEquipmentList}
        necEdition={necEdition}
        setNecEdition={setNecEdition}
        onSolve={handleSolve}
        solveStatus={solveStatus}
        solveLatency={solveLatency}
        fitnessScore={fitnessScore}
        progress={progress}
      />
      
      <div className="flex-1 relative flex">
        {/* Canvas Area */}
        <div className="flex-1 min-w-0 h-full p-6 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Main Blueprint Grid Component Layer */}
          <div  
            className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-screen" 
            style={{ 
              backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)', 
              backgroundSize: '60px 60px' 
            }} 
          />
          
          <div className="z-10 w-full h-full flex flex-col pointer-events-none">
            <div className="mb-4 flex flex-col drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <h2 className="text-3xl font-black flex items-center gap-2 bg-gradient-to-r from-sky-300 to-indigo-400 bg-clip-text text-transparent">
                NEC Layout Engine
              </h2>
              <p className="text-[10px] text-sky-400 mt-1 uppercase tracking-[0.3em] font-bold">Blueprint View • Absolute Scale Engine</p>
            </div>
            
            <div className="flex-1 relative pointer-events-auto w-full h-full rounded-2xl overflow-hidden p-6 flex items-center justify-center">
              {layout.length > 0 ? (
                <RoomCanvas layout={layout} room={room} edition={necEdition} selectedEqId={selectedEqId} />
              ) : (
                <div className="w-full h-full border border-slate-700/50 border-dashed rounded flex border-slate-700 items-center justify-center text-slate-600 font-mono text-sm bg-slate-900/30 backdrop-blur-sm">
                  {solveStatus === 'solving' ? 'Computing stochastic geometries...' : 'No layout generated. Awaiting solver.'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Live Diagnostics Panel */}
        <div className="w-[320px] shrink-0 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-20 flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${solveStatus === 'done' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse'}`}></span>
              Diagnostics Board
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
            
            {/* Unplaced Alert */}
            {solveStatus === 'done' && unplaced.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  Unplaced Gear
                  <span className="bg-red-500/20 text-red-400 py-0.5 px-2 rounded-full text-[10px]">{unplaced.length} ITEMS</span>
                </h3>
                {unplaced.map((eq, i) => (
                  <div key={i} className="bg-red-500/5 border border-red-500/20 rounded p-2 text-xs relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <span className="font-bold text-red-400 ml-1">{eq.name}</span>
                    <p className="text-red-300/60 mt-1 ml-1 text-[10px] leading-tight">Failed to place. Conflicts with physical footprint or clearance corridors.</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Placed Metrics */}
            {solveStatus === 'done' && layout.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  Constraint Logs
                  <span className="bg-blue-500/20 text-blue-400 py-0.5 px-2 rounded-full text-[10px]">{layout.length} PLACED</span>
                </h3>
                {layout.map((eq, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedEqId(selectedEqId === eq.id ? null : eq.id)}
                    className={`border rounded p-2 text-xs flex flex-col gap-1.5 transition-all cursor-pointer ${selectedEqId === eq.id ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'}`}
                  >
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-1.5">
                      <span className="font-bold text-slate-200 truncate pr-2">{eq.name}</span>
                      <span className="text-[9px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 uppercase tracking-wider">{eq.wall} Wall</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-slate-500 text-[10px]">Active Clearance:</span>
                      <span className="text-amber-400/90 font-mono text-[11px] bg-amber-500/10 px-1 rounded">
                        Condition {eq.condition} ({getWorkspaceDepth(eq.voltage, eq.condition, necEdition, eq)}")
                      </span>
                    </div>
                    
                    {eq.voltage > 600 && necEdition !== '2017' && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[10px]">Voltage Buffer:</span>
                        <span className="text-purple-400/90 text-[10px] bg-purple-500/10 px-1 rounded">601-1000V</span>
                      </div>
                    )}
                    
                    {eq.amps && eq.amps > (necEdition === '2017' ? 1200 : 800) && (
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-slate-500 text-[10px]">Egress Multiplier:</span>
                        <span className="text-orange-400/90 text-[10px] bg-orange-500/10 px-1 rounded">2x Depth</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {solveStatus === 'done' && unplaced.length === 0 && layout.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-center">
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">100% Geometry Passed</span>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
