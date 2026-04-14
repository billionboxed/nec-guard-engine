import React, { useState } from 'react';
import type { Equipment, RoomDimensions, NecEdition, AffinityColor } from '../lib/types';
import { Play, Plus, Trash2, Cpu, Pencil, Check, X } from 'lucide-react';

const AFFINITY_COLORS: AffinityColor[] = ['', 'bg-blue-500', 'bg-red-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];

interface Props {
  room: RoomDimensions;
  setRoom: (r: RoomDimensions) => void;
  equipmentList: Equipment[];
  setEquipmentList: (eq: Equipment[]) => void;
  necEdition: NecEdition;
  setNecEdition: (ed: NecEdition) => void;
  onSolve: () => void;
  solveStatus: 'idle' | 'solving' | 'done';
  solveLatency: number;
  fitnessScore: number | null;
  progress: number;
}

export const Sidebar: React.FC<Props> = ({
  room, setRoom, equipmentList, setEquipmentList, necEdition, setNecEdition, onSolve, solveStatus, solveLatency, fitnessScore, progress
}) => {
  const [newEqName, setNewEqName] = useState('Switchboard 1');
  const [newEqWidth, setNewEqWidth] = useState(48);
  const [newEqDepth, setNewEqDepth] = useState(24);
  const [newEqVoltage, setNewEqVoltage] = useState(480);
  const [newEqAmps, setNewEqAmps] = useState(1200);
  const [newEqHasDoors, setNewEqHasDoors] = useState(true);
  const [newEqAffinity, setNewEqAffinity] = useState<AffinityColor>('');

  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Equipment>>({});

  const handleEditClick = (eq: Equipment) => {
    setEditingEqId(eq.id);
    setEditForm(eq);
  };

  const handleEditSave = () => {
    setEquipmentList(equipmentList.map(e => e.id === editingEqId ? { ...e, ...editForm } as Equipment : e));
    setEditingEqId(null);
  };

  const handleEditCancel = () => {
    setEditingEqId(null);
  };

  const addEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    setEquipmentList([
      ...equipmentList,
      {
        id: Math.random().toString(36).substring(7),
        name: newEqName,
        width: newEqWidth,
        depth: newEqDepth,
        voltage: newEqVoltage,
        amps: newEqAmps,
        hasDoors: newEqHasDoors
      }
    ]);
  };

  return (
    <div className="w-[340px] shrink-0 h-full bg-slate-950/60 backdrop-blur-2xl border-r border-white/5 shadow-[10px_0_30px_rgba(0,0,0,0.5)] flex flex-col p-5 overflow-y-auto custom-scrollbar z-20 relative">
      <div className="flex items-center gap-2 mb-8">
        <Cpu className="text-sky-400" />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold italic tracking-tight uppercase bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">NEC-Guard<span className="text-sky-300">Turbo</span></h1>
          <p className="text-[9px] uppercase tracking-[0.2em] font-medium text-slate-400 -mt-1">Stochastic Engineering Solver</p>
        </div>
      </div>

      <div className="mb-6 bg-slate-900/50 backdrop-blur-lg p-5 rounded-xl border border-white/5 shadow-inner">
        <h2 className="text-xs font-bold mb-4 text-slate-300 uppercase tracking-wider flex items-center gap-2">
          Room Settings
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1">Room Width (in)</label>
            <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors shadow-inner" value={room.width} onChange={e => setRoom({...room, width: parseInt(e.target.value) || 0})} />
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1">Room Depth (in)</label>
            <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors shadow-inner" value={room.length} onChange={e => setRoom({...room, length: parseInt(e.target.value) || 0})} />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1">NEC Edition Rulebook</label>
          <select 
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors shadow-inner" 
            value={necEdition} 
            onChange={e => setNecEdition(e.target.value as NecEdition)}
          >
            <option value="2017">2017 (Standard Workspace)</option>
            <option value="2020">2020 (601-1000V Tiers + 800A Large Eq)</option>
            <option value="2023">2023 (+ Open Door Impedance Sweep)</option>
            <option value="2026">2026 (Draft Implementation)</option>
          </select>
        </div>
      </div>

      <div className="mb-6 bg-slate-900/50 backdrop-blur-lg p-5 rounded-xl border border-white/5 shadow-inner">
        <h2 className="text-xs font-bold mb-4 text-slate-300 uppercase tracking-wider flex justify-between items-center">
          Exit & Egress
          {room.doors.length < 3 && (
            <button onClick={() => setRoom({...room, doors: [...room.doors, { wall: 'N', offset: 20, width: 36 }]})} className="text-sky-400 hover:text-white flex items-center gap-1 text-[9px] bg-sky-500/10 hover:bg-sky-500/30 px-2 py-1 rounded-full transition-all border border-sky-400/20">
              <Plus size={10} strokeWidth={3} /> ADD PATH
            </button>
          )}
        </h2>
        <div className="flex flex-col gap-3">
          {room.doors.map((door, idx) => (
            <div key={idx} className="flex gap-2 items-end bg-black/20 p-2 rounded-lg border border-white/5">
              <div className="flex-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Wall</label>
                <select className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sky-500" value={door.wall} onChange={e => { const newDoors = [...room.doors]; newDoors[idx].wall = e.target.value as any; setRoom({...room, doors: newDoors}) }}>
                  <option value="N">North</option>
                  <option value="S">South</option>
                  <option value="E">East</option>
                  <option value="W">West</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Offset</label>
                <input type="number" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sky-500" value={door.offset} onChange={e => { const newDoors = [...room.doors]; newDoors[idx].offset = parseInt(e.target.value) || 0; setRoom({...room, doors: newDoors}) }} />
              </div>
              <div className="flex-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Width</label>
                <input type="number" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white focus:outline-none focus:border-sky-500" value={door.width} onChange={e => { const newDoors = [...room.doors]; newDoors[idx].width = parseInt(e.target.value) || 0; setRoom({...room, doors: newDoors}) }} />
              </div>
              {room.doors.length > 1 && (
                <button onClick={() => setRoom({...room, doors: room.doors.filter((_, i) => i !== idx)})} className="text-red-400 hover:text-red-300 p-1.5 mb-0.5 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 transition-all">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 flex-1 flex flex-col">
        <h2 className="text-xs font-bold mb-3 text-slate-300 uppercase tracking-wider">Equipment Inventory</h2>
        
        <div className="space-y-2 mb-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {equipmentList.map(eq => (
            <div key={eq.id} className="bg-slate-900/60 p-3 rounded-lg flex items-center justify-between border border-white/5 shadow-sm group hover:border-white/10 transition-colors">
              {editingEqId === eq.id ? (
                <div className="flex-1 flex flex-col gap-2 mr-2 text-xs">
                  <input className="w-full bg-black/40 border border-sky-500/50 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-sky-500" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" />
                  <div className="grid grid-cols-3 gap-1.5">
                    <input type="number" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white text-[10px]" value={editForm.width || 0} onChange={e => setEditForm({...editForm, width: parseInt(e.target.value) || 0})} placeholder="W" title="Width" />
                    <input type="number" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white text-[10px]" value={editForm.depth || 0} onChange={e => setEditForm({...editForm, depth: parseInt(e.target.value) || 0})} placeholder="D" title="Depth" />
                    <input type="number" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white text-[10px]" value={editForm.voltage || 0} onChange={e => setEditForm({...editForm, voltage: parseInt(e.target.value) || 0})} placeholder="V" title="Voltage" />
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <input type="number" className="w-1/2 bg-black/40 border border-white/10 rounded p-1.5 text-white text-[10px]" value={editForm.amps || 0} onChange={e => setEditForm({...editForm, amps: parseInt(e.target.value) || 0})} placeholder="Amps" title="Amps" />
                    <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5 w-1/2 overflow-hidden whitespace-nowrap"><input type="checkbox" checked={editForm.hasDoors ?? true} onChange={e => setEditForm({...editForm, hasDoors: e.target.checked})} className="rounded bg-black/40" /> Doors?</label>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0 mr-2 text-xs">
                  <div className="font-bold text-slate-100 pr-1 flex items-center gap-2">
                    <button 
                      onClick={() => setEquipmentList(equipmentList.map(e => e.id === eq.id ? { ...e, affinityColor: AFFINITY_COLORS[(Math.max(0, AFFINITY_COLORS.indexOf(e.affinityColor || '')) + 1) % AFFINITY_COLORS.length] } : e))}
                      className={`w-3 h-3 shrink-0 rounded-full border border-white/20 transition-all cursor-pointer ${eq.affinityColor || 'bg-slate-700/50 hover:bg-slate-600'} ${eq.affinityColor ? 'shadow-[0_0_8px_currentColor]' : ''}`}
                      title="Click to tag for Group Clustering"
                    />
                    <span className="truncate block" title={eq.name}>{eq.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate mt-1">{eq.width}"w × {eq.depth}"d | {eq.voltage}V | {eq.amps || 'Any'}A</div>
                </div>
              )}
              
              <div className="flex flex-col gap-2 shrink-0 opacity-100 group-hover:opacity-100 transition-opacity">
                {editingEqId === eq.id ? (
                  <>
                    <button onClick={handleEditSave} className="text-emerald-400 hover:text-emerald-300 transition-colors p-1.5 bg-emerald-500/10 rounded hover:bg-emerald-500/20 border border-emerald-500/20" title="Save Edit">
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <button onClick={handleEditCancel} className="text-slate-400 hover:text-slate-300 transition-colors p-1.5 bg-slate-800 rounded hover:bg-slate-700 border border-white/5" title="Cancel Edit">
                      <X size={14} strokeWidth={3} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditClick(eq)} className="text-sky-400 hover:text-sky-300 transition-colors p-1.5 bg-sky-500/10 rounded hover:bg-sky-500/20 border border-sky-500/20" title="Edit Equipment">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setEquipmentList(equipmentList.filter(e => e.id !== eq.id))} className="text-rose-400 hover:text-rose-300 transition-colors p-1.5 bg-rose-500/10 rounded hover:bg-rose-500/20 border border-rose-500/20" title="Delete Equipment">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {equipmentList.length === 0 && <div className="text-xs text-slate-500 flex justify-center py-4 bg-black/20 rounded-lg border border-dashed border-white/10 uppercase tracking-wider font-bold">No Inventory</div>}
        </div>

        <form onSubmit={addEquipment} className="bg-slate-900/50 backdrop-blur-lg p-3 rounded-xl border border-white/5 shadow-inner shrink-0">
          <input className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs mb-2 text-white focus:outline-none focus:border-sky-500" value={newEqName} onChange={e => setNewEqName(e.target.value)} placeholder="Equipment Name" required />
          <div className="flex gap-2 mb-2">
            <input type="number" className="w-1/3 bg-black/40 border border-white/10 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-sky-500" value={newEqWidth} onChange={e => setNewEqWidth(parseInt(e.target.value) || 0)} placeholder="W" title="Width" required />
            <input type="number" className="w-1/3 bg-black/40 border border-white/10 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-sky-500" value={newEqDepth} onChange={e => setNewEqDepth(parseInt(e.target.value) || 0)} placeholder="D" title="Depth" required />
            <input type="number" className="w-1/3 bg-black/40 border border-white/10 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-sky-500" value={newEqVoltage} onChange={e => setNewEqVoltage(parseInt(e.target.value) || 0)} placeholder="V" title="Voltage" required />
          </div>
          <div className="flex gap-2 mb-2">
            <input type="number" className="w-full bg-black/40 border border-white/10 rounded-md p-1.5 text-xs text-white focus:outline-none focus:border-sky-500" value={newEqAmps} onChange={e => setNewEqAmps(parseInt(e.target.value) || 0)} placeholder="Amps (for Large Eq rules)" required />
          </div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <input type="checkbox" checked={newEqHasDoors} onChange={e => setNewEqHasDoors(e.target.checked)} className="rounded bg-black/40 text-sky-500" id="hasDoorsCheck" />
            <label htmlFor="hasDoorsCheck" className="text-[10px] uppercase font-bold text-slate-400 flex-1 cursor-pointer">Has Doors?</label>
            
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <span className="text-[9px] uppercase font-bold text-slate-500 mr-1">Group</span>
              <button 
                type="button"
                onClick={() => setNewEqAffinity(AFFINITY_COLORS[(Math.max(0, AFFINITY_COLORS.indexOf(newEqAffinity)) + 1) % AFFINITY_COLORS.length])}
                className={`w-4 h-4 rounded-full border border-white/20 transition-all cursor-pointer ${newEqAffinity || 'bg-slate-800'}`}
                title="Tag to cluster with identical colors"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-white/10 text-white text-[11px] uppercase tracking-wider py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all shadow-lg active:scale-95">
            <Plus size={14} strokeWidth={3} /> Add Item
          </button>
        </form>
      </div>

      <div className="pt-4 border-t border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">FITNESS SCORE</span>
          <span className={`text-2xl font-black ${fitnessScore === null ? 'text-slate-600' : fitnessScore > 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]'}`}>
            {fitnessScore !== null ? fitnessScore.toLocaleString() : '---'}
          </span>
        </div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LATENCY TIMING</span>
          <span className="text-xs font-mono font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            {solveStatus === 'solving' ? `${(progress * 100).toFixed(0)}%` : `${solveLatency} ms`}
          </span>
        </div>
        
        <button 
          onClick={onSolve} 
          disabled={solveStatus === 'solving' || equipmentList.length === 0}
          className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all duration-300 shadow-xl ${
            solveStatus === 'solving' || equipmentList.length === 0 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
            : 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.6)] text-white border border-sky-400/50 active:scale-[0.98]'
          }`}
        >
          {solveStatus === 'solving' ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play size={18} fill="currentColor" />
          )}
          {solveStatus === 'solving' ? 'Calibrating Matrix...' : 'Run Turbo Solver'}
        </button>
      </div>
    </div>
  );
}
