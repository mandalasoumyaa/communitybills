import React from 'react';
import {
  Building2,
  Home,
  Users,
  ShieldCheck,
  Plus,
  Trash2
} from 'lucide-react';
import * as api from '../services/communityApi';

export default function TowersPage({
  towersOverview,
  communityOverview,
  setShowAddTowerModal,
  loadData,
  addLog
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Action Row */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Manage Towers</h3>
          <p className="text-slate-400 text-xs mt-0.5">Edit, add, or delete community towers and review occupancy rates</p>
        </div>
        <button
          onClick={() => setShowAddTowerModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Tower
        </button>
      </div>

      {/* Towers cards summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Towers", value: towersOverview.length, icon: Home, bg: "bg-blue-50 text-blue-600" },
          { label: "Total Flats", value: communityOverview.total_flats, icon: Users, bg: "bg-emerald-50 text-emerald-650" },
          { label: "Avg Occupancy", value: `${communityOverview.occupancy_rate}%`, icon: ShieldCheck, bg: "bg-purple-50 text-purple-600" },
          { label: "Active Status", value: "All Active", icon: ShieldCheck, bg: "bg-indigo-50 text-indigo-605" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">{stat.label}</span>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Towers List */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Towers List</h3>
        <div className="grid grid-cols-1 gap-4">
          {towersOverview.map((tower) => (
            <div key={tower.id} className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-slate-450 shrink-0">
                  <Building2 className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-bold text-slate-800">{tower.name}</h4>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-full">
                      {tower.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs">
                    <p className="text-slate-500">Flats: <span className="font-semibold text-slate-800">{tower.total_flats}</span></p>
                    <p className="text-slate-500">Occupied: <span className="font-semibold text-slate-800">{tower.occupied_flats} ({Math.round(tower.occupied_flats / tower.total_flats * 100)}%)</span></p>
                    <p className="text-slate-500">Vacant: <span className="font-semibold text-slate-800">{tower.vacant_flats}</span></p>
                    <p className="text-slate-500">Residents: <span className="font-semibold text-slate-800">{tower.total_residents}</span></p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-between">
                <div className="flex gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Flats</span>
                    <span className="font-bold text-slate-800">{tower.total_flats}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Floor Count</span>
                    <span className="font-bold text-slate-800">{tower.floor_count}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Blocks</span>
                    <span className="font-bold text-slate-800">{tower.blocks_count}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Lifts</span>
                    <span className="font-bold text-slate-800">{tower.lifts_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete ${tower.name}? This will delete all flats associated with it.`)) {
                        try {
                          await api.deleteTower(tower.id);
                          await loadData();
                          addLog(`Tower ${tower.name} deleted`, 'vacant');
                        } catch (err) {
                          alert("Error deleting tower");
                        }
                      }
                    }}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
