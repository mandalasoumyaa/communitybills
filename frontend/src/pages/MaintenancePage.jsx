import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Tag, 
  Calendar 
} from 'lucide-react';

export default function MaintenancePage({ expenses, setExpenses, addLog }) {
  const [ticketSearch, setTicketSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeSubTab, setActiveSubTab] = useState('expenses'); // 'expenses' or 'tickets'

  // Default Mock Maintenance Tickets
  const [tickets, setTickets] = useState([
    { id: 1, title: 'Elevator Maintenance Tower A', description: 'Monthly routine check and lift motor lubrication', category: 'Lifts', priority: 'High', status: 'In Progress', date: '2026-08-01' },
    { id: 2, title: 'Basement Water Pipe Leak', description: 'Minor crack in main drainage PVC pipeline', category: 'Plumbing', priority: 'Medium', status: 'Open', date: '2026-08-03' },
    { id: 3, title: 'Street Light Bulb Replacement', description: 'Bulb fuse on outer pathway lamp post #14', category: 'Electrical', priority: 'Low', status: 'Completed', date: '2026-07-28' },
  ]);

  const [showAddTicket, setShowAddTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'Electrical',
    priority: 'Medium',
    status: 'Open',
    date: new Date().toISOString().split('T')[0]
  });

  // Filter expenses that come under maintenance (repairs, materials, cleaning, water maintenance/tanker)
  const maintenanceExpenses = expenses.filter(exp => 
    ['repairs', 'materials', 'cleaning', 'water maintenance', 'water tanker', 'general maintenance']
      .includes(exp.category.toLowerCase())
  );

  const totalMaintenanceSpent = maintenanceExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleAddTicketSubmit = (e) => {
    e.preventDefault();
    const ticket = {
      ...newTicket,
      id: Date.now()
    };
    setTickets([ticket, ...tickets]);
    if (addLog) {
      addLog(`Created new maintenance ticket: "${ticket.title}"`);
    }
    setShowAddTicket(false);
    setNewTicket({
      title: '',
      description: '',
      category: 'Electrical',
      priority: 'Medium',
      status: 'Open',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleToggleStatus = (id) => {
    setTickets(tickets.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Open' ? 'In Progress' : t.status === 'In Progress' ? 'Completed' : 'Open';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleDeleteTicket = (id) => {
    if (confirm('Are you sure you want to delete this maintenance ticket?')) {
      setTickets(tickets.filter(t => t.id !== id));
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(ticketSearch.toLowerCase()) || 
                          t.description.toLowerCase().includes(ticketSearch.toLowerCase());
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="max-w-none mx-auto space-y-4">
      {/* Header Action Row */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Maintenance & Operations</h3>
          <p className="text-slate-550 text-xs mt-0.5">Monitor repairs, track work orders, and review upkeep expenditure</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'expenses' 
                ? 'bg-white text-indigo-655 shadow-sm' 
                : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            Upkeep Expenses
          </button>
          <button
            onClick={() => setActiveSubTab('tickets')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'tickets' 
                ? 'bg-white text-indigo-655 shadow-sm' 
                : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            Tickets & Work Orders
          </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Upkeep Expenditures</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">${totalMaintenanceSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            <span className="text-[10px] text-slate-450 block mt-0.5">{maintenanceExpenses.length} logged invoices</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending / Open Orders</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{tickets.filter(t => t.status !== 'Completed').length}</h3>
            <span className="text-[10px] text-slate-450 block mt-0.5">Need attention</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Resolved Issues</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{tickets.filter(t => t.status === 'Completed').length}</h3>
            <span className="text-[10px] text-slate-450 block mt-0.5">Closed tickets</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">High Priority Tasks</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{tickets.filter(t => t.priority === 'High' && t.status !== 'Completed').length}</h3>
            <span className="text-[10px] text-slate-450 block mt-0.5">Urgent actions</span>
          </div>
        </div>
      </div>

      {activeSubTab === 'expenses' ? (
        /* UPKEEP EXPENSES TAB */
        <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-3">
          <div className="pb-2 border-b border-slate-100">
            <h4 className="text-base font-bold text-slate-800">Maintenance Ledger</h4>
            <p className="text-xs text-slate-400 mt-0.5">Repairs, Materials, Cleaning, and Maintenance-related transactions</p>
          </div>

          {maintenanceExpenses.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30 text-indigo-400" />
              <p className="text-sm font-medium">No maintenance expenses logged yet.</p>
              <p className="text-xs text-slate-455 mt-1">Expenses mapped to repairs, materials, or cleaning will automatically display here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 pl-4">Title / Payee</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Notes</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {maintenanceExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-1.5 pl-4 font-semibold text-slate-800">{exp.title}</td>
                      <td className="py-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-55 text-indigo-700">
                          <Tag className="h-3 w-3" />
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-1.5 text-slate-550 text-[10px]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {exp.date}
                        </span>
                      </td>
                      <td className="py-1.5 text-slate-500 max-w-xs truncate" title={exp.notes}>
                        {exp.notes || '-'}
                      </td>
                      <td className="py-1.5 font-bold text-slate-800 text-right">
                        ${exp.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TICKETS & WORK ORDERS TAB */
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search work orders..."
                  value={ticketSearch}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="pl-9 pr-4 py-1.5 w-full border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600 bg-slate-50/50"
                />
              </div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="p-1.5 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600 bg-white"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-1.5 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600 bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddTicket(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              File Work Order
            </button>
          </div>

          {/* Add Ticket form modal overlay */}
          {showAddTicket && (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xl w-full max-w-md">
                <h4 className="text-base font-bold text-slate-900 mb-3">File Maintenance Work Order</h4>
                <form onSubmit={handleAddTicketSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-550 block mb-1">Issue Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ground Floor Lobby AC Fan Faulty"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                      className="w-full p-2 border border-slate-150 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-555 block mb-1">Detailed Description</label>
                    <textarea
                      rows="2"
                      required
                      placeholder="Specify the problem and exact location..."
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      className="w-full p-2 border border-slate-150 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-505 block mb-1">Work Type</label>
                      <select
                        value={newTicket.category}
                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                        className="w-full p-2 border border-slate-150 rounded-xl text-xs focus:outline-none"
                      >
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Lifts">Lifts & Elevators</option>
                        <option value="Security">Security / Gates</option>
                        <option value="Cleaning">Cleaning / Hygiene</option>
                        <option value="Other">Other Repairs</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-550 block mb-1">Priority</label>
                      <select
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                        className="w-full p-2 border border-slate-150 rounded-xl text-xs focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTicket(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tickets list */}
          {filteredTickets.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-450">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-500" />
              <p className="text-sm font-medium">All clear! No work orders match selected filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {filteredTickets.map((t) => (
                <div key={t.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        t.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                        t.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.priority} Priority
                      </span>
                      <button
                        onClick={() => handleToggleStatus(t.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                          t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                          t.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                        }`}
                        title="Click to toggle status"
                      >
                        {t.status}
                      </button>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{t.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {t.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">{t.date}</span>
                      <button
                        onClick={() => handleDeleteTicket(t.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove work order"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
