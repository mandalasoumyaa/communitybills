import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Filter, 
  Calendar, 
  Tag, 
  FileText, 
  TrendingUp,
  Receipt
} from 'lucide-react';
import AddExpensePage from '../pages/AddExpensePage';

export default function ManageExpensesPage({ expenses, setExpenses }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Electricity',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  if (showAddForm) {
    return (
      <AddExpensePage
        onBack={() => setShowAddForm(false)}
        onExpenseCreated={(newExp) => {
          const formatted = {
            id: Date.now(),
            title: newExp.vendor || newExp.description || 'Expense',
            amount: newExp.amount,
            category: newExp.category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            date: newExp.date,
            notes: newExp.description || newExp.notes
          };
          setExpenses([formatted, ...expenses]);
          setShowAddForm(false);
        }}
      />
    );
  }

  const categories = ['Electricity', 'Water Maintenance', 'Security', 'Cleaning', 'Repairs', 'Staff Salary', 'General'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    const expense = {
      id: Date.now(),
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
      notes: newExpense.notes
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({
      title: '',
      amount: '',
      category: 'Electricity',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  // Filter logic
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
    const matchesMonth = filterMonth === 'All' || exp.date.substring(0, 7) === filterMonth;
    return matchesCategory && matchesMonth;
  });

  // Stats
  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalAllTime = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Get unique months from expenses list for filter dropdown
  const uniqueMonths = Array.from(new Set(expenses.map(exp => exp.date.substring(0, 7)))).sort().reverse();

  return (
    <div className="space-y-4">
      {/* Top Banner / Headers */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Manage Expenses</h2>
          <p className="text-slate-550 text-xs">Track and manage all operating costs and utility expenses for the community</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all self-start"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? 'Hide Form' : 'Log New Expense'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-150 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Filtered Expenses Total</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">${totalFilteredAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-155 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Total Recorded Expenses</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">${totalAllTime.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-155 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Active Invoices</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{filteredExpenses.length} Records</h3>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900">Record New Expense</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Expense Title / Payee</label>
              <input
                type="text"
                required
                placeholder="e.g. Municipal Electricity Bill"
                value={newExpense.title}
                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                className="w-full p-1.5 border border-slate-150 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full p-1.5 border border-slate-155 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full p-1.5 border border-slate-155 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Date Paid</label>
              <input
                type="date"
                required
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="w-full p-1.5 border border-slate-155 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 block mb-1">Notes / Reference No.</label>
              <textarea
                rows="2"
                placeholder="Transaction reference ID, billing cycles or department notes..."
                value={newExpense.notes}
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                className="w-full p-1.5 border border-slate-155 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              ></textarea>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-550"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and List */}
      <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Expense Ledger</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="All">All Months</option>
              {uniqueMonths.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No expenses found matching the selected filters.</p>
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
                  <th className="pb-2 pr-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-1.5 pl-4 font-semibold text-slate-800">{exp.title}</td>
                    <td className="py-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <Tag className="h-3 w-3" />
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-1.5 text-slate-500 text-[10px]">
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
                    <td className="py-1.5 pr-4 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1 text-rose-550 hover:text-rose-750 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
