import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  TrendingDown, 
  Building2, 
  Percent, 
  FileSpreadsheet, 
  Calendar 
} from 'lucide-react';

export default function TotalAmountPage({ paymentsList, flatsList, towersList }) {
  const [filterTower, setFilterTower] = useState('All');
  const [filterDelinquentOnly, setFilterDelinquentOnly] = useState(true);

  // Financial aggregates
  const totalBilled = paymentsList.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = paymentsList
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amountPaid || p.amount), 0);
  const totalOutstanding = paymentsList
    .filter(p => p.status !== 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  // Breakdown by category
  const maintenanceBilled = paymentsList
    .filter(p => p.billType === 'Maintenance')
    .reduce((sum, p) => sum + p.amount, 0);
  const waterBilled = paymentsList
    .filter(p => p.billType === 'Water')
    .reduce((sum, p) => sum + p.amount, 0);

  // Group outstanding amounts by flat
  const flatOutstandingMap = {};
  paymentsList.forEach(p => {
    if (p.status !== 'Paid') {
      if (!flatOutstandingMap[p.flatId]) {
        flatOutstandingMap[p.flatId] = {
          flatNumber: p.flatNumber,
          flatId: p.flatId,
          outstandingAmount: 0,
          pendingBillsCount: 0,
          details: []
        };
      }
      flatOutstandingMap[p.flatId].outstandingAmount += p.amount;
      flatOutstandingMap[p.flatId].pendingBillsCount += 1;
      flatOutstandingMap[p.flatId].details.push(`${p.billType} (${p.month})`);
    }
  });

  const flatOutstandingList = Object.values(flatOutstandingMap).sort((a, b) => b.outstandingAmount - a.outstandingAmount);

  // Filtered outstanding flats
  const filteredOutstandingList = flatOutstandingList.filter(item => {
    const flat = flatsList.find(f => f.id === item.flatId);
    return filterTower === 'All' || (flat && flat.tower_id === parseInt(filterTower));
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800">Financial Summary & Totals</h2>
        <p className="text-slate-550 text-xs">Review overall community invoices, collected reserves, outstanding balances, and delinquent accounts</p>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Billed</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">${totalBilled.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Collected</span>
            <h3 className="text-xl font-bold text-slate-855 mt-0.5">${totalCollected.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Outstanding</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">${totalOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Collection Rate</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{collectionRate.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Category breakdown */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-550" />
            Billed Category Share
          </h3>
          
          <div className="space-y-3">
            <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-50 space-y-1">
              <span className="text-xs font-semibold text-slate-555 block">Maintenance Billings</span>
              <div className="flex justify-between items-end">
                <span className="text-xl font-extrabold text-indigo-900">${maintenanceBilled.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-indigo-500">{(totalBilled > 0 ? (maintenanceBilled / totalBilled) * 100 : 0).toFixed(0)}% of total</span>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50/40 rounded-xl border border-sky-50 space-y-1">
              <span className="text-xs font-semibold text-slate-555 block">Water utility Billings</span>
              <div className="flex justify-between items-end">
                <span className="text-xl font-extrabold text-sky-900">${waterBilled.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-sky-500">{(totalBilled > 0 ? (waterBilled / totalBilled) * 100 : 0).toFixed(0)}% of total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delinquent Accounts List */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                Delinquent Flat Ledger
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">List of apartment accounts with outstanding balances</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-450">Filter Tower:</span>
              <select
                value={filterTower}
                onChange={(e) => setFilterTower(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 focus:outline-none"
              >
                <option value="All">All Towers</option>
                {towersList && towersList.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredOutstandingList.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm font-medium">All accounts are up-to-date! No pending balances.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 pl-4">Flat Number</th>
                    <th className="pb-2">Tower</th>
                    <th className="pb-2 text-center">Unpaid Bills</th>
                    <th className="pb-2">Pending Items</th>
                    <th className="pb-2 pr-4 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredOutstandingList.map((item, idx) => {
                    const flatObj = flatsList.find(f => f.id === item.flatId);
                    const towerObj = flatObj && towersList.find(t => t.id === flatObj.tower_id);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-1.5 pl-4 font-semibold text-slate-800">Flat {item.flatNumber}</td>
                        <td className="py-1.5 text-slate-550 font-medium">{towerObj?.name || 'N/A'}</td>
                        <td className="py-1.5 text-center font-bold text-slate-700">{item.pendingBillsCount}</td>
                        <td className="py-1.5 text-[10px] text-slate-500 max-w-[200px] truncate" title={item.details.join(', ')}>
                          {item.details.join(', ')}
                        </td>
                        <td className="py-1.5 pr-4 font-extrabold text-rose-600 text-right">
                          ${item.outstandingAmount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
