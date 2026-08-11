import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  User, 
  Building, 
  Home, 
  Users, 
  ArrowUpDown,
  Filter,
  ArrowRight,
  Trash2
} from 'lucide-react';

const COMMUNITY_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
];

export default function CommunitiesListPage({
  communitiesList = [],
  setCurrentCommunityId,
  setActiveTab,
  setShowAddCommunityModal,
  handleDeleteCommunity
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Helper to count totals
  const getCommunityStats = (comm) => {
    const towersCount = comm.towers ? comm.towers.length : 0;
    let flatsCount = 0;
    let residentsCount = 0;

    if (comm.towers) {
      comm.towers.forEach(t => {
        if (t.flats) {
          flatsCount += t.flats.length;
          t.flats.forEach(f => {
            residentsCount += (f.occupants_count || 0);
          });
        }
      });
    }

    return { towersCount, flatsCount, residentsCount };
  };

  // Filter and sort communities
  const filteredCommunities = communitiesList
    .filter(comm => {
      const matchesSearch = comm.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            comm.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Since backend model doesn't store active status directly, let's treat Gated Communities as Active
      const commStatus = comm.type ? "Active" : "Inactive";
      const matchesStatus = statusFilter === 'All' || 
                            (statusFilter === 'Active' && commStatus === 'Active') ||
                            (statusFilter === 'Inactive' && commStatus === 'Inactive');

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

  const handleCardClick = (id) => {
    setCurrentCommunityId(id);
    setActiveTab('community');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[18px] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Communities</h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">Manage all apartment communities from one place.</p>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Community..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <Filter className="absolute right-2.5 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-55 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Name ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
          </button>

          {/* Add Community Button */}
          <button
            onClick={() => setShowAddCommunityModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-blue-100"
          >
            <Plus className="h-4 w-4" />
            Add Community
          </button>
        </div>
      </div>

      {/* 4-column Grid */}
      {filteredCommunities.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-[18px] shadow-sm">
          <Building className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm font-semibold">No communities found matching the criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCommunities.map((comm, index) => {
            const { towersCount, flatsCount, residentsCount } = getCommunityStats(comm);
            let imageSrc = localStorage.getItem(`community_image_${comm.id}`) || COMMUNITY_IMAGES[index % COMMUNITY_IMAGES.length];
            if (!localStorage.getItem(`community_image_${comm.id}`)) {
              if (comm.name && comm.name.toLowerCase().includes('greenfield')) {
                imageSrc = '/greenfield_residency.png';
              } else if (comm.name && comm.name.toLowerCase().includes('sunshine')) {
                imageSrc = '/sunshine_heights.png';
              }
            }
            // Split address to extract City, State, etc.
            const addressParts = comm.address ? comm.address.split(',') : [];
            const mainAddress = addressParts.slice(0, -2).join(',').trim() || comm.address;
            const cityStatePin = addressParts.slice(-2).join(',').trim() || '';

            return (
              <div
                key={comm.id}
                onClick={() => handleCardClick(comm.id)}
                className="group bg-white rounded-[18px] border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-500 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {/* Header Image & Badge */}
                <div className="relative h-44 overflow-hidden bg-slate-50">
                  <img
                    src={imageSrc}
                    alt={comm.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      Active
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (handleDeleteCommunity) {
                          handleDeleteCommunity(comm.id, comm.name);
                        }
                      }}
                      className="bg-white/80 hover:bg-white backdrop-blur-sm text-slate-500 hover:text-rose-600 p-1.5 rounded-lg transition-all shadow-sm hover:scale-105"
                      title="Delete Community"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  {/* Title & Address */}
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">
                      {comm.name}
                    </h3>
                    <p className="text-slate-400 text-[11px] font-medium mt-1.5 flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-350" />
                      <span className="line-clamp-2">
                        {mainAddress}
                        {cityStatePin && <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{cityStatePin}</span>}
                      </span>
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-50 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🏢 Towers</span>
                      <span className="font-black text-slate-700 text-xs mt-1">{towersCount}</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🏠 Flats</span>
                      <span className="font-black text-slate-700 text-xs mt-1">{flatsCount}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">👨 Residents</span>
                      <span className="font-black text-slate-700 text-xs mt-1">{residentsCount}</span>
                    </div>
                  </div>

                  {/* Manager details */}
                  <div className="space-y-1 text-[11px] text-slate-500 font-semibold bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{comm.manager_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{comm.manager_phone}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-4 py-3 bg-slate-50/40 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:bg-blue-50/10 transition-colors">
                  <span>View Community</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
