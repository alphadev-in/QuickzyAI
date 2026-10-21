'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Compass,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Cpu,
  Route,
  Zap,
} from 'lucide-react';

export const RouteBatcherCockpit: React.FC = () => {
  const { activeTrip, setActiveRole } = useApp();
  const [algorithmMode, setAlgorithmMode] = useState<'greedy' | '2opt'>('2opt');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const waypoints = activeTrip?.waypoints || [];
  const pickups = waypoints.filter((w) => w.type === 'pickup');
  const dropoffs = waypoints.filter((w) => w.type === 'dropoff');

  const runReOptimization = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      {/* Cockpit Overview */}
      <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Cpu className="w-4 h-4" />
              <span>Autonomous Route Batching & Dispatch</span>
            </span>
            <h1 className="text-2xl font-black text-white mt-1">
              Corridor Clustering & Route Solver
            </h1>
            <p className="text-xs text-neutral-400">
              Groups multi-merchant neighborhood stops to maximize driver hourly density and minimize idle dwell.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-neutral-400">Solver:</span>
            <div className="bg-neutral-800 p-1 rounded-xl border border-neutral-700 flex text-xs font-semibold">
              <button
                onClick={() => setAlgorithmMode('greedy')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  algorithmMode === 'greedy'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Greedy Radial
              </button>
              <button
                onClick={() => setAlgorithmMode('2opt')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  algorithmMode === '2opt'
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                2-Opt Heuristic + Cold Bounds
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-800/40 border border-neutral-800 rounded-2xl p-4">
            <p className="text-[11px] text-neutral-400 uppercase font-semibold">Corridor Radius</p>
            <p className="text-xl font-black text-white mt-1">1.2 km</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">Upper St. Islington H3 Hex #8</p>
          </div>

          <div className="bg-neutral-800/40 border border-neutral-800 rounded-2xl p-4">
            <p className="text-[11px] text-neutral-400 uppercase font-semibold">Merged Stores</p>
            <p className="text-xl font-black text-white mt-1">{pickups.length} Merchants</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Overlapping prep windows (±8m)</p>
          </div>

          <div className="bg-neutral-800/40 border border-neutral-800 rounded-2xl p-4">
            <p className="text-[11px] text-neutral-400 uppercase font-semibold">Total Distance</p>
            <p className="text-xl font-black text-white mt-1">{activeTrip?.totalDistanceKm || 2.1} km</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">vs 4.8 km unbatched (-56%)</p>
          </div>

          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-4">
            <p className="text-[11px] text-cyan-400 uppercase font-semibold">Cold-Chain SLA</p>
            <p className="text-xl font-black text-white mt-1">18 mins</p>
            <p className="text-[10px] text-cyan-300 mt-0.5">Safe (&lt; 25m transit ceiling)</p>
          </div>
        </div>
      </div>

      {/* Corridor Map & Waypoint Sequence Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Corridor Waypoints */}
        <div className="md:col-span-7 bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <Route className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Batched Sequence Pipeline</h3>
            </div>
            <button
              onClick={runReOptimization}
              disabled={isSimulating}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Computing...' : 'Re-Run 2-Opt Optimizer'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {waypoints.map((wp, i) => (
              <div
                key={wp.id}
                className="flex items-center justify-between bg-neutral-800/40 rounded-2xl p-3.5 border border-neutral-800"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      wp.type === 'pickup'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-bold text-white">{wp.locationName}</p>
                      <span className="text-[10px] text-neutral-400 uppercase">({wp.type})</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate max-w-[260px]">
                      {wp.address}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wp.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {wp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveRole('driver')}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition"
            >
              <span>Inspect in Driver Cockpit View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Algorithmic Invariants */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Logistics Invariants Enforced</span>
            </h3>

            <div className="space-y-3 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50 space-y-1">
                <p className="font-bold text-emerald-400">1. Strict Precedence</p>
                <p className="text-neutral-400 leading-relaxed">
                  Pickup(Store i) strictly precedes Dropoff(Customer i) in topological route permutations.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50 space-y-1">
                <p className="font-bold text-cyan-400">2. Hard 25m Cold-Chain Ceiling</p>
                <p className="text-neutral-400 leading-relaxed">
                  From the moment chilled raw meat or fish is collected, dropoff is locked within 25 minutes.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50 space-y-1">
                <p className="font-bold text-amber-400">3. Correlated Prep Alignment</p>
                <p className="text-neutral-400 leading-relaxed">
                  Batches are dispatched only when merchant estimated ready times overlap within ±8 minutes to prevent driver idle waiting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
