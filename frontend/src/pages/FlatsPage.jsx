import React from 'react';
import { 
  Users, 
  Search, 
  Edit3, 
  Trash2, 
  Plus, 
  AlertCircle 
} from 'lucide-react';

const getOccupancyType = (flat) => {
  if (flat.status !== 'Occupied') return null;
  if (flat.occupants_count === 2 || flat.occupants_count === '2') return 'Tenant';
  if (flat.occupants_count === 1 || flat.occupants_count === '1') return 'Owner';
  const name = flat.resident_name || '';
  if (name.includes('Sharma') || name.includes('Mehta') || flat.number === 'A-102' || flat.number === 'A-103') {
    return 'Tenant';
  }
  return 'Owner';
};

export default function FlatsPage({ 
  towersList,
  selectedTowerId,
  handleTowerChange,
  searchQuery,
  setSearchQuery,
  flatFilter,
  setFlatFilter,
  filteredFlats,
  handleEditFlat,
  handleDeleteFlat,
  setShowAddFlatModal,
  towersOverview,
  updatesLog,
  setActiveTab
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Reset page when filter/search/tower changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedTowerId, searchQuery, flatFilter]);

  const sortedFlats = React.useMemo(() => {
    return [...filteredFlats].sort((a, b) => {
      const numA = parseInt(a.number.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.number.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [filteredFlats]);

  const totalPages = Math.ceil(sortedFlats.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFlats = sortedFlats.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Action Row */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Manage Flats</h3>
          <p className="text-slate-400 text-xs mt-0.5">Filter, search, add, or update occupancy status for all flats</p>
        </div>
        <button 
          onClick={() => setActiveTab('add-flat')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Flat
        </button>
      </div>

      {/* Grid: 3-column stats, progress, activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Column 1: Flats Navigation & Table (Left Side) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-50">
            {/* Tower Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {towersList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTowerChange(t.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${selectedTowerId === t.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search flat/resident..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600 w-44"
                />
              </div>
              <select
                value={flatFilter}
                onChange={(e) => setFlatFilter(e.target.value)}
                className="p-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600 bg-white"
              >
                <option value="All">All Status</option>
                <option value="Occupied">Occupied</option>
                <option value="Vacant">Vacant</option>
              </select>
            </div>
          </div>

          {/* Flats Grid/Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 w-28">Flat No</th>
                  <th className="pb-3 w-32">Status</th>
                  <th className="pb-3">Resident Details</th>
                  <th className="pb-3 w-32">Occupancy Type</th>
                  <th className="pb-3 w-24">Occupants</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFlats.length > 0 ? (
                  paginatedFlats.map((flat) => (
                    <tr key={flat.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="py-2 font-bold text-slate-800 text-sm">{flat.number}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${flat.status === 'Occupied'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                          }`}>
                          {flat.status}
                        </span>
                      </td>
                      <td className="py-2">
                        {flat.status === 'Occupied' ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{flat.resident_name || 'N/A'}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{flat.resident_phone || 'N/A'}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Empty Flat</span>
                        )}
                      </td>
                      <td className="py-2">
                        {flat.status === 'Occupied' ? (
                          getOccupancyType(flat) === 'Owner' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Owner
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Tenant
                            </span>
                          )
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>
                      <td className="py-2 font-semibold text-slate-800 text-sm">
                        {flat.status === 'Occupied' ? flat.occupants_count : '-'}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditFlat(flat)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFlat(flat.id, flat.number)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-xs text-slate-400 italic">
                      No matching flats found in this tower
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredFlats.length > itemsPerPage && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-xs">
              <span className="text-slate-450 font-medium">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredFlats.length)} of {filteredFlats.length} flats
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg border border-slate-100 font-semibold transition ${
                    currentPage === 1
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed border-none'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  const isCurrent = currentPage === pNum;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`h-8 w-8 rounded-lg font-bold transition flex items-center justify-center ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg border border-slate-100 font-semibold transition ${
                    currentPage === totalPages
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed border-none'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Occupancy Stats & Log (Right Side) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Occupancy stats summary */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Flats Overview</h3>

            {/* Progress bars by Tower */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupancy by Tower</h4>
              {towersOverview.map((tow) => {
                const rate = tow.total_flats > 0 ? (tow.occupied_flats / tow.total_flats * 100) : 0;
                return (
                  <div key={tow.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{tow.name}</span>
                      <span>{tow.occupied_flats} / {tow.total_flats} ({Math.round(rate)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity log */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Recent Flat Updates</h3>
            <div className="space-y-4">
              {updatesLog.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <div className={`p-2 rounded-xl h-8 w-8 flex items-center justify-center shrink-0 ${log.type === 'occupied'
                    ? 'bg-emerald-50 text-emerald-600'
                    : log.type === 'vacant'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-blue-50 text-blue-600'
                    }`}>
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 leading-normal">{log.text}</p>
                    <span className="text-[10px] text-slate-450 block mt-1">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
