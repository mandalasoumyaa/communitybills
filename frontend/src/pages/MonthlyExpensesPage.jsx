import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Layers, 
  TrendingDown,
  Calendar,
  Tag,
  FileText,
  Clock,
  Printer,
  ChevronDown,
  Building,
  Wrench,
  Download,
  Droplet
} from 'lucide-react';

const CATEGORY_META = {
  electricity: { name: 'Electricity', icon: '⚡', color: '#EAB308', bg: '#FEF9C3', text: '#854D0E' },
  water_tanker: { name: 'Water Tankers (External)', icon: '💧', color: '#0EA5E9', bg: '#E0F2FE', text: '#0369A1' },
  security: { name: 'Security', icon: '🛡️', color: '#6366F1', bg: '#EEF2FF', text: '#4338CA' },
  salaries: { name: 'Salaries', icon: '👤', color: '#10B981', bg: '#ECFDF5', text: '#047857' },
  repairs: { name: 'Repairs', icon: '🔧', color: '#F59E0B', bg: '#FEF3C7', text: '#B45309' },
  materials: { name: 'Materials', icon: '📦', color: '#64748B', bg: '#F1F5F9', text: '#475569' },
  other: { name: 'Other', icon: '⚙️', color: '#A855F7', bg: '#F3E8FF', text: '#7E22CE' },
  
  // Custom display categories if they map
  'Electricity': { name: 'Electricity', icon: '⚡', color: '#EAB308', bg: '#FEF9C3', text: '#854D0E' },
  'Water Maintenance': { name: 'Water', icon: '💧', color: '#0EA5E9', bg: '#E0F2FE', text: '#0369A1' },
  'Water Tankers (External)': { name: 'Water Tankers (External)', icon: '💧', color: '#0EA5E9', bg: '#E0F2FE', text: '#0369A1' },
  'Water Tankers': { name: 'Water Tankers (External)', icon: '💧', color: '#0EA5E9', bg: '#E0F2FE', text: '#0369A1' },
  'Water': { name: 'Water', icon: '💧', color: '#0EA5E9', bg: '#E0F2FE', text: '#0369A1' },
  'Security': { name: 'Security', icon: '🛡️', color: '#6366F1', bg: '#EEF2FF', text: '#4338CA' },
  'Staff Salary': { name: 'Salaries', icon: '👤', color: '#10B981', bg: '#ECFDF5', text: '#047857' },
  'Salaries': { name: 'Salaries', icon: '👤', color: '#10B981', bg: '#ECFDF5', text: '#047857' },
  'Repairs': { name: 'Repairs', icon: '🔧', color: '#F59E0B', bg: '#FEF3C7', text: '#B45309' },
  'Cleaning': { name: 'Cleaning', icon: '🧹', color: '#EC4899', bg: '#FCE7F3', text: '#BE185D' },
  'Improvements': { name: 'Improvements', icon: '🏢', color: '#8B5CF6', bg: '#EDE9FE', text: '#6D28D9' },
  'Maintenance': { name: 'Maintenance - Variable', icon: '🔧', color: '#EF4444', bg: '#FEE2E2', text: '#B91C1C' },
  'Maintenance - Variable': { name: 'Maintenance - Variable', icon: '🔧', color: '#EF4444', bg: '#FEE2E2', text: '#B91C1C' },
  'General': { name: 'General', icon: '⚙️', color: '#64748B', bg: '#F1F5F9', text: '#475569' }
};

const getCategoryMeta = (cat) => {
  const normalized = String(cat).trim();
  if (CATEGORY_META[normalized]) {
    return CATEGORY_META[normalized];
  }
  const lower = normalized.toLowerCase();
  if (CATEGORY_META[lower]) {
    return CATEGORY_META[lower];
  }
  return { name: normalized, icon: '⚙️', color: '#64748B', bg: '#F1F5F9', text: '#475569' };
};

const formatDateDetails = (dateStr) => {
  if (!dateStr) return '--';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(month, 10) - 1] || 'Apr';
  return `${day.padStart(2, '0')} ${monthName} ${year}`;
};

export default function MonthlyExpensesPage({ expenses = [], communityOverview }) {
  const communityName = communityOverview?.name || 'Srinivasa Residency';

  const getMonthYearStr = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 2) return '';
    const [year, month] = parts;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(month, 10) - 1] || 'May';
    return `${monthName} ${year}`;
  };

  const getPreviousMonthStr = (monthStr) => {
    if (!monthStr) return '';
    const [mName, yStr] = monthStr.split(' ');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const idx = months.indexOf(mName);
    const prevIdx = (idx - 1 + 12) % 12;
    const prevYear = idx === 0 ? parseInt(yStr) - 1 : parseInt(yStr);
    return `${months[prevIdx]} ${prevYear}`;
  };

  // Define unique month selections dynamically
  const defaultMonths = ['March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026'];
  const expenseMonths = Array.from(new Set(expenses.map(exp => getMonthYearStr(exp.date)))).filter(Boolean);
  const selectableMonths = Array.from(new Set([...defaultMonths, ...expenseMonths])).sort((a, b) => new Date(b) - new Date(a));

  const [selectedMonth, setSelectedMonth] = useState('April 2026');

  // Filter expenses for current selected month
  const activeExpenses = expenses.filter(exp => getMonthYearStr(exp.date) === selectedMonth);

  // Group by category helper
  const categoryTotals = {};
  activeExpenses.forEach(exp => {
    const meta = getCategoryMeta(exp.category);
    const catName = meta.name;
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = {
        name: catName,
        total: 0,
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
        text: meta.text
      };
    }
    categoryTotals[catName].total += exp.amount;
  });

  const overallTotal = activeExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryList = Object.values(categoryTotals).sort((a, b) => b.total - a.total);

  // Find highest category
  const highestCategoryItem = categoryList[0];
  const highestCategoryName = highestCategoryItem ? highestCategoryItem.name : '--';
  const highestCategoryAmount = highestCategoryItem ? highestCategoryItem.total : 0;
  const highestCategoryPercentage = (overallTotal > 0 && highestCategoryItem) 
    ? ((highestCategoryItem.total / overallTotal) * 100).toFixed(1) 
    : '0.0';

  // Calculate previous month total
  const previousMonthStr = getPreviousMonthStr(selectedMonth);
  const prevExpenses = expenses.filter(exp => getMonthYearStr(exp.date) === previousMonthStr);
  const prevTotal = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate difference
  const changeAmount = overallTotal - prevTotal;
  const percentageChange = prevTotal > 0 ? ((Math.abs(changeAmount) / prevTotal) * 100).toFixed(1) : '0.0';
  const isIncrease = changeAmount >= 0;

  const handleExport = () => {
    // Generate simple text report summary for export simulation
    const reportText = `MONTHLY EXPENSES REPORT\nCommunity: ${communityName}\nMonth: ${selectedMonth}\n\nTotal Expenses: ₹${overallTotal.toLocaleString('en-IN')}\n\nBY CATEGORY:\n` +
      categoryList.map(c => `- ${c.name}: ₹${c.total.toLocaleString('en-IN')} (${((c.total / overallTotal) * 100).toFixed(1)}%)`).join('\n') +
      `\n\nTRANSACTIONS LEDGER:\n` +
      activeExpenses.map(e => `${formatDateDetails(e.date)} | ${e.description} | ${e.category} | ${e.title} | ₹${e.amount}`).join('\n');
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expenses_Report_${communityName.replace(/\s+/g, '_')}_${selectedMonth.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header Context Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Monthly Expenses</h2>
          <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs font-semibold">
            <span>{communityName}</span>
            <span>•</span>
            <span className="text-[#6366f1]">{selectedMonth}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-3 pr-8 py-2 border border-slate-250 rounded-xl text-xs font-bold bg-white text-slate-700 focus:outline-none focus:border-indigo-500 appearance-none shadow-sm cursor-pointer min-w-[140px]"
            >
              {selectableMonths.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>
          <button
            onClick={handleExport}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total Expenses */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-405 font-bold tracking-wider uppercase block">Total Expenses</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">₹{overallTotal.toLocaleString('en-IN')}</h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">This Month</span>
          </div>
        </div>

        {/* Card 2: Highest Category */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-[#E0F2FE] text-[#0369A1] rounded-xl">
            <Droplet className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-405 font-bold tracking-wider uppercase block">Highest Category</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{highestCategoryName}</h3>
            <span className="text-sm font-black text-[#0369A1] mt-0.5 block">
              ₹{highestCategoryAmount.toLocaleString('en-IN')}{overallTotal > 0 && ` (${highestCategoryPercentage}%)`}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">of total expenses</span>
          </div>
        </div>

        {/* Card 3: Previous Month */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-405 font-bold tracking-wider uppercase block">Previous Month</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">₹{prevTotal.toLocaleString('en-IN')}</h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">{previousMonthStr}</span>
          </div>
        </div>

        {/* Card 4: Change VS Previous */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className={`p-3 rounded-xl ${isIncrease ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isIncrease ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
          </div>
          <div>
            <span className="text-[10px] text-slate-405 font-bold tracking-wider uppercase block">Change vs Previous</span>
            <h3 className={`text-xl font-black mt-1 ${isIncrease ? 'text-emerald-600' : 'text-rose-600'}`}>
              ₹{isIncrease ? '' : '-'}{Math.abs(changeAmount).toLocaleString('en-IN')} ({percentageChange}%)
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
              {isIncrease ? 'Increase ↑' : 'Decrease ↓'}
            </span>
          </div>
        </div>
      </div>

      {activeExpenses.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <FileText className="h-12 w-12 text-slate-350 mx-auto mb-3 opacity-30" />
          <h3 className="text-sm font-bold text-slate-700">No expenses recorded</h3>
          <p className="text-xs text-slate-450 mt-1">Add expenses from Manage Expenses to see analytics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Grouped Category Share Summary */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Expenses by Category</h3>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Grouped share distribution</p>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                    <th className="py-2.5 px-3 text-right">Percentage (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                  {categoryList.map((item, idx) => {
                    const percentage = overallTotal > 0 ? ((item.total / overallTotal) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 flex items-center gap-2 font-semibold">
                          <span 
                            style={{ backgroundColor: item.bg, color: item.text }}
                            className="h-6 w-6 rounded-lg flex items-center justify-center text-xs shrink-0 select-none"
                          >
                            {item.icon}
                          </span>
                          <span>{idx + 1}. {item.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-850">
                          ₹{item.total.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-500">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals Row */}
                  <tr className="bg-slate-50/50 font-bold border-t border-slate-200 text-slate-900 text-xs">
                    <td className="py-3 px-3">Total Expenses</td>
                    <td className="py-3 px-3 text-right text-[#6366f1] font-black">
                      ₹{overallTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500 font-black">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Transaction Ledger */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Expense Details</h3>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Individual ledger transactions</p>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Payee / Vendor</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                  {[...activeExpenses]
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((exp) => {
                      const meta = getCategoryMeta(exp.category);
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                            {formatDateDetails(exp.date)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-[150px] truncate" title={exp.notes || exp.description}>
                            {exp.notes || exp.description}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span 
                              style={{ backgroundColor: meta.bg, color: meta.text }}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold select-none"
                            >
                              {meta.name}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-medium max-w-[120px] truncate" title={exp.title}>
                            {exp.title}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-850">
                            ₹{exp.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  {/* Totals Row */}
                  <tr className="bg-slate-50/50 font-bold border-t border-slate-200 text-slate-900 text-xs">
                    <td className="py-3 px-3" colSpan="4">Total</td>
                    <td className="py-3 px-3 text-right text-slate-900 font-black">
                      ₹{overallTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom status bar info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-450">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>All amounts are in Indian Rupees (₹) and include all expenses for the selected month.</span>
        </div>
        <div>
          <span>Last updated: {selectedMonth === 'April 2026' ? '30 Apr 2026, 10:30 AM' : `${formatDateDetails(new Date().toISOString().split('T')[0])}, 10:30 AM`}</span>
        </div>
      </div>
    </div>
  );
}
