import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Check, 
  Wrench, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Search, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';

export default function AmenitiesPage({ 
  amenities,
  filteredAmenities,
  amenitySearch,
  setAmenitySearch,
  amenityCategory,
  setAmenityCategory,
  amenityStatus,
  setAmenityStatus,
  setAmenities,
  setShowAddAmenityModal,
  addLog
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [showBookModal, setShowBookModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    amenityId: '',
    residentName: '',
    flatNumber: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '06:00 PM - 10:00 PM'
  });

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const selectedAmenity = amenities.find(a => a.id === parseInt(bookingForm.amenityId));
    if (!selectedAmenity) return;

    // Increment bookings_count in amenities state
    setAmenities(prev => prev.map(a => 
      a.id === selectedAmenity.id 
        ? { ...a, bookings_count: (a.bookings_count || 0) + 1 } 
        : a
    ));

    if (addLog) {
      addLog(`${selectedAmenity.name} booked by ${bookingForm.residentName} (Flat ${bookingForm.flatNumber}) for ${bookingForm.date}`, 'add');
    }

    alert(`Successfully booked ${selectedAmenity.name} for ${bookingForm.date}!`);
    setShowBookModal(false);
    setBookingForm({
      amenityId: '',
      residentName: '',
      flatNumber: '',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '06:00 PM - 10:00 PM'
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [amenitySearch, amenityCategory, amenityStatus]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAmenities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAmenities.length / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Action Row */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Manage Amenities</h3>
          <p className="text-slate-400 text-xs mt-0.5">Manage all community amenities, bookings, and facility statuses</p>
        </div>
        <button
          onClick={() => {
            const firstActive = amenities.find(a => a.status === 'Active');
            setBookingForm(prev => ({ ...prev, amenityId: firstActive ? firstActive.id.toString() : '' }));
            setShowBookModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition"
        >
          <Calendar className="h-4.5 w-4.5" />
          Add Booking
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { label: "Total Amenities", value: amenities.length, sub: "All facilities", icon: LayoutGrid, bg: "bg-blue-50 text-blue-600" },
          { label: "Active Amenities", value: amenities.filter(a => a.status === 'Active').length, sub: "Currently available", icon: Check, bg: "bg-emerald-50 text-emerald-600" },
          { label: "Under Maintenance", value: amenities.filter(a => a.status === 'Maintenance').length, sub: "Temporarily closed", icon: Wrench, bg: "bg-amber-50 text-amber-600" },
          { label: "Bookings (This Month)", value: amenities.reduce((sum, a) => sum + (a.bookings_count || 0), 0), sub: "Total bookings", icon: Calendar, bg: "bg-indigo-50 text-indigo-600" },
          { label: "Utilization Rate", value: "78%", sub: "Average this month", icon: TrendingUp, bg: "bg-rose-50 text-rose-600" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
            <div className={`p-2.5 rounded-lg shrink-0 ${stat.bg}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{stat.label}</span>
              <h3 className="text-base font-bold text-slate-800 mt-0.5">{stat.value}</h3>
              <span className="text-[10px] text-slate-450 block mt-0.5">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search amenities..."
              value={amenitySearch}
              onChange={(e) => setAmenitySearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600 bg-slate-50/50"
            />
          </div>
          <select
            value={amenityCategory}
            onChange={(e) => setAmenityCategory(e.target.value)}
            className="p-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600 bg-white"
          >
            <option value="All">All Categories</option>
            <option value="Recreation">Recreation</option>
            <option value="Fitness">Fitness</option>
            <option value="Sports">Sports</option>
            <option value="Wellness">Wellness</option>
            <option value="Parking">Parking</option>
          </select>
          <select
            value={amenityStatus}
            onChange={(e) => setAmenityStatus(e.target.value)}
            className="p-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600 bg-white"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Under Maintenance</option>
          </select>
        </div>
        <button
          onClick={() => {
            setAmenitySearch('');
            setAmenityCategory('All');
            setAmenityStatus('All');
          }}
          className="px-4 py-2 text-xs font-semibold text-indigo-650 hover:bg-indigo-50 rounded-xl transition"
        >
          Clear Filters
        </button>
      </div>

      {/* Main Content split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Amenities Cards Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="text-base font-bold text-slate-900">All Amenities ({filteredAmenities.length})</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentItems.map((amenity) => (
                <div key={amenity.id} className="border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition duration-200 flex flex-col bg-white">
                  <div className="h-32 relative">
                    <img src={amenity.image} className="w-full h-full object-cover" alt={amenity.name} />
                    <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                      {amenity.category}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase backdrop-blur-md ${
                        amenity.status === 'Active'
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-amber-500/90 text-white'
                      }`}>
                        {amenity.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{amenity.name}</h4>
                      <p className="text-xs text-slate-455 mt-1 line-clamp-2 leading-relaxed">{amenity.description}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-xs font-semibold text-slate-650">
                      <span>{amenity.bookings_count} Bookings</span>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Delete amenity ${amenity.name}?`)) {
                            setAmenities(prev => prev.filter(a => a.id !== amenity.id));
                            addLog(`Amenity ${amenity.name} deleted`, 'vacant');
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4 border-t border-slate-550">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      currentPage === pageNumber
                        ? 'bg-indigo-650 text-white shadow-sm'
                        : 'border border-slate-205 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Rules Guidelines widget */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Amenity Rules & Guidelines</h3>
            <ul className="space-y-3">
              {[
                "All amenities are for residents and their guests only.",
                "Booking must be done in advance for clubhouse, lawn, and multipurpose hall.",
                "Maintain cleanliness and avoid noise after 10:00 PM.",
                "Follow all safety rules and instructions specified at each facility."
              ].map((rule, idx) => (
                <li key={idx} className="flex gap-3 text-xs text-slate-600 leading-normal">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Panel: Side Widgets */}
        <div className="lg:col-span-4 space-y-4">

          {/* Maintenance Alerts */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-55">
              <h3 className="text-base font-bold text-slate-900">Maintenance Alerts</h3>
              <button className="text-[10px] font-bold text-indigo-600 hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { title: "Tennis Court", desc: "Surface repairs in progress", status: "In Progress", type: "progress" },
                { title: "Library", desc: "AC not working", status: "Pending", type: "pending" }
              ].map((item, i) => (
                <div key={i} className="border border-slate-50 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase ${
                      item.type === 'progress'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>{item.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-450">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Usage rates progress */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-55">
              <h3 className="text-base font-bold text-slate-900">Amenity Usage (This Month)</h3>
              <button className="text-[10px] font-bold text-indigo-600 hover:underline">View Report</button>
            </div>
            <div className="space-y-4">
              {[
                { name: "Club House", val: 85 },
                { name: "Swimming Pool", val: 76 },
                { name: "Gym", val: 82 },
                { name: "Party Lawn", val: 68 }
              ].map((us, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{us.name}</span>
                    <span>{us.val}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${us.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Booking Modal Dialog */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl w-full max-w-md">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Book an Amenity</h4>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Select Facility</label>
                <select
                  value={bookingForm.amenityId}
                  onChange={(e) => setBookingForm({ ...bookingForm, amenityId: e.target.value })}
                  className="w-full p-2.5 border border-slate-150 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="" disabled>Choose an amenity</option>
                  {amenities.filter(a => a.status === 'Active').map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Resident Name</label>
                <input
                  type="text"
                  required
                  placeholder="Host resident name"
                  value={bookingForm.residentName}
                  onChange={(e) => setBookingForm({ ...bookingForm, residentName: e.target.value })}
                  className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Flat Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-101"
                    value={bookingForm.flatNumber}
                    onChange={(e) => setBookingForm({ ...bookingForm, flatNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6:00 PM - 10:00 PM"
                    value={bookingForm.timeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Booking Date</label>
                <input
                  type="date"
                  required
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-550"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
