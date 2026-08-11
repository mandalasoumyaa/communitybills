import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  Droplet, 
  FileText, 
  Mail, 
  MessageSquare, 
  Printer, 
  Download, 
  Send,
  User, 
  Wallet,
  Calendar,
  Building2,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import * as api from '../services/communityApi';

export default function ApartmentBillDetailsPage({
  flatsList = [],
  waterReadings = [],
  initialFlatId,
  selectedMonth,
  onBack
}) {
  const [readings, setReadings] = useState([]);

  // Fetch water readings dynamically when selectedMonth changes
  useEffect(() => {
    async function loadWaterReadings() {
      try {
        if (!selectedMonth || !selectedMonth.includes('-')) return;
        const parts = selectedMonth.split('-');
        if (parts.length === 2) {
          const [year, month] = parts;
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = months[parseInt(month, 10) - 1];
          const formattedMonth = `${monthName} ${year}`;
          const res = await api.fetchWaterReadings(formattedMonth, '', 'All', 'All', 'apartment_number', 'asc', 0, 1000);
          setReadings(res.items || []);
        }
      } catch (err) {
        console.error('Failed to load water readings:', err);
      }
    }
    loadWaterReadings();
  }, [selectedMonth]);

  // Active Flat details calculation matching BillingPaymentsPage logic
  const billData = useMemo(() => {
    const flat = flatsList.find(f => f && f.id === parseInt(initialFlatId));
    if (!flat) return null;

    const isOccupied = flat.status === 'Occupied';
    
    // 1. Resident type calculation
    const getOccupancyType = (f) => {
      if (f.status !== 'Occupied') return 'Owner';
      if (f.occupants_count === 2 || f.occupants_count === '2') return 'Tenant';
      if (f.occupants_count === 1 || f.occupants_count === '1') return 'Owner';
      const name = f.resident_name || '';
      if (name.includes('Sharma') || name.includes('Reddy') || name.includes('Verma')) {
        return 'Tenant';
      }
      return 'Owner';
    };
    const residentType = getOccupancyType(flat);
    const residentName = flat.resident_name || 'Vacant';
    const ownerName = flat.resident_name || 'Vacant'; // Use same for default or mock

    // 2. Fetch Water readings from local fetched state
    const dbReading = (readings || []).find(r => {
      if (!r) return false;
      if (r.apartment_id === flat.id) return true;
      const rNum = String(r.apartment_number || '').trim().toUpperCase();
      const fNum = String(flat.number || '').trim().toUpperCase();
      return rNum && fNum && rNum === fNum;
    });

    const hasActualReading = !!(dbReading && dbReading.current_reading !== null && dbReading.current_reading !== undefined);
    const waterCost = hasActualReading ? (Number(dbReading.water_cost) || 0) : 0;
    const maintenance = isOccupied ? 3000 : 0;

    // 3. Current month total
    const currentMonthTotal = waterCost + maintenance;

    // 4. Seed outstanding arrears/payments matching screenshot structure
    let carrierAmount = 0;
    let residentArrear = 0;
    let ownerArrear = 0;
    let paidByResident = 0;
    let paidByOwner = 0;

    if (isOccupied) {
      if (flat.number === 'A-101') {
        carrierAmount = 0;
        residentArrear = 0;
        ownerArrear = 0;
        paidByResident = currentMonthTotal;
        paidByOwner = 0;
      } else if (flat.number === 'A-102') {
        carrierAmount = 400;
        residentArrear = 250;
        ownerArrear = 150;
        paidByResident = 1200;
        paidByOwner = 150;
      } else if (flat.number === 'A-103') {
        carrierAmount = 800;
        residentArrear = 500;
        ownerArrear = 300;
        paidByResident = 0;
        paidByOwner = 0;
      } else if (flat.number === 'B-201') {
        carrierAmount = 0;
        residentArrear = 0;
        ownerArrear = 0;
        paidByResident = currentMonthTotal;
        paidByOwner = 0;
      } else if (flat.number === 'B-202') {
        carrierAmount = 400;
        residentArrear = 250;
        ownerArrear = 150;
        paidByResident = 1500;
        paidByOwner = 0;
      } else if (flat.number === 'B-203') {
        carrierAmount = 800;
        residentArrear = 500;
        ownerArrear = 300;
        paidByResident = 0;
        paidByOwner = 0;
      } else if (flat.number === 'C-301') {
        carrierAmount = 0;
        residentArrear = 0;
        ownerArrear = 0;
        paidByResident = 0;
        paidByOwner = 0;
      } else if (flat.number === 'C-302') {
        carrierAmount = 600;
        residentArrear = 400;
        ownerArrear = 200;
        paidByResident = 950;
        paidByOwner = 2000;
      } else {
        // Dynamic calculations matching payments page
        const numDigits = parseInt((flat.number || '').replace(/\D/g, '')) || 101;
        if (numDigits % 3 === 0) {
          carrierAmount = 0;
          residentArrear = 0;
          ownerArrear = 0;
          paidByResident = currentMonthTotal;
          paidByOwner = 0;
        } else if (numDigits % 3 === 1) {
          carrierAmount = 400;
          residentArrear = 250;
          ownerArrear = 150;
          paidByResident = Math.round(currentMonthTotal * 0.4);
          paidByOwner = 0;
        } else {
          carrierAmount = 800;
          residentArrear = 500;
          ownerArrear = 300;
          paidByResident = 0;
          paidByOwner = 0;
        }
      }
    }

    // Calculations
    const totalPayable = currentMonthTotal + carrierAmount + residentArrear + ownerArrear;
    const totalPaid = paidByResident + paidByOwner;
    const balance = totalPayable - totalPaid;

    let status = 'Pending';
    if (balance === 0) {
      status = 'Paid';
    } else if (totalPaid > 0) {
      status = 'Partial';
    }

    // Find Tower info
    const towerName = flat.tower?.name || `Tower ${flat.tower_id || 'A'}`;

    return {
      flatNumber: flat.number,
      residentType,
      residentName,
      ownerName,
      waterCost,
      maintenance,
      currentMonthTotal,
      carrierAmount,
      residentArrear,
      ownerArrear,
      totalPayable,
      paidByResident,
      paidByOwner,
      totalPaid,
      balance,
      status,
      hasActualReading,
      towerName
    };
  }, [initialFlatId, flatsList, readings]);

  // Format month text e.g., '2026-05' to 'May 2026'
  const displayMonth = useMemo(() => {
    if (!selectedMonth || !selectedMonth.includes('-')) return 'May 2026';
    const [year, month] = selectedMonth.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }, [selectedMonth]);

  const displayDueDate = useMemo(() => {
    if (!selectedMonth || !selectedMonth.includes('-')) return '15 May 2026';
    return `15 ${displayMonth}`;
  }, [selectedMonth, displayMonth]);

  const mockTransactions = useMemo(() => {
    if (!billData) return [];
    return [
      {
        date: '02 May 2026',
        paidBy: billData.residentType,
        mode: 'UPI',
        txId: `TXN${initialFlatId}09923`,
        amount: billData.totalPaid > 0 ? billData.totalPaid : 3000,
        status: 'Success'
      },
      {
        date: '05 Apr 2026',
        paidBy: 'Owner',
        mode: 'Net Banking',
        txId: `TXN${initialFlatId}08711`,
        amount: 3500,
        status: 'Success'
      },
      {
        date: '03 Mar 2026',
        paidBy: 'Resident',
        mode: 'Card',
        txId: `TXN${initialFlatId}07155`,
        amount: 3200,
        status: 'Success'
      }
    ];
  }, [billData, initialFlatId]);

  const formatValue = (val) => {
    return Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-800 font-sans p-4">
      {/* Header view / Return */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Flat Payment Details</h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">SaaS individual bill ledger view</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Billing Month</span>
          <span className="text-sm font-extrabold text-slate-800">{displayMonth}</span>
        </div>
      </div>

      {billData ? (
        <>
          {/* Metadata Flat Payment Details Header Info Card */}
          <div className="bg-white border border-slate-150 rounded-[18px] p-5 shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Flat Number</span>
                <span className="font-extrabold text-slate-850 text-sm">{billData.flatNumber}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Resident Name</span>
                <span className="font-bold text-slate-800 text-xs block truncate">{billData.residentName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Owner Name</span>
                <span className="font-bold text-slate-800 text-xs block truncate">{billData.ownerName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Resident Type</span>
                <span className="font-bold text-slate-800 text-xs">{billData.residentType}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tower</span>
                <span className="font-bold text-slate-800 text-xs">{billData.towerName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Billing Month</span>
                <span className="font-bold text-slate-800 text-xs">{displayMonth}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bill Status</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  billData.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                  billData.status === 'Partial' ? 'bg-amber-50 text-amber-700' :
                  'bg-rose-50 text-rose-700'
                }`}>
                  {billData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1, 2, 3 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Section 1 – Current Charges */}
            <div className="bg-white border border-slate-150 rounded-[18px] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="p-1.5 bg-indigo-50 text-[#5B5CEB] rounded-lg">
                    <Droplet className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Current Charges</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Water Cost (₹)</span>
                    <span className="text-slate-800">
                      {billData.hasActualReading ? `₹${formatValue(billData.waterCost)}` : (
                        <span className="text-[10px] text-rose-500 italic font-semibold">No Reading Available</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Maintenance (₹)</span>
                    <span className="text-slate-800">₹{formatValue(billData.maintenance)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-850">Current Month Total (₹)</span>
                <span className="text-sm font-black text-slate-900">
                  {billData.hasActualReading ? `₹${formatValue(billData.currentMonthTotal)}` : (
                    <span className="text-xs text-rose-500 font-semibold italic">Pending Reading</span>
                  )}
                </span>
              </div>
            </div>

            {/* Section 2 – Previous Dues */}
            <div className="bg-white border border-slate-150 rounded-[18px] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Previous Dues</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Carrier Amount (₹)</span>
                    <span className="text-slate-800">₹{formatValue(billData.carrierAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Resident Arrear (₹)</span>
                    <span className="text-slate-800">₹{formatValue(billData.residentArrear)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Owner Arrear (₹)</span>
                    <span className="text-slate-800">₹{formatValue(billData.ownerArrear)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-855">Total Previous Dues</span>
                <span className="text-sm font-black text-slate-800">₹{formatValue(billData.carrierAmount + billData.residentArrear + billData.ownerArrear)}</span>
              </div>
            </div>

            {/* Section 3 – Payment Summary */}
            <div className="bg-white border border-slate-150 rounded-[18px] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Payment Summary</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Total Payable (₹)</span>
                    <span className="text-slate-900 font-extrabold">
                      {billData.hasActualReading ? `₹${formatValue(billData.totalPayable)}` : (
                        <span className="text-rose-500 font-semibold italic">Pending Reading</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Paid By Resident (₹)</span>
                    <span className="text-slate-850">₹{formatValue(billData.paidByResident)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400">Paid By Owner (₹)</span>
                    <span className="text-slate-855">₹{formatValue(billData.paidByOwner)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-50 pt-2 text-emerald-650">
                    <span>Total Paid (₹)</span>
                    <span>₹{formatValue(billData.totalPaid)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">Remaining Balance (₹)</span>
                  <span className="text-xs font-black text-slate-800">
                    {billData.hasActualReading ? `₹${formatValue(billData.balance)}` : (
                      <span className="text-[10px] text-rose-500 font-semibold italic">Pending Reading</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 – Payment History */}
          <div className="bg-white border border-slate-150 rounded-[18px] p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <ArrowRightLeft className="h-4 w-4 text-[#5B5CEB]" />
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Payment History</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5">Payment Date</th>
                    <th className="pb-2.5">Paid By</th>
                    <th className="pb-2.5">Payment Mode</th>
                    <th className="pb-2.5">Transaction ID</th>
                    <th className="pb-2.5 text-right">Amount</th>
                    <th className="pb-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {mockTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5">{tx.date}</td>
                      <td className="py-2.5">{tx.paidBy}</td>
                      <td className="py-2.5">{tx.mode}</td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-500">{tx.txId}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">₹{formatValue(tx.amount)}</td>
                      <td className="py-2.5 text-center">
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5 – Bill Status Large colored badge */}
          <div className="bg-white border border-slate-150 rounded-[18px] p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#5B5CEB]" />
              <span className="text-xs font-bold text-slate-800">Overall Bill Status</span>
            </div>
            <div>
              <span className={`inline-flex px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider border ${
                billData.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                billData.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {billData.status === 'Paid' ? '🟢 Paid' : 
                 billData.status === 'Partial' ? '🟡 Partial' : 
                 '🔴 Pending'}
              </span>
            </div>
          </div>

          {/* Bottom Actions bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-[18px] p-4 shadow-sm">
            <div className="flex gap-2">
              <button 
                onClick={onBack}
                className="px-3.5 py-1.5 border border-slate-250 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs shadow-2xs bg-white transition-colors"
              >
                Back to Bills
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => alert('WhatsApp Reminder sent!')}
                className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Send WhatsApp Reminder
              </button>
              <button 
                onClick={() => alert('Email Reminder sent!')}
                className="px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Send Email
              </button>
              <button 
                onClick={() => window.print()}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs shadow-2xs flex items-center gap-1.5 bg-white transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Bill
              </button>
              <button 
                onClick={() => alert('Download PDF started')}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs shadow-2xs flex items-center gap-1.5 bg-white transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
              <button 
                disabled={!billData.hasActualReading}
                onClick={() => alert(`Recording payment for flat ${billData.flatNumber}`)}
                className={`px-3.5 py-1.5 font-bold rounded-xl text-xs shadow-2xs flex items-center gap-1.5 transition-colors ${
                  billData.hasActualReading 
                    ? 'bg-[#5B5CEB] hover:bg-[#494abf] text-white' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Record Payment
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-150 rounded-[18px] p-8 shadow-xs text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
          <h3 className="font-extrabold text-slate-800">No active flat selected</h3>
          <p className="text-xs text-slate-400 mt-1">Please select an occupied flat to display individual bill details.</p>
        </div>
      )}
    </div>
  );
}
