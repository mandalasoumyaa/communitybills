import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  ArrowRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function BillingReportsPage({ paymentsList, expenses, flatsList, towersList }) {
  const [reportType, setReportType] = useState('income_statement');
  const [reportMonth, setReportMonth] = useState('2026-08');
  const [generatedReport, setGeneratedReport] = useState(null);

  const handleGenerateReport = (e) => {
    e.preventDefault();
    
    // Simulate compilation
    if (reportType === 'income_statement') {
      const collections = paymentsList.filter(p => p.status === 'Paid' && p.month === reportMonth);
      const totalIncome = collections.reduce((sum, p) => sum + (p.amountPaid || p.amount), 0);
      
      const monthlyExp = expenses.filter(exp => exp.date.substring(0, 7) === reportMonth);
      const totalExpenses = monthlyExp.reduce((sum, exp) => sum + exp.amount, 0);

      setGeneratedReport({
        type: 'Income & Expense Statement',
        month: reportMonth,
        data: {
          income: totalIncome,
          expenses: totalExpenses,
          surplus: totalIncome - totalExpenses,
          collectionsCount: collections.length,
          expensesCount: monthlyExp.length,
          collectionDetails: collections,
          expenseDetails: monthlyExp
        }
      });
    } else if (reportType === 'outstanding_dues') {
      const unpaid = paymentsList.filter(p => p.status !== 'Paid' && p.month === reportMonth);
      const totalUnpaid = unpaid.reduce((sum, p) => sum + p.amount, 0);

      setGeneratedReport({
        type: 'Outstanding Dues Report',
        month: reportMonth,
        data: {
          totalOutstanding: totalUnpaid,
          unpaidCount: unpaid.length,
          unpaidDetails: unpaid
        }
      });
    } else {
      // Water Audit
      const waterBills = paymentsList.filter(p => p.billType === 'Water' && p.month === reportMonth);
      const totalWaterCharges = waterBills.reduce((sum, p) => sum + p.amount, 0);

      setGeneratedReport({
        type: 'Water Consumption Audit',
        month: reportMonth,
        data: {
          totalBilled: totalWaterCharges,
          flatsCount: waterBills.length,
          bills: waterBills
        }
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 print:p-0">
      {/* Header */}
      <div className="print:hidden">
        <h2 className="text-lg font-bold text-slate-800">Financial Reports</h2>
        <p className="text-slate-550 text-xs">Generate printer-friendly PDF statements and audit summaries of community funds</p>
      </div>

      {/* Generation Form */}
      <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm print:hidden">
        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white"
            >
              <option value="income_statement">Income & Expense Statement</option>
              <option value="outstanding_dues">Outstanding Dues Ledger</option>
              <option value="water_audit">Water Consumption Audit</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Billing Month</label>
            <input
              type="month"
              required
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="w-full p-2.5 border border-slate-150 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </button>
        </form>
      </div>

      {/* Report Preview */}
      {generatedReport ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-3 print:border-none print:shadow-none print:p-0">
          <div className="flex justify-between items-start pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Official Report</span>
              <h3 className="text-lg font-bold text-slate-800 mt-1">{generatedReport.type}</h3>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Billing Cycle: {generatedReport.month}</p>
            </div>
            
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
              >
                <Printer className="h-4 w-4" /> Print PDF
              </button>
            </div>
          </div>

          {/* INCOME & EXPENSE DETAILS */}
          {reportType === 'income_statement' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Total Collections</span>
                  <span className="text-xl font-black text-slate-850 block mt-1">${generatedReport.data.income.toFixed(2)}</span>
                  <span className="text-xs text-slate-500 mt-1 block">From {generatedReport.data.collectionsCount} flat payments</span>
                </div>
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Total Expenses</span>
                  <span className="text-xl font-black text-slate-850 block mt-1">${generatedReport.data.expenses.toFixed(2)}</span>
                  <span className="text-xs text-slate-500 mt-1 block">Across {generatedReport.data.expensesCount} recorded bills</span>
                </div>
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">Net Reserves / Surplus</span>
                  <span className={`text-xl font-black block mt-1 ${generatedReport.data.surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${generatedReport.data.surplus.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">Retained operational margin</span>
                </div>
              </div>

              {/* Collections breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-800 border-b border-slate-50 pb-2 text-sm">Collections Ledger Breakdown</h4>
                {generatedReport.data.collectionDetails.length === 0 ? (
                  <p className="text-xs italic text-slate-400">No collected bills for this month.</p>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-405 border-b border-slate-100 font-semibold pb-1">
                          <th className="pb-1.5">Flat ID</th>
                          <th className="pb-1.5">Bill Type</th>
                          <th className="pb-1.5">Date Paid</th>
                          <th className="pb-1.5">Method</th>
                          <th className="pb-1.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReport.data.collectionDetails.map((c, i) => (
                          <tr key={i} className="border-b border-slate-50 py-1">
                            <td className="py-1 font-medium text-slate-700">Flat {c.flatNumber}</td>
                            <td className="py-1 text-slate-500">{c.billType}</td>
                            <td className="py-1 text-slate-500">{c.datePaid}</td>
                            <td className="py-1 text-slate-500">{c.paymentMethod}</td>
                            <td className="py-1 text-right font-semibold text-slate-800">${c.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OUTSTANDING STATEMENT */}
          {reportType === 'outstanding_dues' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/55 border border-rose-100 rounded-2xl max-w-sm">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Total Outstanding Balance</span>
                <span className="text-2xl font-black text-rose-700 block mt-1">${generatedReport.data.totalOutstanding.toFixed(2)}</span>
                <span className="text-xs text-slate-500 mt-1 block">Across {generatedReport.data.unpaidCount} unpaid flats</span>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 border-b border-slate-50 pb-2 text-sm">Outstanding Dues Details</h4>
                {generatedReport.data.unpaidDetails.length === 0 ? (
                  <p className="text-xs italic text-slate-400">All flats paid for this cycle!</p>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-405 border-b border-slate-100 font-semibold pb-1">
                          <th className="pb-1.5">Flat Number</th>
                          <th className="pb-1.5">Bill Category</th>
                          <th className="pb-1.5 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReport.data.unpaidDetails.map((c, i) => (
                          <tr key={i} className="border-b border-slate-50 py-1">
                            <td className="py-1.5 font-medium text-slate-700">Flat {c.flatNumber}</td>
                            <td className="py-1.5 text-slate-550">{c.billType}</td>
                            <td className="py-1.5 text-right font-bold text-rose-600">${c.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WATER AUDIT DETAILS */}
          {reportType === 'water_audit' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl max-w-sm">
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block">Total Water Billings</span>
                <span className="text-2xl font-black text-sky-700 block mt-1">${generatedReport.data.totalBilled.toFixed(2)}</span>
                <span className="text-xs text-slate-500 mt-1 block">Invoiced to {generatedReport.data.flatsCount} apartments</span>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 border-b border-slate-50 pb-2 text-sm">Consumption Audit Ledger</h4>
                {generatedReport.data.bills.length === 0 ? (
                  <p className="text-xs italic text-slate-400">No water bills recorded for this month.</p>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-405 border-b border-slate-100 font-semibold pb-1">
                          <th className="pb-1.5">Flat Number</th>
                          <th className="pb-1.5">Meter Range (KL)</th>
                          <th className="pb-1.5 text-right">Consumption</th>
                          <th className="pb-1.5 text-right">Amount Billed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReport.data.bills.map((c, i) => (
                          <tr key={i} className="border-b border-slate-50 py-1">
                            <td className="py-1.5 font-medium text-slate-750">Flat {c.flatNumber}</td>
                            <td className="py-1.5 text-slate-450">{c.prevReading || 0} KL → {c.currReading || 0} KL</td>
                            <td className="py-1.5 text-right font-semibold text-slate-700">{c.consumption || 0} KL</td>
                            <td className="py-1.5 text-right font-bold text-sky-600">${c.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-100 rounded-2xl">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Select parameters and click "Generate Report" above to review statements.</p>
        </div>
      )}
    </div>
  );
}
