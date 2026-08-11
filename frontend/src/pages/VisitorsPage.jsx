import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  RotateCcw, 
  Bell, 
  User, 
  Truck, 
  Car, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  LogOut, 
  Phone, 
  QrCode, 
  FileText, 
  Download, 
  BarChart3, 
  MoreVertical,
  ChevronDown
} from 'lucide-react';

export default function VisitorsPage({ addLog }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTower, setFilterTower] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Initial Mock Visitors Database
  const [visitors, setVisitors] = useState([]);

  // Pre-Approved Expected List
  const [preApproved, setPreApproved] = useState([]);

  // New Visitor Form State
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    phone: '',
    tower: 'Tower A',
    flat: '',
    resident: '',
    purpose: '',
    type: 'Guest',
    vehicle: '',
    status: 'Inside'
  });

  const handleCheckout = (id) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVisitors(visitors.map(v => {
      if (v.id === id) {
        if (addLog) addLog(`Visitor ${v.name} checked out`, 'vacant');
        return { ...v, status: 'Exited', checkOut: timeNow };
      }
      return v;
    }));
  };

  const handleAddVisitorSubmit = (e) => {
    e.preventDefault();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const visitor = {
      ...newVisitor,
      id: Date.now(),
      checkIn: timeNow,
      checkOut: '—',
      timeInSeconds: 0,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60'
    };
    setVisitors([visitor, ...visitors]);
    if (addLog) addLog(`New visitor registered: ${visitor.name}`, 'occupied');
    setShowAddModal(false);
    setNewVisitor({
      name: '',
      phone: '',
      tower: 'Tower A',
      flat: '',
      resident: '',
      purpose: '',
      type: 'Guest',
      vehicle: '',
      status: 'Inside'
    });
  };

  const handlePreApprovedStatus = (id, action) => {
    if (action === 'approve') {
      setPreApproved(preApproved.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
    } else {
      setPreApproved(preApproved.filter(p => p.id !== id));
    }
  };

  // Filter lists
  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.phone.includes(searchQuery) || 
                          v.flat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTower = filterTower === 'All' || v.tower === filterTower;
    const matchesType = filterType === 'All' || v.type === filterType;
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchesSearch && matchesTower && matchesType && matchesStatus;
  });

  const currentlyInside = visitors.filter(v => v.status === 'Inside');

  return (
    <div className="max-w-none mx-auto space-y-4">
      
      {/* Top Banner Row */}
      <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Visitors Management</h3>
          <p className="text-slate-550 text-xs mt-0.5">Track, approve, and audit visitor records in your gated community</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="h-4.5 w-4.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search visitor by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-72 border border-slate-150 rounded-xl text-xs focus:outline-none focus:border-indigo-650 bg-slate-50/50"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-755 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Visitor
          </button>
        </div>
      </div>

      {/* Metrics Strips (Grid of 6) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {[
          { label: "Total Visitors Today", value: visitors.length, sub: "↑ 8% from yesterday", color: "text-indigo-600 bg-indigo-50", icon: UserCheck },
          { label: "Currently Inside", value: currentlyInside.length, sub: "Live visitors inside", color: "text-emerald-600 bg-emerald-50", icon: User },
          { label: "Checked Out", value: visitors.filter(v => v.status === 'Exited').length, sub: "Today till now", color: "text-blue-600 bg-blue-50", icon: LogOut },
          { label: "Pre-Approved", value: preApproved.length, sub: "Expected today", color: "text-amber-600 bg-amber-50", icon: Clock },
          { label: "Delivery Visitors", value: visitors.filter(v => v.type === 'Delivery').length, sub: "Today till now", color: "text-rose-600 bg-rose-50", icon: Truck },
          { label: "Visitor Vehicles", value: visitors.filter(v => v.vehicle !== '').length, sub: "Today till now", color: "text-violet-600 bg-violet-50", icon: Car }
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>
              <item.icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">{item.label}</span>
              <h3 className="text-lg font-bold text-slate-805 mt-1 leading-none">{item.value}</h3>
              <span className="text-[8px] text-slate-450 block mt-1 leading-none">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</span>
            <input type="date" defaultValue="2026-08-04" className="p-1.5 border border-slate-150 rounded-xl text-xs outline-none bg-white min-w-[120px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tower</span>
            <select
              value={filterTower}
              onChange={(e) => setFilterTower(e.target.value)}
              className="p-2 border border-slate-150 rounded-xl text-xs bg-white min-w-[120px]"
            >
              <option value="All">All Towers</option>
              <option value="Tower A">Tower A</option>
              <option value="Tower B">Tower B</option>
              <option value="Tower C">Tower C</option>
              <option value="Tower D">Tower D</option>
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Visitor Type</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-2 border border-slate-150 rounded-xl text-xs bg-white min-w-[120px]"
            >
              <option value="All">All Types</option>
              <option value="Guest">Guest</option>
              <option value="Delivery">Delivery</option>
              <option value="Service">Service</option>
              <option value="Relative">Relative</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-slate-150 rounded-xl text-xs bg-white min-w-[120px]"
            >
              <option value="All">All Status</option>
              <option value="Inside">Inside</option>
              <option value="Exited">Exited</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            setSearchQuery('');
            setFilterTower('All');
            setFilterType('All');
            setFilterStatus('All');
          }}
          className="self-end px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Main Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Ledger Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-800">Visitors Today ({filteredVisitors.length})</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Visitor</th>
                    <th className="pb-3">Visiting</th>
                    <th className="pb-3">Purpose</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Vehicle No.</th>
                    <th className="pb-3">Check-In</th>
                    <th className="pb-3">Check-Out</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredVisitors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-1.5 pl-2 flex items-center gap-2.5">
                        <img src={v.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                        <div>
                          <span className="font-semibold text-slate-800 block text-xs">{v.name}</span>
                          <span className="text-[10px] text-slate-400 block">{v.phone}</span>
                        </div>
                      </td>
                      <td className="py-1.5">
                        <span className="font-medium text-slate-705 block text-xs">{v.flat}, {v.tower}</span>
                        <span className="text-[10px] text-slate-400 block">{v.resident}</span>
                      </td>
                      <td className="py-1.5 text-xs text-slate-600">{v.purpose}</td>
                      <td className="py-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          v.type === 'Guest' ? 'bg-purple-50 text-purple-700' :
                          v.type === 'Delivery' ? 'bg-emerald-50 text-emerald-700' :
                          v.type === 'Service' ? 'bg-amber-50 text-amber-700' :
                          v.type === 'Relative' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {v.type}
                        </span>
                      </td>
                      <td className="py-1.5 text-xs font-mono text-slate-700">{v.vehicle || '—'}</td>
                      <td className="py-1.5 text-xs text-slate-500">{v.checkIn}</td>
                      <td className="py-1.5 text-xs text-slate-500">{v.checkOut}</td>
                      <td className="py-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          v.status === 'Inside' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-1.5 text-right pr-2">
                        {v.status === 'Inside' ? (
                          <button
                            onClick={() => handleCheckout(v.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition"
                          >
                            Checkout
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Inside list & expected list */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Currently Inside */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">Currently Inside ({currentlyInside.length})</h4>
            </div>
            <div className="space-y-3.5">
              {currentlyInside.map((v) => (
                <div key={v.id} className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <img src={v.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                    <div>
                      <span className="font-semibold text-slate-800 text-xs block">{v.name}</span>
                      <span className="text-[10px] text-slate-400 block">{v.flat}, {v.tower}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      Inside
                    </span>
                    <button 
                      onClick={() => alert(`Calling resident: ${v.resident} regarding ${v.name}`)}
                      className="p-1.5 text-indigo-650 hover:bg-indigo-50 rounded-lg transition"
                      title="Call Resident"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-Approved expected visitors */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-805">Pre-Approved Expected</h4>
            </div>
            <div className="space-y-3">
              {preApproved.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{p.name}</span>
                    <span className="text-[10px] text-slate-400 block">Flat {p.flat} • Expected {p.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status === 'Approved' ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Approved</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handlePreApprovedStatus(p.id, 'approve')}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handlePreApprovedStatus(p.id, 'reject')}
                          className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowAddModal(true)} className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1.5">
                <Plus className="h-4.5 w-4.5" />
                Add Visitor
              </button>
              <button onClick={() => alert('Launching camera to scan QR code...')} className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1.5">
                <QrCode className="h-4.5 w-4.5" />
                Scan QR / ID
              </button>
              <button onClick={() => alert('Generating digital entry pass...')} className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1.5">
                <FileText className="h-4.5 w-4.5" />
                Generate Pass
              </button>
              <button onClick={() => alert('PDF export generated!')} className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1.5">
                <Download className="h-4.5 w-4.5" />
                Export Log
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Add Visitor Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl w-full max-w-md">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Register New Visitor Entry</h4>
            <form onSubmit={handleAddVisitorSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Visitor Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full name of visitor"
                  value={newVisitor.name}
                  onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="Visitor's contact number"
                  value={newVisitor.phone}
                  onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Tower</label>
                  <select
                    value={newVisitor.tower}
                    onChange={(e) => setNewVisitor({ ...newVisitor, tower: e.target.value })}
                    className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Tower A">Tower A</option>
                    <option value="Tower B">Tower B</option>
                    <option value="Tower C">Tower C</option>
                    <option value="Tower D">Tower D</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Flat Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 402"
                    value={newVisitor.flat}
                    onChange={(e) => setNewVisitor({ ...newVisitor, flat: e.target.value })}
                    className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Resident Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Host resident name"
                    value={newVisitor.resident}
                    onChange={(e) => setNewVisitor({ ...newVisitor, resident: e.target.value })}
                    className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TS09AB1234"
                    value={newVisitor.vehicle}
                    onChange={(e) => setNewVisitor({ ...newVisitor, vehicle: e.target.value })}
                    className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Purpose</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delivery, Guest Visit"
                    value={newVisitor.purpose}
                    onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                    className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Visitor Category</label>
                  <select
                    value={newVisitor.type}
                    onChange={(e) => setNewVisitor({ ...newVisitor, type: e.target.value })}
                    className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Guest">Guest</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Service">Service</option>
                    <option value="Relative">Relative</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-550"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  Register Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
