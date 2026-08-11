import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  TrendingDown 
} from 'lucide-react';

export default function MonthlyExpensesPage({ expenses }) {
  const [activeView, setActiveView] = useState('category'); // 'category' or 'monthly'

  // Categories helper
  const categories = ['Electricity', 'Water Maintenance', 'Security', 'Cleaning', 'Repairs', 'Staff Salary', 'General'];

  // Calculate totals by category
  const categoryTotals = categories.map(cat => {
    const total = expenses
      .filter(exp => exp.category === cat)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { name: cat, total };
  }).sort((a, b) => b.total - a.total);

  const overallTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Group by month (YYYY-MM)
  const monthlyMap = {};
  expenses.forEach(exp => {
    const month = exp.date.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = 0;
    monthlyMap[month] += exp.amount;
  });

  const monthlyTotals = Object.keys(monthlyMap).map(m => ({
    month: m,
    total: monthlyMap[m]
  })).sort((a, b) => a.month.localeCompare(b.month));

  const maxCategoryAmount = Math.max(...categoryTotals.map(c => c.total), 1);
  const maxMonthlyAmount = Math.max(...monthlyTotals.map(m => m.total), 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Monthly Expenses Analytics</h2>
          <p className="text-slate-550 text-xs">Visualize operational costs distribution and month-over-month utility expenditures</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveView('category')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'category' 
                ? 'bg-white text-indigo-650 shadow-sm' 
                : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            By Category
          </button>
          <button
            onClick={() => setActiveView('monthly')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'monthly' 
                ? 'bg-white text-indigo-650 shadow-sm' 
                : 'text-slate-550 hover:text-slate-855'
            }`}
          >
            Monthly Trend
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Operations Cost</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">${overallTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Highest Expenditure Category</span>
            <h3 className="text-base font-bold text-slate-800 mt-0.5">
              {categoryTotals[0]?.total > 0 ? `${categoryTotals[0].name} ($${categoryTotals[0].total.toLocaleString()})` : 'None'}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Month Cost</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">
              ${(monthlyTotals[monthlyTotals.length - 1]?.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visual Charts */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            {activeView === 'category' ? <PieChart className="h-4 w-4 text-indigo-500" /> : <BarChart3 className="h-4 w-4 text-indigo-500" />}
            {activeView === 'category' ? 'Expense Share by Category' : 'Month-over-Month Expenditures'}
          </h3>

          {activeView === 'category' ? (
            /* Category progress-bars (representing bar charts) */
            <div className="space-y-3 py-1">
              {categoryTotals.map((item, idx) => {
                const percentage = overallTotal > 0 ? (item.total / overallTotal) * 100 : 0;
                const barWidth = (item.total / maxCategoryAmount) * 100;
                
                // Color array
                const colors = [
                  'bg-indigo-600', 'bg-blue-500', 'bg-emerald-500', 
                  'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-slate-400'
                ];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <span className="font-bold text-slate-900">${item.total.toLocaleString(undefined, {minimumFractionDigits: 2})} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Monthly bar chart trend */
            monthlyTotals.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No monthly records found.</div>
            ) : (
              <div className="flex items-end justify-around h-64 pt-8 border-b border-l border-slate-100 px-4">
                {monthlyTotals.map((m, idx) => {
                  const barHeight = (m.total / maxMonthlyAmount) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 group relative w-12">
                      <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                        ${m.total.toLocaleString()}
                      </div>
                      <div 
                        className="w-8 bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all duration-300"
                        style={{ height: `${Math.max(5, barHeight * 1.8)}px` }}
                      ></div>
                      <span className="text-xs font-semibold text-slate-500 rotate-45 md:rotate-0 mt-2">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Detailed Category Table Summary */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" />
            Budget Distribution
          </h3>
          <div className="divide-y divide-slate-100">
            {categoryTotals.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-1.5">
                <span className="text-xs font-semibold text-slate-650">{item.name}</span>
                <span className="text-xs font-bold text-slate-850">${item.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
