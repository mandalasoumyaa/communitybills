import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Building2,
  Calendar,
  CreditCard,
  Wallet,
  Search,
  Download,
  Send,
  History,
  Eye,
  Plus,
  TrendingUp,
  TrendingDown,
  User,
  SlidersHorizontal,
  ChevronDown,
  Info,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  CheckCircle2,
  List,
  RotateCcw,
  Printer
} from 'lucide-react';
import * as api from '../services/communityApi';
import { api as waterApi } from '../services/waterApi';

export default function BillingPaymentsPage({
  towersList = [],
  flatsList = [],
  paymentsList = [],
  setPaymentsList,
  addLog,
  sharedMonth,
  setSharedMonth,
  currentCommunityId,
  onViewBill
}) {
  const [selectedTower, setSelectedTower] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(sharedMonth || '2026-05');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [waterReadings, setWaterReadings] = useState([]);
  const [editedPayments, setEditedPayments] = useState({});
  const [savedPayments, setSavedPayments] = useState({});

  const [selectedBillItem, setSelectedBillItem] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);

  const [customPayments, setCustomPayments] = useState({});
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordModalData, setRecordModalData] = useState({
    flatId: null,
    flatNumber: '',
    paidBy: 'Resident',
    amount: 0,
    colKey: '',
    mode: 'Cash',
    date: '',
    txId: '',
    remarks: ''
  });

  const [activeDropdown, setActiveDropdown] = useState(null);
  const isDropdownClicking = useRef(false);

  useEffect(() => {
    function handleClickOutsideDropdown(event) {
      if (activeDropdown && !event.target.closest('.payment-dropdown-container')) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideDropdown);
    return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
  }, [activeDropdown]);

  const getPaymentMethodIcon = (mode) => {
    if (mode === 'Cash') return '💵';
    if (mode === 'UPI') return '📱';
    if (mode === 'Bank Transfer') return '🏦';
    return '⋮';
  };

  const handleSelectPaymentMethod = (flatId, colKey, mode) => {
    const item = flatPayments.find(f => f.id === flatId);
    if (!item) return;

    const editValue = (editedPayments[flatId] && colKey in editedPayments[flatId])
      ? editedPayments[flatId][colKey]
      : (item[colKey] === 0 ? '' : item[colKey].toString());

    const amount = parseFloat(editValue);
    const todayYMD = new Date().toISOString().split('T')[0];

    setRecordModalData({
      flatId,
      flatNumber: item.number,
      paidBy: colKey === 'paidByResident' ? 'Resident' : 'Owner',
      amount: isNaN(amount) ? 0 : amount,
      colKey: colKey,
      mode: mode,
      date: todayYMD,
      txId: '',
      remarks: ''
    });
    setShowRecordModal(true);
  };


  const getFlatInitialPayments = (flat) => {
    return {
      resident: 0,
      owner: 0,
      history: []
    };
  };

  const getFlatPaymentHistory = (flat) => {
    const initial = getFlatInitialPayments(flat);
    const custom = customPayments[flat.id] || [];
    return [...initial.history, ...custom];
  };

  const getBillPayments = (item, selectedMonth) => {
    const waterCost = item.waterCost || 0;
    const maintenance = item.maintenance || 3000;
    const residentArrear = item.residentArrear || 0;
    const ownerArrear = item.ownerArrear || 0;
    const totalPayable = item.totalPayable || (waterCost + maintenance + residentArrear + ownerArrear);

    const history = getFlatPaymentHistory(item);
    const resPayments = history.filter(h => h.paidBy === 'Resident');
    const ownPayments = history.filter(h => h.paidBy === 'Owner');

    const resPaid = resPayments.reduce((sum, h) => sum + h.amount, 0);
    const ownPaid = ownPayments.reduce((sum, h) => sum + h.amount, 0);

    const totalPaid = resPaid + ownPaid;
    const outstanding = Math.max(0, totalPayable - totalPaid);

    const lastRes = resPayments[resPayments.length - 1] || { amount: 0, mode: '--', txId: '--', date: '--', remarks: '--' };
    const lastOwn = ownPayments[ownPayments.length - 1] || { amount: 0, mode: '--', txId: '--', date: '--', remarks: '--' };

    return {
      waterCost,
      maintenance,
      residentArrear,
      ownerArrear,
      totalPayable,
      resPayment: { amount: resPaid, mode: lastRes.mode, txId: lastRes.txId, date: lastRes.date, remarks: lastRes.remarks },
      ownPayment: { amount: ownPaid, mode: lastOwn.mode, txId: lastOwn.txId, date: lastOwn.date, remarks: lastOwn.remarks },
      history,
      totalPaid,
      outstanding,
      nextResArrear: item.arrearNextMonthResident !== undefined ? item.arrearNextMonthResident : outstanding,
      nextOwnArrear: item.arrearNextMonthOwner !== undefined ? item.arrearNextMonthOwner : 0
    };
  };

  const formatDateToShort = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleTriggerRecordPayment = (flatId, colKey, val) => {
    const amount = parseFloat(val);
    if (!isNaN(amount) && amount > 0) {
      const item = flatPayments.find(f => f.id === flatId);
      const todayYMD = new Date().toISOString().split('T')[0];
      setRecordModalData({
        flatId,
        flatNumber: item ? item.number : '',
        paidBy: colKey === 'paidByResident' ? 'Resident' : 'Owner',
        amount: amount,
        colKey: colKey,
        mode: 'Cash',
        date: todayYMD,
        txId: '',
        remarks: ''
      });
      setShowRecordModal(true);
    }
  };

  const handleCancelRecordPayment = () => {
    const { flatId, colKey } = recordModalData;
    setEditedPayments(prev => {
      const next = { ...prev };
      if (next[flatId]) {
        delete next[flatId][colKey];
        if (Object.keys(next[flatId]).length === 0) {
          delete next[flatId];
        }
      }
      return next;
    });
    setShowRecordModal(false);
  };

  const handleSaveRecordPayment = () => {
    const { flatId, paidBy, amount, mode, date, txId, remarks } = recordModalData;
    
    setCustomPayments(prev => {
      const flatHistory = prev[flatId] || [];
      const newPayment = {
        date: formatDateToShort(date),
        paidBy,
        mode,
        amount: parseFloat(amount) || 0,
        txId: txId || (mode === 'Cash' ? 'CASH' + Math.floor(1000 + Math.random() * 9000) : ''),
        remarks: remarks || '--'
      };
      return {
        ...prev,
        [flatId]: [...flatHistory, newPayment]
      };
    });

    setSavedPayments(prev => {
      const currentSaved = prev[flatId] || {};
      const colKey = paidBy === 'Resident' ? 'paidByResident' : 'paidByOwner';
      const existingVal = currentSaved[colKey] || 0;
      const newPaidVal = existingVal + amount;
      
      return {
        ...prev,
        [flatId]: {
          ...currentSaved,
          [colKey]: newPaidVal
        }
      };
    });

    const { colKey } = recordModalData;
    setEditedPayments(prev => {
      const next = { ...prev };
      if (next[flatId]) {
        delete next[flatId][colKey];
        if (Object.keys(next[flatId]).length === 0) {
          delete next[flatId];
        }
      }
      return next;
    });

    if (addLog) {
      addLog(`Recorded ${paidBy} payment of ₹${amount} for Flat ${recordModalData.flatNumber}`);
    }

    setShowRecordModal(false);
  };

  const handleOpenViewBill = (item) => {
    setSelectedBillItem(item);
    setShowBillModal(true);
  };

  const handleEditPayment = (flatId, colKey, val) => {
    // Allow positive numbers with up to 2 decimal places or empty values
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      const parsedVal = val === '' ? 0 : parseFloat(val) || 0;
      if (parsedVal < 0) return;

      // Validate payment doesn't exceed total payable
      if (colKey === 'paidByResident' || colKey === 'paidByOwner') {
        const item = flatPayments.find(f => f.id === flatId);
        const otherKey = colKey === 'paidByResident' ? 'paidByOwner' : 'paidByResident';
        
        let otherVal = 0;
        const flatEdits = editedPayments[flatId] || {};
        const flatSaved = savedPayments[flatId] || {};
        if (otherKey in flatEdits) {
          otherVal = flatEdits[otherKey] === '' ? 0 : parseFloat(flatEdits[otherKey]) || 0;
        } else if (otherKey in flatSaved) {
          otherVal = flatSaved[otherKey];
        } else {
          otherVal = item ? item[otherKey] : 0;
        }

        const totalPayable = item ? item.totalPayable : 0;
        if (parsedVal + otherVal > totalPayable) {
          return;
        }
      }

      setEditedPayments(prev => {
        const flatEdits = prev[flatId] || {};
        return {
          ...prev,
          [flatId]: {
            ...flatEdits,
            [colKey]: val
          }
        };
      });
    }
  };

  // Columns visibility state
  const defaultColumns = {
    waterCost: true,
    maintenance: true,
    currentMonthTotal: true,
    carriedAmount: true,
    residentArrear: true,
    ownerArrear: true,
    totalPayable: true,
    paidByResident: true,
    paidByOwner: true,
    balance: true,
    arrearNextMonthOwner: true,
    arrearNextMonthResident: true
  };
  const [columnsVisibility, setColumnsVisibility] = useState(defaultColumns);
  const [tempColumnsVisibility, setTempColumnsVisibility] = useState(defaultColumns);
  const [showColumnsPopover, setShowColumnsPopover] = useState(false);
  const popoverRef = useRef(null);

  // Column definitions
  const columnDefs = [
    { key: 'waterCost', label: 'Water Cost (₹)' },
    { key: 'maintenance', label: 'Maintenance (₹)' },
    { key: 'currentMonthTotal', label: 'Current Month Total (₹)' },
    { key: 'carriedAmount', label: 'Carried Amount (₹)' },
    { key: 'residentArrear', label: 'Resident Arrear (₹)' },
    { key: 'ownerArrear', label: 'Owner Arrear (₹)' },
    { key: 'totalPayable', label: 'Total Payable (₹)' },
    { key: 'paidByResident', label: 'Paid By Resident (₹)' },
    { key: 'paidByOwner', label: 'Paid By Owner (₹)' },
    { key: 'balance', label: 'Balance (₹)' },
    { key: 'arrearNextMonthOwner', label: 'Owner Arrear (Next Month)' },
    { key: 'arrearNextMonthResident', label: 'Resident Arrear (Next Month)' }
  ];

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowColumnsPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch water readings when selectedMonth or community changes
  useEffect(() => {
    async function loadWaterReadings() {
      try {
        const parts = selectedMonth.split('-');
        if (parts.length === 2) {
          const [year, month] = parts;
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = months[parseInt(month, 10) - 1];
          const formattedMonth = `${monthName} ${year}`;
          const res = await waterApi.getReadings({
            month: formattedMonth,
            community_id: currentCommunityId,
            limit: 1000
          });
          setWaterReadings(res.items || []);
        }
      } catch (err) {
        console.error('Failed to load water readings:', err);
      }
    }
    loadWaterReadings();
  }, [selectedMonth, currentCommunityId]);

  // Synchronize month with BillingFinancePage sharedMonth
  useEffect(() => {
    if (sharedMonth && selectedMonth !== sharedMonth) {
      setSelectedMonth(sharedMonth);
    }
  }, [sharedMonth]);

  useEffect(() => {
    if (setSharedMonth && selectedMonth && sharedMonth !== selectedMonth) {
      setSharedMonth(selectedMonth);
    }
  }, [selectedMonth, sharedMonth, setSharedMonth]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTower, statusFilter, searchTerm, rowsPerPage]);

  // Generate dataset based on flatsList
  const flatPayments = useMemo(() => {
    const list = flatsList || [];
    return list.map((flat, idx) => {
      if (!flat) return null;

      const getOccupancyType = (f) => {
        if (f.number === 'A-105') return 'Tenant';
        if (['A-101', 'A-102', 'A-103', 'A-104'].includes(f.number)) return 'Owner';
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
      let residentName = flat.resident_name || '';

      if (flat.status === 'Occupied') {
        if (flat.number === 'A-101') residentName = 'RAMESH';
        else if (flat.number === 'A-102') residentName = 'KRISHNA';
        else if (flat.number === 'A-103') residentName = 'Sai Kumar';
        else if (flat.number === 'A-104') residentName = 'Arjun Kumar';
        else if (flat.number === 'A-105') residentName = 'Aditya';
        else if (!residentName) {
          if (idx === 0) residentName = 'Rahul Sharma';
          else if (idx === 1) residentName = 'Priya Reddy';
          else if (idx === 2) residentName = 'Sanjay Verma';
          else if (idx === 3) residentName = 'Kiran Kumar';
          else if (idx === 4) residentName = 'Anita Singh';
          else if (idx === 5) residentName = 'Vikas Patil';
          else if (idx === 6) residentName = 'Meera Iyer';
          else if (idx === 7) residentName = 'Nikhil Joshi';
          else residentName = `Resident ${flat.number}`;
        }
      } else {
        residentName = 'Vacant';
      }

      // Check database readings for water cost
      const dbReading = (waterReadings || []).find(r => {
        if (!r) return false;
        if (r.apartment_id === flat.id) return true;
        const rNum = String(r.apartment_number || '').replace(/[-\s]/g, '').trim().toUpperCase();
        const fNum = String(flat.number || '').replace(/[-\s]/g, '').trim().toUpperCase();
        return rNum && fNum && rNum === fNum;
      });

      const hasActualReading = !!dbReading;
      let waterCost = hasActualReading ? (Number(dbReading.water_cost) || 0) : 0;

      const isOccupied = flat.status === 'Occupied';
      const maintenance = 3000;
      const currentMonthTotal = waterCost + maintenance;

      // Use the full payment history (initial + custom) as the single source of truth
      const history = getFlatPaymentHistory(flat);
      let paidByResident = history.filter(h => h.paidBy === 'Resident').reduce((sum, h) => sum + h.amount, 0);
      let paidByOwner = history.filter(h => h.paidBy === 'Owner').reduce((sum, h) => sum + h.amount, 0);

      // Seed outstanding arrears/payments matching screenshot structure
      let residentArrear = 0;
      let ownerArrear = 0;

      // Merge edits/saves
      const flatEdits = editedPayments[flat.id] || {};
      const flatSaved = savedPayments[flat.id] || {};

      if ('paidByResident' in flatEdits) {
        paidByResident = flatEdits.paidByResident === '' ? 0 : parseFloat(flatEdits.paidByResident) || 0;
      }

      if ('paidByOwner' in flatEdits) {
        paidByOwner = flatEdits.paidByOwner === '' ? 0 : parseFloat(flatEdits.paidByOwner) || 0;
      }

      if ('residentArrear' in flatEdits) {
        residentArrear = flatEdits.residentArrear === '' ? 0 : parseFloat(flatEdits.residentArrear) || 0;
      } else if ('residentArrear' in flatSaved) {
        residentArrear = flatSaved.residentArrear;
      }

      if ('ownerArrear' in flatEdits) {
        ownerArrear = flatEdits.ownerArrear === '' ? 0 : parseFloat(flatEdits.ownerArrear) || 0;
      } else if ('ownerArrear' in flatSaved) {
        ownerArrear = flatSaved.ownerArrear;
      }

      const carriedAmount = residentArrear + ownerArrear;
      const totalPayable = currentMonthTotal + carriedAmount;
      const totalPaid = paidByResident + paidByOwner;

      let status = 'Pending';
      const residentTotalDue = currentMonthTotal + residentArrear;
      const ownerTotalDue = ownerArrear;

      const arrearNextMonthResident = paidByResident < residentTotalDue ? (residentTotalDue - paidByResident) : 0;
      const arrearNextMonthOwner = paidByOwner < ownerTotalDue ? (ownerTotalDue - paidByOwner) : 0;

      const balance = arrearNextMonthResident + arrearNextMonthOwner;

      if (balance <= 0) {
        status = 'Paid';
      } else if (totalPaid > 0 && balance > 0) {
        status = 'Partial';
      } else if (totalPaid === 0 && totalPayable > 0) {
        status = 'Pending';
      }

      const hasError = totalPaid > totalPayable;

      return {
        id: flat.id,
        number: flat.number,
        residentType,
        residentName,
        residentPhone: flat.resident_phone,
        waterCost,
        maintenance,
        currentMonthTotal,
        carriedAmount,
        residentArrear,
        ownerArrear,
        totalPayable,
        paidByResident,
        paidByOwner,
        totalPaid,
        balance,
        arrearNextMonthOwner,
        arrearNextMonthResident,
        status,
        towerId: flat.tower_id,
        isOccupied,
        hasActualReading,
        hasError,
        isEdited: (flat.id in editedPayments)
      };
    }).filter(Boolean);
  }, [flatsList, selectedMonth, waterReadings, editedPayments, savedPayments]);

  // Filters logic
  const filteredPayments = useMemo(() => {
    return flatPayments.filter(item => {
      const matchesTower = selectedTower === 'All' || item.towerId === parseInt(selectedTower);
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesSearch =
        (item.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.residentName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTower && matchesStatus && matchesSearch;
    });
  }, [flatPayments, selectedTower, statusFilter, searchTerm]);

  // Reset page on filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTower, statusFilter, searchTerm]);

  // Paginated list
  const paginatedList = useMemo(() => {
    return filteredPayments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [filteredPayments, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);

  // Table total sums
  const totals = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => {
      acc.waterCost += curr.waterCost;
      acc.maintenance += curr.maintenance;
      acc.currentMonthTotal += curr.currentMonthTotal;
      acc.carriedAmount += curr.carriedAmount;
      acc.residentArrear += curr.residentArrear;
      acc.ownerArrear += curr.ownerArrear;
      acc.totalPayable += curr.totalPayable;
      acc.paidByResident += curr.paidByResident;
      acc.paidByOwner += curr.paidByOwner;
      acc.totalPaid += curr.totalPaid;
      acc.arrearNextMonthOwner += curr.arrearNextMonthOwner;
      acc.arrearNextMonthResident += curr.arrearNextMonthResident;
      acc.balance += curr.balance;
      return acc;
    }, {
      waterCost: 0, maintenance: 0, currentMonthTotal: 0, carriedAmount: 0, residentArrear: 0, ownerArrear: 0,
      totalPayable: 0, paidByResident: 0, paidByOwner: 0, totalPaid: 0, arrearNextMonthOwner: 0, arrearNextMonthResident: 0, balance: 0
    });
  }, [filteredPayments]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalBills = flatPayments.length;
    const totalReceivable = flatPayments.reduce((sum, item) => sum + item.totalPayable, 0);
    const totalCollected = flatPayments.reduce((sum, item) => sum + item.totalPaid, 0);
    const outstanding = totalReceivable - totalCollected;

    return {
      totalBills,
      totalReceivable,
      totalCollected,
      outstanding
    };
  }, [flatPayments]);

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleResetColumns = () => {
    setTempColumnsVisibility(defaultColumns);
  };

  const handleApplyColumns = () => {
    setColumnsVisibility(tempColumnsVisibility);
    setShowColumnsPopover(false);
  };

  const handleToggleColumn = (key) => {
    setTempColumnsVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const hasValidationErrors = useMemo(() => {
    return flatPayments.some(item => item.hasError);
  }, [flatPayments]);

  const handleCancelAllEdits = () => {
    setEditedPayments({});
  };

  const handleSaveAllEdits = () => {
    setSavedPayments(prev => {
      const updated = { ...prev };
      Object.entries(editedPayments).forEach(([flatId, editsObj]) => {
        const currentSaved = updated[flatId] || {};
        const newSaved = { ...currentSaved };

        const keysToSave = ['paidByResident', 'paidByOwner', 'residentArrear', 'ownerArrear'];
        keysToSave.forEach(key => {
          if (key in editsObj) {
            newSaved[key] = editsObj[key] === '' ? 0 : parseFloat(editsObj[key]) || 0;
          }
        });

        const flatIdNum = parseInt(flatId);
        const flatObj = flatPayments.find(f => f.id === flatIdNum);
        if (flatObj) {
          newSaved.arrearNextMonthOwner = flatObj.arrearNextMonthOwner;
          newSaved.arrearNextMonthResident = flatObj.arrearNextMonthResident;
        }

        updated[flatId] = newSaved;
      });
      return updated;
    });

    if (addLog) {
      addLog(`Saved payment entries for ${Object.keys(editedPayments).length} flats`);
    }
    setEditedPayments({});
  };
  return (
    <div className="space-y-6 max-w-none text-slate-800 font-sans bg-slate-50/20 p-2 min-h-screen">

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bills Generated */}
        <div className="bg-white border border-slate-100 rounded-[18px] p-5 shadow-xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 text-[#5B5CEB] rounded-[14px] flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Bills Generated</span>
            <span className="text-2xl font-extrabold text-slate-900 leading-tight">{kpis.totalBills}</span>
            <span className="text-[10px] text-[#5B5CEB] block font-semibold mt-0.5">This Month</span>
          </div>
        </div>

        {/* Total Amount Receivable */}
        <div className="bg-white border border-slate-100 rounded-[18px] p-5 shadow-xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-[14px] flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Amount Receivable</span>
            <span className="text-xl font-extrabold text-slate-900 leading-tight">₹{(kpis.totalReceivable || 0).toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-450 block font-semibold mt-0.5">Incl. Arrears</span>
          </div>
        </div>

        {/* Total Amount Collected */}
        <div className="bg-white border border-slate-100 rounded-[18px] p-5 shadow-xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[14px] flex items-center justify-center">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Amount Collected</span>
            <span className="text-xl font-extrabold text-slate-900 leading-tight">₹{(kpis.totalCollected || 0).toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-450 block font-semibold mt-0.5">This Month</span>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-slate-100 rounded-[18px] p-5 shadow-xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-[14px] flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Outstanding Balance</span>
            <span className="text-xl font-extrabold text-slate-900 leading-tight">₹{(kpis.outstanding || 0).toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-amber-600 block font-semibold mt-0.5">Pending</span>
          </div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="bg-white border border-slate-150 rounded-[18px] p-4 shadow-xs">
        <div className="flex flex-wrap md:flex-nowrap gap-3 items-end justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            {/* Tower dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Tower</label>
              <select
                value={selectedTower}
                onChange={(e) => setSelectedTower(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#5B5CEB] bg-white font-medium text-slate-700 h-9"
              >
                <option value="All">All Towers</option>
                {(towersList || []).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Billing Month */}
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Billing Month</label>
              <div className="relative">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#5B5CEB] bg-white font-medium text-slate-700 h-9 pr-8"
                />
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Payment Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#5B5CEB] bg-white font-medium text-slate-700 h-9"
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            {/* Search bar */}
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Search Flat No. / Resident Name</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#5B5CEB] text-slate-800 h-9"
                />
              </div>
            </div>
          </div>

          {/* Filter Action Buttons */}
          <div className="flex gap-2 relative" ref={popoverRef}>
            {/* Columns Toggle Button */}
            <button
              onClick={() => {
                setTempColumnsVisibility(columnsVisibility);
                setShowColumnsPopover(!showColumnsPopover);
              }}
              className="flex items-center gap-1.5 px-4 h-9 border border-[#5B5CEB] text-[#5B5CEB] hover:bg-indigo-50/50 font-bold rounded-xl text-xs shadow-3xs transition-colors"
            >
              <List className="h-4 w-4" />
              Columns
            </button>

            {/* Columns Popover Panel */}
            {showColumnsPopover && (
              <div className="absolute right-0 bottom-11 md:bottom-auto md:top-11 z-50 bg-white border border-slate-150 rounded-[18px] shadow-lg p-4 w-72 text-left">
                <h4 className="text-xs font-bold text-slate-700 mb-3">Show / Hide Columns</h4>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto mb-4 pr-1">
                  {columnDefs.map(col => (
                    <label key={col.key} className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer hover:text-slate-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={tempColumnsVisibility[col.key]}
                        onChange={() => handleToggleColumn(col.key)}
                        className="rounded border-slate-300 text-[#5B5CEB] focus:ring-[#5B5CEB]"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    onClick={handleResetColumns}
                    className="text-[10px] font-bold text-[#5B5CEB] hover:underline"
                  >
                    Reset to Default
                  </button>
                  <button
                    onClick={handleApplyColumns}
                    className="px-4 py-1.5 bg-[#5B5CEB] hover:bg-[#494abf] text-white font-bold rounded-lg text-[10px] transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {Object.keys(editedPayments).length > 0 && (
        <div className="flex justify-between items-center bg-amber-50/60 border border-amber-200/80 rounded-[18px] p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100/50 text-amber-700 rounded-lg">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Unsaved Payment Changes</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                You have edited payment details for {Object.keys(editedPayments).length} flat(s). Click Save to apply changes.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancelAllEdits}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSaveAllEdits}
              disabled={hasValidationErrors}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              Save All Changes
            </button>
          </div>
        </div>
      )}

      {/* DETAILED FINANCE TABLE */}
      <div className="bg-white border border-slate-150 rounded-[18px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-800 tracking-tight bg-slate-50/60 leading-snug">
                <th className="py-3.5 pl-4 pr-2 border-r border-slate-200/80 text-left font-bold text-slate-900 w-[80px]">Flat<br/>No</th>
                <th className="py-3.5 px-3 border-r border-slate-200/80 text-left font-bold text-slate-900 min-w-[150px]">Occupant /<br/>Contact</th>

                {columnDefs.map(col => {
                  if (!columnsVisibility[col.key]) return null;

                  // Format header wrapping dynamically
                  let headerContent = <div>{col.label}</div>;
                  if (col.label.includes(' (Next Month)')) {
                    const base = col.label.replace(' (Next Month)', '');
                    headerContent = (
                      <div>
                        <div>{base}</div>
                        <div className="text-[11px] text-slate-400 font-semibold">(Next Month)</div>
                      </div>
                    );
                  } else {
                    const parts = col.label.split(' (₹)');
                    if (parts.length > 1) {
                      headerContent = (
                        <div>
                          <div>{parts[0]}</div>
                          <div className="text-[11px] text-slate-400 font-semibold">(₹)</div>
                        </div>
                      );
                    }
                  }

                  return (
                    <th key={col.key} className="py-3.5 text-right px-3 border-r border-slate-200/80 font-bold text-slate-900">
                      {headerContent}
                    </th>
                  );
                })}
                <th className="py-3.5 px-3 text-center text-slate-900 font-bold w-[100px]">View<br/>Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-800 text-[13px]">
              {paginatedList.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${item.isEdited ? 'bg-amber-50/30 border-l-4 border-l-amber-500' : ''}`}>
                  <td className="py-2.5 pl-4 pr-2 font-bold text-[14px] text-slate-900 border-r border-slate-100 w-[80px]">{item.number}</td>
                  <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100 min-w-[150px] leading-tight text-left">
                    <div className="flex items-center text-[14px] font-semibold text-slate-900">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 shrink-0 ${item.residentType === 'Owner' ? 'bg-[#22C55E]' : 'bg-[#3B82F6]'
                        }`}></span>
                      {item.residentName}
                    </div>
                    <div className="text-[12px] text-slate-400 font-normal mt-0.5 ml-4">
                      {item.residentPhone || '9876543210'}
                    </div>
                  </td>

                  {columnDefs.map(col => {
                    if (!columnsVisibility[col.key]) return null;

                    let content = null;
                    const isEditable = ['paidByResident', 'paidByOwner', 'residentArrear', 'ownerArrear'].includes(col.key);
                    if (isEditable) {
                      const editValue = (editedPayments[item.id] && col.key in editedPayments[item.id])
                        ? editedPayments[item.id][col.key]
                        : (item[col.key] === 0 ? '' : item[col.key].toString());

                      const isResOrOwn = col.key === 'paidByResident' || col.key === 'paidByOwner';

                      content = (
                        <div className="flex flex-col items-end gap-1 w-full max-w-[130px] mx-auto">
                          <div className={`relative flex items-center w-full ${isResOrOwn ? 'payment-dropdown-container' : ''}`}>
                            <span className="absolute left-2.5 text-slate-400 font-semibold text-[13px] select-none">₹</span>
                            <input
                              type="text"
                              placeholder="Enter Amount"
                              value={editValue}
                              onChange={(e) => handleEditPayment(item.id, col.key, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (col.key === 'paidByResident' || col.key === 'paidByOwner') {
                                    handleTriggerRecordPayment(item.id, col.key, e.target.value);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                if (col.key === 'paidByResident' || col.key === 'paidByOwner') {
                                  setTimeout(() => {
                                    if (isDropdownClicking.current) {
                                      isDropdownClicking.current = false;
                                      return;
                                    }
                                    const val = e.target.value;
                                    if (val && parseFloat(val) > 0) {
                                      handleTriggerRecordPayment(item.id, col.key, val);
                                    }
                                  }, 150);
                                }
                              }}
                              className={`pl-6 ${isResOrOwn ? 'pr-7' : 'pr-2.5'} h-10 w-full border border-slate-200 rounded-[12px] text-right text-[13px] focus:outline-none focus:border-[#5B5CEB] bg-white font-semibold text-slate-700 shadow-3xs`}
                            />
                            {isResOrOwn && (() => {
                              const history = getFlatPaymentHistory(item);
                              const isRes = col.key === 'paidByResident';
                              const paymentsOfType = history.filter(h => h.paidBy === (isRes ? 'Resident' : 'Owner'));
                              const lastPayment = paymentsOfType[paymentsOfType.length - 1];
                              const lastMode = lastPayment ? lastPayment.mode : null;
                              return (
                                <>
                                  <button
                                    type="button"
                                    onMouseDown={() => { isDropdownClicking.current = true; }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(activeDropdown && activeDropdown.flatId === item.id && activeDropdown.colKey === col.key ? null : { flatId: item.id, colKey: col.key });
                                    }}
                                    className="absolute right-2 text-slate-500 hover:text-[#5B5CEB] text-xs focus:outline-none cursor-pointer select-none"
                                  >
                                    {getPaymentMethodIcon(lastMode)}
                                  </button>
                                  {activeDropdown && activeDropdown.flatId === item.id && activeDropdown.colKey === col.key && (
                                    <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 min-w-[140px] text-left">
                                      <div className="text-[9px] font-bold text-slate-400 uppercase px-2 py-1 select-none border-b border-slate-100 mb-1">Select Payment Method</div>
                                      <button
                                        type="button"
                                        onMouseDown={() => { isDropdownClicking.current = true; }}
                                        onClick={() => {
                                          handleSelectPaymentMethod(item.id, col.key, 'Cash');
                                          setActiveDropdown(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-slate-700"
                                      >
                                        <span>💵</span> Cash
                                      </button>
                                      <button
                                        type="button"
                                        onMouseDown={() => { isDropdownClicking.current = true; }}
                                        onClick={() => {
                                          handleSelectPaymentMethod(item.id, col.key, 'UPI');
                                          setActiveDropdown(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-slate-700"
                                      >
                                        <span>📱</span> UPI
                                      </button>
                                      <button
                                        type="button"
                                        onMouseDown={() => { isDropdownClicking.current = true; }}
                                        onClick={() => {
                                          handleSelectPaymentMethod(item.id, col.key, 'Bank Transfer');
                                          setActiveDropdown(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-slate-700"
                                      >
                                        <span>🏦</span> Bank Transfer
                                      </button>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          {item.hasError && (col.key === 'paidByResident' || col.key === 'paidByOwner') && (item.totalPaid > item.totalPayable) && (
                            <span className="text-[9px] text-red-500 font-bold leading-tight text-right w-full block max-w-[150px]">
                              Entered amount cannot exceed the payable amount.
                            </span>
                          )}
                          {item.hasError && (col.key === 'carriedAmount' || col.key === 'residentArrear' || col.key === 'ownerArrear') && (Math.abs(item.residentArrear + item.ownerArrear - item.carriedAmount) > 0.01) && (
                            <span className="text-[9px] text-red-500 font-bold leading-tight text-right w-full block max-w-[150px]">
                              Resident Arrear + Owner Arrear must equal Carried Amount.
                            </span>
                          )}
                        </div>
                      );
                    } else if (col.key === 'waterCost') {
                      content = item.hasActualReading ? formatCurrency(item.waterCost) : <span className="text-[10px] italic text-rose-500 font-semibold block text-center">No Reading Available</span>;
                    } else if (col.key === 'maintenance') {
                      content = formatCurrency(item.maintenance);
                    } else if (col.key === 'currentMonthTotal') {
                      content = formatCurrency(item.currentMonthTotal);

                    } else {
                      const val = item[col.key];
                      content = val && val !== 0 ? formatCurrency(val) : '';
                    }

                    let textClass = 'text-slate-700';
                    if (col.key === 'totalPayable') textClass = 'text-[#5B5CEB] font-bold';
                    else if (col.key === 'totalPaid') textClass = 'text-emerald-600 font-bold';
                    else if (col.key === 'balance') textClass = item.balance > 0 ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold';

                    return (
                      <td key={col.key} className={`py-2.5 text-right px-3 border-r border-slate-100 font-semibold ${textClass}`}>
                        {content}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-center w-[100px]">
                    <button
                      onClick={() => handleOpenViewBill(item)}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#5B5CEB] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer mx-auto transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Bill
                    </button>
                  </td>
                </tr>
              ))}

              {/* GRAND TOTAL SUMMARY ROW */}
              <tr className="bg-slate-100/50 font-extrabold text-slate-900 border-t-2 border-slate-200 text-[13px]">
                <td className="py-3.5 pl-4 pr-2 border-r border-slate-200" colSpan="2">Total</td>

                {columnDefs.map(col => {
                  if (!columnsVisibility[col.key]) return null;
                  const val = totals[col.key] || 0;

                  // Keep totals formatted or blank if zero
                  let content = val !== 0 ? `₹${formatCurrency(val)}` : '₹0.00';
                  if (col.key === 'waterCost' && totals.waterCost === 0) content = '₹0.00';

                  let textClass = 'text-slate-900 font-extrabold';
                  if (col.key === 'totalPayable') textClass = 'text-[#5B5CEB] font-black';
                  else if (col.key === 'totalPaid') textClass = 'text-emerald-600 font-black';
                  else if (col.key === 'balance') textClass = 'text-rose-600 font-black';

                  return (
                    <td key={col.key} className={`py-3.5 text-right px-3 border-r border-slate-200 ${textClass}`}>
                      {content}
                    </td>
                  );
                })}
                <td className="py-3.5 text-center px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PAGINATION SECTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 mt-2 gap-4 px-4 pb-3">
          {/* Rows per page Selector */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1 border border-slate-200 rounded-lg bg-white text-slate-700 font-bold focus:outline-none focus:border-[#5B5CEB]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-400 font-bold">
            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${currentPage === pageNum
                    ? 'bg-[#5B5CEB] text-white shadow-xs'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 bg-white border border-slate-150 rounded-[18px] p-4 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => alert('Collecting Payment...')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-3xs"
          >
            <Plus className="h-4.5 w-4.5 text-[#5B5CEB]" />
            Collect Payment
          </button>
          <button
            onClick={() => alert('Viewing selected bill...')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs shadow-3xs"
          >
            View Bill
          </button>
          <button
            onClick={() => alert('Showing payment history...')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-3xs"
          >
            <History className="h-4 w-4" />
            Payment History
          </button>
          <button
            onClick={() => alert('Downloading report...')}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-3xs"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>

        <button
          onClick={() => alert('Reminders sent to outstanding residents!')}
          className="px-5 py-2.5 bg-[#5B5CEB] hover:bg-[#494abf] text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1.5 transition-colors"
        >
          <Send className="h-4 w-4" />
          Send Reminder
        </button>
      </div>

      {/* BILL DETAILS MODAL */}
      {showBillModal && selectedBillItem && (() => {
        const payments = getBillPayments(selectedBillItem, selectedMonth);
        const billingPeriod = (() => {
          const parts = selectedMonth.split('-');
          if (parts.length === 2) {
            const [year, month] = parts;
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${months[parseInt(month, 10) - 1]} ${year}`;
          }
          return selectedMonth;
        })();
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-150 rounded-[24px] shadow-2xl p-6 w-full max-w-3xl text-left relative flex flex-col max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    Bill Details — Flat A-{selectedBillItem.number}
                  </h3>
                  <div className="flex gap-3 text-xs text-slate-500 font-medium mt-1">
                    <span>Billing Month: <strong className="text-[#5B5CEB]">{billingPeriod}</strong></span>
                    <span>Due Date: <strong className="text-rose-600">10 Jan 2026</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedBillItem.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                    selectedBillItem.status === 'Partial' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                    {selectedBillItem.status === 'Paid' ? 'COMPLETED' : 'PENDING'}
                  </span>
                  <button
                    onClick={() => setShowBillModal(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="my-4 space-y-4">
                
                {/* 1. Charges and Arrears Cards */}
                <div className="bill-modal-grid">
                  
                  {/* Current Month Charges Card */}
                  <div className="bill-modal-card bill-modal-card-blue">
                    <div className="bill-modal-card-header text-blue-800">
                      <FileText className="h-4 w-4 mr-2" /> CURRENT MONTH CHARGES
                    </div>
                    <div className="bill-modal-row">
                      <span>Water Cost</span>
                      <span className="font-semibold">₹{payments.waterCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Maintenance Charges</span>
                      <span className="font-semibold">₹{payments.maintenance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bill-modal-row bill-modal-row-total border-blue-200">
                      <span>Current Month Total</span>
                      <span className="text-blue-800 font-extrabold">₹{(payments.waterCost + payments.maintenance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Previous Arrears Card */}
                  <div className="bill-modal-card bill-modal-card-orange">
                    <div className="bill-modal-card-header text-orange-700">
                      <History className="h-4 w-4 mr-2" /> PREVIOUS ARREARS
                    </div>
                    <div className="bill-modal-row">
                      <span>Resident Arrear</span>
                      <span className="font-semibold">₹{payments.residentArrear.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Owner Arrear</span>
                      <span className="font-semibold">₹{payments.ownerArrear.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bill-modal-row bill-modal-row-total border-orange-200">
                      <span>Total Arrear</span>
                      <span className="text-orange-700 font-extrabold">₹{(payments.residentArrear + payments.ownerArrear).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                </div>

                {/* 2. Total Payable Banner */}
                <div className="bill-modal-payable-banner">
                  <span className="font-bold text-slate-600 text-sm">TOTAL PAYABLE</span>
                  <span className="font-black text-lg text-[#5B5CEB]">
                    ₹{payments.totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* 3. Payment Details */}
                <div className="section-title">PAYMENT DETAILS</div>
                <div className="bill-modal-grid">
                  
                  {/* Resident Payment Details */}
                  <div className="bill-modal-card bill-modal-card-green">
                    <div className="bill-modal-card-header text-green-700">
                      <div className="badge-paidby-resident w-6 h-6 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs">👤</span>
                      </div>
                      RESIDENT PAYMENT
                    </div>
                    <div className="bill-modal-row">
                      <span>Amount Paid</span>
                      <span className="font-bold text-green-750">₹{payments.resPayment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Payment Mode</span>
                      <span className="badge-mode badge-upi">{payments.resPayment.mode}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Transaction ID</span>
                      <span className="font-medium">{payments.resPayment.txId}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Payment Date</span>
                      <span className="font-medium">{payments.resPayment.date}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Remarks</span>
                      <span className="text-slate-450">{payments.resPayment.remarks}</span>
                    </div>
                  </div>

                  {/* Owner Payment Details */}
                  <div className="bill-modal-card bill-modal-card-blue">
                    <div className="bill-modal-card-header text-blue-700">
                      <div className="badge-paidby-owner w-6 h-6 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs">👤</span>
                      </div>
                      OWNER PAYMENT
                    </div>
                    <div className="bill-modal-row">
                      <span>Amount Paid</span>
                      <span className="font-bold text-blue-700">₹{payments.ownPayment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Payment Mode</span>
                      <span className="badge-mode badge-bank">{payments.ownPayment.mode}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Transaction ID</span>
                      <span className="font-medium">{payments.ownPayment.txId}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Payment Date</span>
                      <span className="font-medium">{payments.ownPayment.date}</span>
                    </div>
                    <div className="bill-modal-row">
                      <span>Remarks</span>
                      <span className="text-slate-450">{payments.ownPayment.remarks}</span>
                    </div>
                  </div>

                </div>

                {/* 4. Payment History */}
                <div className="section-title">PAYMENT HISTORY</div>
                <table className="bill-modal-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Paid By</th>
                      <th>Payment Mode</th>
                      <th>Amount (₹)</th>
                      <th>Transaction ID / Reference</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.history.map((h, i) => (
                      <tr key={i}>
                        <td>{h.date}</td>
                        <td>
                          <span className={h.paidBy === 'Resident' ? 'badge-paidby-resident' : 'badge-paidby-owner'} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            {h.paidBy}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-mode ${h.mode === 'UPI' ? 'badge-upi' : h.mode === 'Bank Transfer' ? 'badge-bank' : h.mode === 'Cash' ? 'badge-cash' : 'badge-card'}`}>
                            {h.mode}
                          </span>
                        </td>
                        <td className="font-semibold">{h.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{h.txId}</td>
                        <td className="text-slate-400">{h.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 5. Payment Summary */}
                <div className="section-title">PAYMENT SUMMARY</div>
                <div className="bill-modal-summary-grid">
                  <div className="bill-modal-summary-card">
                    <span className="text-slate-500 font-medium text-[11.5px]">Paid by Resident</span>
                    <div className="value text-green-700">
                      ₹{payments.resPayment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bill-modal-summary-card">
                    <span className="text-slate-500 font-medium text-[11.5px]">Paid by Owner</span>
                    <div className="value text-blue-700">
                      ₹{payments.ownPayment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bill-modal-summary-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <span className="text-green-700 font-medium text-[11.5px]">Total Paid</span>
                    <div className="value text-green-800">
                      ₹{payments.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bill-modal-summary-card" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                    <span className="text-rose-700 font-medium text-[11.5px]">Outstanding Balance</span>
                    <div className="value text-rose-800">
                      ₹{payments.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* 6. Next Month Arrears */}
                <div className="section-title">NEXT MONTH ARREARS</div>
                <div className="bill-modal-arrears-grid">
                  <div className="bill-modal-card bill-modal-card-blue flex justify-between items-center">
                    <span className="font-semibold text-slate-500 text-xs">Owner Arrear (Next Month)</span>
                    <span className="font-black text-slate-800 text-sm">
                      ₹{payments.nextOwnArrear.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bill-modal-card bill-modal-card-green flex justify-between items-center" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                    <span className="font-semibold text-rose-700 text-xs">Resident Arrear (Next Month)</span>
                    <span className="font-black text-rose-800 text-sm">
                      ₹{payments.nextResArrear.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex justify-center gap-4 border-t border-slate-100 pt-3">
                <button
                  onClick={() => alert(`📥 Invoice downloaded for Apartment ${selectedBillItem.number}`)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-[140px]"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-[140px]"
                >
                  <Printer className="h-4 w-4" />
                  Print Bill
                </button>
                <button
                  onClick={() => setShowBillModal(false)}
                  className="px-5 py-2.5 bg-[#5B5CEB] hover:bg-[#494abf] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer min-w-[140px]"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-150 rounded-[24px] shadow-2xl p-6 w-full max-w-md text-left relative flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Record Payment</h3>
              <button
                onClick={handleCancelRecordPayment}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Paid By</label>
                <select
                  value={recordModalData.paidBy}
                  onChange={(e) => setRecordModalData(prev => ({ ...prev, paidBy: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#5B5CEB] bg-white text-slate-700 font-bold h-9"
                >
                  <option value="Resident">Resident</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={recordModalData.amount}
                    onChange={(e) => setRecordModalData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#5B5CEB] text-slate-800 font-bold h-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Mode</label>
                <select
                  value={recordModalData.mode}
                  onChange={(e) => setRecordModalData(prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#5B5CEB] bg-white text-slate-700 font-bold h-9"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Date</label>
                <input
                  type="date"
                  value={recordModalData.date}
                  onChange={(e) => setRecordModalData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#5B5CEB] text-slate-800 font-bold h-9 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Transaction ID / Reference {recordModalData.mode === 'Cash' ? '(Optional)' : ''}
                </label>
                <input
                  type="text"
                  value={recordModalData.txId}
                  onChange={(e) => setRecordModalData(prev => ({ ...prev, txId: e.target.value }))}
                  placeholder={recordModalData.mode === 'Cash' ? 'e.g. CASH001' : 'e.g. UPI456789 / UTR / Txn ID'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#5B5CEB] text-slate-800 font-bold h-9"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Remarks</label>
                <input
                  type="text"
                  value={recordModalData.remarks}
                  onChange={(e) => setRecordModalData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="e.g. Paid in full"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#5B5CEB] text-slate-800 font-bold h-9"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-3">
              <button
                onClick={handleCancelRecordPayment}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecordPayment}
                className="px-5 py-2 bg-[#5B5CEB] hover:bg-[#494abf] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

