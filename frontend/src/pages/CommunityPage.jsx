import React from 'react';
import {
  Building2,
  Home,
  Users,
  UserCheck,
  ShieldCheck,
  MapPin,
  Calendar,
  User,
  Plus,
  MessageSquare,
  FileText,
  Trash2
} from 'lucide-react';

export default function CommunityPage({
  communityOverview,
  handleEditCommunity,
  setShowAddTowerModal,
  setShowAddFlatModal,
  setActiveTab,
  setShowAddCommunityModal,
  communitiesList = [],
  setCurrentCommunityId,
  handleDeleteCommunity
}) {
  if (!communityOverview) return null;

  // Ring chart helper
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const occupiedOffset = circumference - (communityOverview.occupancy_rate / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{communityOverview.name}</h2>
          <p className="text-slate-400 text-xs font-medium">Active Community Portal</p>
        </div>
      </div>


      {/* Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Towers", value: communityOverview.total_towers, icon: Home, bg: "bg-blue-50 text-blue-600" },
          { label: "Flats", value: communityOverview.total_flats, icon: Users, bg: "bg-emerald-50 text-emerald-600" },
          { label: "Residents", value: communityOverview.total_residents, icon: UserCheck, bg: "bg-purple-50 text-purple-600" },
          { label: "Status", value: "Active", icon: ShieldCheck, bg: "bg-indigo-50 text-indigo-600" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-450 font-semibold tracking-wider uppercase">{stat.label}</span>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Details & Overview charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Details Card */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Community Details</h3>
              <p className="text-slate-400 text-xs font-medium">Verify official registration details</p>
            </div>
            <button
              onClick={handleEditCommunity}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
            >
              Edit Details
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-4">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl h-11 w-11 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold">Address</span>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{communityOverview.address}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl h-11 w-11 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold">Total Area</span>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{communityOverview.total_area}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl h-11 w-11 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold">Established On</span>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{communityOverview.established_on}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl h-11 w-11 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold">Community Manager</span>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{communityOverview.manager_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{communityOverview.manager_phone}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden h-48 bg-slate-50 relative border border-slate-100 shadow-inner">
            <img 
              src={
                localStorage.getItem(`community_image_${communityOverview.id}`) ||
                (communityOverview.name && communityOverview.name.toLowerCase().includes('sunshine') 
                  ? '/sunshine_heights.png' 
                  : (communityOverview.name && communityOverview.name.toLowerCase().includes('greenfield') 
                      ? '/greenfield_residency.png' 
                      : '/community_building.png'))
              } 
              className="w-full h-full object-cover object-center" 
              alt="Community Buildings" 
            />
          </div>
        </div>

        {/* Occupancy & Quick Stats */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Community Overview</h3>
            <p className="text-slate-400 text-xs font-medium">Real-time statistics overview</p>
          </div>

          <div className="flex items-center justify-around py-2">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r={radius} className="stroke-slate-100 fill-none" strokeWidth="12" />
                <circle cx="72" cy="72" r={radius} className="stroke-indigo-600 fill-none" strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={occupiedOffset}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute text-center">
                <h4 className="text-2xl font-bold text-slate-800">{communityOverview.occupancy_rate}%</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Occupancy</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 bg-indigo-600 rounded-full"></span>
                <div>
                  <span className="text-xs text-slate-400 font-semibold">Occupied</span>
                  <p className="text-sm font-bold text-slate-800">{communityOverview.occupied_flats} Flats</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 bg-slate-200 rounded-full"></span>
                <div>
                  <span className="text-xs text-slate-400 font-semibold">Vacant</span>
                  <p className="text-sm font-bold text-slate-800">{communityOverview.vacant_flats} Flats</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-xs text-slate-400 font-semibold">Residents (Families)</span>
              <p className="text-base font-bold text-slate-800 mt-0.5">{communityOverview.total_residents}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold">Active Staff</span>
              <p className="text-base font-bold text-slate-800 mt-0.5">8 Members</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
