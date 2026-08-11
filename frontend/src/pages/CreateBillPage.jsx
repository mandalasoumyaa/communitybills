import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  Calendar, 
  CheckSquare, 
  ChevronDown, 
  ChevronUp,
  Download, 
  FileSpreadsheet, 
  FileText, 
  Info, 
  Search, 
  Square,
  Eye,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  User,
  ShieldAlert,
  Send,
  MoreVertical,
  PlusCircle,
  FileDown
} from 'lucide-react';
import * as api from '../services/communityApi';

export default function CreateBillPage({ towersList = [], flatsList = [], addLog, sharedMonth, setSharedMonth }) {
  const [selectedTower, setSelectedTower] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(sharedMonth || '2026-05');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [dueDate, setDueDate] = useState('2026-06-15');

  // Accordion state - holds the ID of the currently expanded row
  const [expandedFlatId, setExpandedFlatId] = useState(null);

  // Synchronize local selectedMonth with parent sharedMonth
  useEffect(() => {
    if (sharedMonth && selectedMonth !== sharedMonth) {
      setSelectedMonth(sharedMonth);
    }
  }, [sharedMonth]);

  // Update parent sharedMonth when selectedMonth changes locally
  useEffect(() => {
    if (setSharedMonth && selectedMonth && sharedMonth !== selectedMonth) {
      setSharedMonth(selectedMonth);
    }
  }, [selectedMonth, sharedMonth, setSharedMonth]);
  
  // Track selected flats for bulk generation
  const [selectedFlatIds, setSelectedFlatIds] = useState(new Set());
  
  // Track pagination state (8 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  
  // Track generated statuses in-memory
  const [generatedBills, setGeneratedBills] = useState(new Set());

  const [waterReadings, setWaterReadings] = useState([]);

  // Fetch water readings when selectedMonth changes
  useEffect(() => {
    async function loadWaterReadings() {
      try {
        const parts = selectedMonth.split('-');
        if (parts.length === 2) {
          const [year, month] = parts;
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = months[parseInt(month, 10) - 1];
          const formattedMonth = `${monthName} ${year}`;
          const res = await api.fetchWaterReadings(formattedMonth, '', 'All', 'All', 'apartment_number', 'asc', 0, 1000);
          setWaterReadings(res.items || []);
        }
      } catch (err) {
        console.error('Failed to load water readings:', err);
      }
    }
    loadWaterReadings();
  }, [selectedMonth]);

  // Generate realistic data for each flat
  const flatData = useMemo(() => {
    const list = flatsList || [];
    return list.map((flat, idx) => {
      if (!flat) return null;
      const isOccupied = flat.status === 'Occupied';
      
      const getOccupancyType = (f) => {
        if (f.status !== 'Occupied') return 'Owner';
        if (f.occupants_count === 2 || f.occupants_count === '2') return 'Tenant';
        if (f.occupants_count === 1 || f.occupants_count === '1') return 'Owner';
        const name = f.resident_name || '';
        if (name.includes('Sharma') || name.includes('Mehta') || f.number === 'A-102' || f.number === 'A-103') {
          return 'Tenant';
        }
        return 'Owner';
      };

      let residentType = getOccupancyType(flat);
      let residentName = flat.resident_name || '';
      let residentPhone = flat.resident_phone || '';
      
      if (!residentName && isOccupied) {
        if (flat.number === 'A-101' || idx === 0) {
          residentName = 'Rahul Kumar';
        } else if (flat.number === 'A-102' || idx === 1) {
          residentName = 'Neha Sharma';
        } else if (flat.number === 'A-103' || idx === 2) {
          residentName = 'Karan Mehta';
        } else if (flat.number === 'A-104' || idx === 3) {
          residentName = 'Pooja Iyer';
        } else if (flat.number === 'A-105' || idx === 4) {
          residentName = 'Anjali Gupta';
        } else {
          residentName = `Resident ${flat.number}`;
        }
      } else if (!isOccupied) {
        residentName = 'Vacant Flat';
      }

      if (!residentPhone && isOccupied) {
        residentPhone = `98765 ${43200 + idx}`;
      } else if (!isOccupied) {
        residentPhone = 'N/A';
      }

      // Check database readings for this month
      const dbReading = waterReadings.find(r => r.apartment_id === flat.id || r.apartment_number === flat.number);
      const hasDbReading = dbReading && dbReading.current_reading !== null;
      const dbWaterCost = hasDbReading ? dbReading.water_cost : 0;

      let waterCost = dbWaterCost || ((flat.id * 110) % 400 + 150);
      let maintenance = isOccupied ? 3000 : 1200;
      let residentArrears = 0;
      let ownerArrears = 0;
      let residentPaid = 0;
      let ownerPaid = 0;

      // Seed realistic charges and payments
      const flatNumDigits = parseInt((flat.number || '').replace(/\D/g, '')) || 101;
      if (isOccupied) {
        if (residentType === 'Tenant') {
          residentArrears = flatNumDigits % 7 === 0 ? 1200 : 0;
          ownerArrears = flatNumDigits % 11 === 0 ? 800 : 0;
          // Set paid amounts based on status
          if (flatNumDigits % 3 === 0) { // fully paid
            residentPaid = waterCost + maintenance + residentArrears;
            ownerPaid = ownerArrears;
          } else if (flatNumDigits % 3 === 1) { // partially paid
            residentPaid = Math.round((waterCost + maintenance) * 0.5);
            ownerPaid = 0;
          } else { // unpaid
            residentPaid = 0;
            ownerPaid = 0;
          }
        } else {
          // Resident is Owner
          residentArrears = flatNumDigits % 9 === 0 ? 1500 : 0;
          if (flatNumDigits % 2 === 0) {
            residentPaid = waterCost + maintenance + residentArrears;
          } else if (flatNumDigits % 5 === 0) {
            residentPaid = 1000;
          } else {
            residentPaid = 0;
          }
        }
      }

      const currentCharges = waterCost + maintenance;
      const totalResidentPayable = currentCharges + residentArrears;
      const totalOwnerPayable = ownerArrears; // typically owner covers property-wide arrears if separate
      const residentBalance = totalResidentPayable - residentPaid;
      const ownerBalance = totalOwnerPayable - ownerPaid;
      const totalOutstanding = residentBalance + ownerBalance;

      // Status determination
      let status = 'Pending';
      if (totalOutstanding === 0) {
        status = 'Paid';
      } else if (residentPaid > 0 || ownerPaid > 0) {
        status = 'Partial';
      } else if (flatNumDigits % 7 === 1) {
        status = 'Overdue';
      }

      // Calculate progress percentages
      const resProgress = totalResidentPayable > 0 ? Math.round((residentPaid / totalResidentPayable) * 100) : 100;
      const ownerProgress = totalOwnerPayable > 0 ? Math.round((ownerPaid / totalOwnerPayable) * 100) : 100;

      const key = `${flat.id}-${selectedMonth}`;
      const isGenerated = generatedBills.has(key);
      const tower = (towersList || []).find(t => t && t.id === flat.tower_id);
      const towerName = tower ? tower.name : 'Unknown';

      return {
        id: flat.id,
        number: flat.number || 'Unknown',
        residentName,
        residentPhone,
        residentType,
        isOccupied,
        waterCost,
        maintenance,
        currentCharges,
        residentArrears,
        ownerArrears,
        totalResidentPayable,
        totalOwnerPayable,
        residentPaid,
        ownerPaid,
        residentBalance,
        ownerBalance,
        totalOutstanding,
        resProgress,
        ownerProgress,
        status,
        isGenerated,
        towerId: flat.tower_id,
        towerName
      };
    }).filter(Boolean);
  }, [flatsList, towersList, selectedMonth, generatedBills, waterReadings]);

  // Filters logic
  const filteredFlats = useMemo(() => {
    return flatData.filter(flat => {
      const matchesTower = selectedTower === 'All' || flat.towerId === parseInt(selectedTower);
      const matchesStatus = selectedStatusFilter === 'All' || flat.status === selectedStatusFilter;
      const matchesSearch = 
        flat.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flat.residentName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTower && matchesStatus && matchesSearch;
    });
  }, [flatData, selectedTower, selectedStatusFilter, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTower, selectedStatusFilter, searchTerm]);

  // Paginated list (8 items per page)
  const paginatedFlats = useMemo(() => {
    return filteredFlats.slice((currentPage - 1) * 8, currentPage * 8);
  }, [filteredFlats, currentPage]);

  const totalPages = Math.ceil(filteredFlats.length / 8);

  // Summary counts
  const summaryKpis = useMemo(() => {
    const total = flatData.length;
    const pending = flatData.filter(f => f.status === 'Pending' || f.status === 'Overdue').length;
    const generated = flatData.filter(f => f.isGenerated).length;
    const totalAmount = flatData.reduce((sum, f) => sum + f.currentCharges, 0);
    const paidSum = flatData.reduce((sum, f) => sum + f.residentPaid + f.ownerPaid, 0);
    const collectionRate = totalAmount > 0 ? Math.round((paidSum / totalAmount) * 100) : 0;

    return {
      total,
      pending,
      generated,
      totalAmount,
      collectionRate
    };
  }, [flatData]);

  // Checkbox functions
  const handleSelectAll = () => {
    if (selectedFlatIds.size === filteredFlats.length) {
      setSelectedFlatIds(new Set());
    } else {
      setSelectedFlatIds(new Set(filteredFlats.map(f => f.id)));
    }
  };

  const handleToggleSelect = (id) => {
    const next = new Set(selectedFlatIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedFlatIds(next);
  };

  const handleGenerateAll = () => {
    const nextGenerated = new Set(generatedBills);
    flatData.forEach(f => {
      nextGenerated.add(`${f.id}-${selectedMonth}`);
    });
    setGeneratedBills(nextGenerated);
    if (addLog) {
      addLog(`Generated all individual bills for cycle ${selectedMonth}`);
    }
    alert(`Successfully generated bills for all ${flatData.length} flats!`);
  };

  const handleGenerateSelected = () => {
    if (selectedFlatIds.size === 0) {
      alert('Please select at least one flat.');
      return;
    }
    const nextGenerated = new Set(generatedBills);
    selectedFlatIds.forEach(id => {
      nextGenerated.add(`${id}-${selectedMonth}`);
    });
    setGeneratedBills(nextGenerated);
    if (addLog) {
      addLog(`Generated ${selectedFlatIds.size} bills for ${selectedMonth}`);
    }
    setSelectedFlatIds(new Set());
    alert(`Generated bills for ${selectedFlatIds.size} selected flats successfully!`);
  };

  const handleToggleRow = (id) => {
    setExpandedFlatId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-none text-slate-800 font-sans antialiased bg-slate-50/30 p-2 min-h-screen">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">Create Individual Bills</h2>
          <p className="text-slate-500 text-xs mt-0.5">Generate and manage apartment bills for every flat.</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-[14px] px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            <Calendar className="h-4 w-4 text-[#5B5CEB]" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-none bg-transparent outline-none cursor-pointer font-bold text-slate-800"
            />
          </div>

          <button 
            onClick={handleGenerateAll}
            className="flex items-center gap-1.5 bg-[#5B5CEB] hover:bg-[#494abf] text-white font-bold px-4 py-2 rounded-[14px] shadow-sm text-xs transition-colors"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Generate All Bills
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS (5 cards total) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Flats */}
        <div className="bg-white border border-slate-100 rounded-[18px] p-4 shadow-sm flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Flats</span>
            <Building className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 leading-none">{summaryKpis.total}</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="font-semibold text-emerald-600">+2 new</span> this month
            </div>
          </div>
        </div>

        {/* Bills Pending */}
        <div className="bg-white border border-slate-100 rounded-[18px] p-4 shadow-sm flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bills Pending</span>
            <ShieldAlert className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 leading-none">{summaryKpis.pending}</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
              <TrendingDown className="h-3 w-3 text-rose-500" />
              <span className="font-semibold text-rose-600">-12% decrease</span>
            </div>
          </div>
        </div>

        {/* Bills Generated */}
        <div className="bg-white border border-slate-100 rounded-[18px] p-4 shadow-sm flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bills Generated</span>
            <FileText className="h-4 w-4 text-[#5B5CEB]" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 leading-none">{summaryKpis.generated}</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
              <span className="font-bold text-emerald-500">✓ Ready to send</span>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-white border border-slate-100 rounded-[18px] p-4 shadow-sm flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Amount</span>
            <span className="text-xs font-bold text-indigo-500">₹</span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 leading-none">₹{summaryKpis.totalAmount.toLocaleString('en-IN')}</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
              <span className="font-bold text-slate-500">Current cycle</span>
            </div>
          </div>
        </div>

        {/* Collection Progress */}
        <div className="bg-white border border-slate-100 rounded-[18px] p-4 shadow-sm flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collection Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 leading-none">{summaryKpis.collectionRate}%</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
              <span className="font-bold text-emerald-500">↑ Up 5%</span> vs last month
            </div>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white border border-slate-150 rounded-[18px] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Tower Dropdown */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Tower</label>
            <select
              value={selectedTower}
              onChange={(e) => setSelectedTower(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#5B5CEB] bg-white font-medium text-slate-700"
            >
              <option value="All">All Towers</option>
              {towersList.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Billing Month */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Billing Month</label>
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#5B5CEB] bg-white font-medium text-slate-700"
            />
          </div>

          {/* Resident Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Search Resident</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search flat or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#5B5CEB] text-slate-800"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Status</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#5B5CEB] bg-white font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Due Date */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#5B5CEB] bg-white font-medium text-slate-700"
            />
          </div>

          {/* Generate Bills Button */}
          <div className="self-end">
            <button
              onClick={handleGenerateSelected}
              disabled={selectedFlatIds.size === 0}
              className="bg-[#5B5CEB] hover:bg-[#494abf] text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Generate Bills
            </button>
          </div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white border border-slate-150 rounded-[18px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 pl-4 w-10">
                  <button onClick={handleSelectAll} className="focus:outline-none">
                    {selectedFlatIds.size === filteredFlats.length ? (
                      <CheckSquare className="h-4 w-4 text-[#5B5CEB]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 font-bold text-slate-500">Flat</th>
                <th className="py-3.5 font-bold text-slate-500">Resident</th>
                <th className="py-3.5 font-bold text-slate-500 text-right">Current Charges</th>
                <th className="py-3.5 font-bold text-slate-500">Outstanding</th>
                <th className="py-3.5 font-bold text-slate-500">Payment Progress</th>
                <th className="py-3.5 font-bold text-slate-500 text-center">Status</th>
                <th className="py-3.5 pr-4 font-bold text-slate-500 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedFlats.map((flat) => {
                const isSelected = selectedFlatIds.has(flat.id);
                const isExpanded = expandedFlatId === flat.id;

                return (
                  <React.Fragment key={flat.id}>
                    {/* Row Item */}
                    <tr 
                      onClick={() => handleToggleRow(flat.id)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/50' : ''}`}
                    >
                      <td className="py-4 pl-4" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleToggleSelect(flat.id)} className="focus:outline-none">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#5B5CEB]" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-4">
                        <div className="font-bold text-slate-900 text-sm">{flat.number}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{flat.towerName}</div>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-slate-800">{flat.residentName}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{flat.residentPhone}</div>
                      </td>
                      <td className="py-4 text-right font-extrabold text-slate-800 text-sm">
                        ₹{flat.currentCharges.toLocaleString('en-IN')}
                      </td>
                      
                      {/* Outstanding Column - Mini Widget */}
                      <td className="py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="p-2 border border-slate-100 bg-slate-50/85 rounded-xl space-y-1 max-w-[160px] shadow-2xs">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">Res</span>
                            <span className="font-semibold text-slate-700">₹{flat.residentBalance.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">Owner</span>
                            <span className="font-semibold text-slate-700">₹{flat.ownerBalance.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="border-t border-slate-200/60 pt-1 flex justify-between items-center text-[10px] font-extrabold text-slate-900">
                            <span>Total</span>
                            <span>₹{flat.totalOutstanding.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </td>

                      {/* Payment Progress Column */}
                      <td className="py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1.5 max-w-[180px]">
                          <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
                            <span>Res</span>
                            <div className="flex items-center gap-1.5 w-24">
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    flat.resProgress === 100 ? 'bg-emerald-500' :
                                    flat.resProgress > 0 ? 'bg-orange-500' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${flat.resProgress}%` }}
                                ></div>
                              </div>
                              <span className="font-bold">{flat.resProgress}%</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
                            <span>Owner</span>
                            <div className="flex items-center gap-1.5 w-24">
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    flat.ownerProgress === 100 ? 'bg-emerald-500' :
                                    flat.ownerProgress > 0 ? 'bg-orange-500' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${flat.ownerProgress}%` }}
                                ></div>
                              </div>
                              <span className="font-bold">{flat.ownerProgress}%</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          flat.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                          flat.status === 'Partial' ? 'bg-orange-50 text-orange-700' :
                          flat.status === 'Overdue' ? 'bg-rose-50 text-rose-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {flat.status}
                        </span>
                      </td>

                      {/* Action Column */}
                      <td className="py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => alert(`Previewing bill for Flat ${flat.number}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const next = new Set(generatedBills);
                              next.add(`${flat.id}-${selectedMonth}`);
                              setGeneratedBills(next);
                              alert(`Bill generated for Flat ${flat.number}!`);
                            }}
                            className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-[#5B5CEB] text-slate-600 hover:text-[#5B5CEB] rounded-lg font-bold text-[10px] transition-colors"
                          >
                            Generate
                          </button>
                          <button className="p-1 text-slate-400 hover:text-slate-600">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Accordion Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="8" className="bg-slate-50/45 p-4 border-t border-b border-slate-100/60">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              
                              {/* Card 1: Resident Summary */}
                              <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                      <User className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-slate-900 text-xs">Resident Summary</span>
                                  </div>
                                  <div className="space-y-1.5 text-[11px] text-slate-500">
                                    <div className="flex justify-between">
                                      <span>Current Charges:</span>
                                      <span className="font-semibold text-slate-700">₹{flat.currentCharges}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Previous Arrears:</span>
                                      <span className="font-semibold text-slate-700">₹{flat.residentArrears}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-slate-700">
                                      <span>Total Due:</span>
                                      <span>₹{flat.totalResidentPayable}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600">
                                      <span>Paid by Resident:</span>
                                      <span className="font-bold">₹{flat.residentPaid}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-100 pt-1.5 text-xs">
                                      <span className="font-bold text-slate-800">Balance:</span>
                                      <span className="font-bold text-rose-600">₹{flat.residentBalance}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                  <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Remaining</div>
                                    <div className="text-lg font-black text-rose-600">₹{flat.residentBalance}</div>
                                  </div>
                                  <button 
                                    onClick={() => alert(`Showing history for Resident of Flat ${flat.number}`)}
                                    className="text-[10px] font-bold text-[#5B5CEB] hover:underline"
                                  >
                                    View Resident History →
                                  </button>
                                </div>
                              </div>

                              {/* Card 2: Owner Summary */}
                              <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                      <Building className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-slate-900 text-xs">Owner Summary</span>
                                  </div>
                                  <div className="space-y-1.5 text-[11px] text-slate-500">
                                    <div className="flex justify-between">
                                      <span>Owner Arrears:</span>
                                      <span className="font-semibold text-slate-700">₹{flat.ownerArrears}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Owner Charges:</span>
                                      <span className="font-semibold text-slate-700">₹0</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-slate-700">
                                      <span>Total Due:</span>
                                      <span>₹{flat.totalOwnerPayable}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600">
                                      <span>Paid by Owner:</span>
                                      <span className="font-bold">₹{flat.ownerPaid}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-100 pt-1.5 text-xs">
                                      <span className="font-bold text-slate-800">Balance:</span>
                                      <span className="font-bold text-rose-600">₹{flat.ownerBalance}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                  <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Remaining</div>
                                    <div className="text-lg font-black text-rose-600">₹{flat.ownerBalance}</div>
                                  </div>
                                  <button 
                                    onClick={() => alert(`Showing history for Owner of Flat ${flat.number}`)}
                                    className="text-[10px] font-bold text-[#5B5CEB] hover:underline"
                                  >
                                    View Owner History →
                                  </button>
                                </div>
                              </div>

                              {/* Card 3: Payment Timeline */}
                              <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-2xs">
                                <span className="font-bold text-slate-900 text-xs block pb-2 border-b border-slate-100">Payment Timeline</span>
                                <div className="mt-3 relative pl-4 border-l border-slate-200 space-y-3 text-[10px] text-slate-500">
                                  
                                  <div className="relative">
                                    <span className="absolute -left-[20.5px] top-0.5 bg-indigo-500 text-white rounded-full p-0.5 text-[8px]">✓</span>
                                    <div className="font-semibold text-slate-800">April Bill Generated</div>
                                    <div className="text-[9px] text-slate-400">10 Apr 2026</div>
                                  </div>

                                  <div className="relative">
                                    <span className="absolute -left-[20.5px] top-0.5 bg-emerald-500 text-white rounded-full p-0.5 text-[8px]">✓</span>
                                    <div className="font-semibold text-slate-800">Payment Received</div>
                                    <div className="text-[9px] text-slate-400">18 Apr 2026</div>
                                  </div>

                                  <div className="relative">
                                    <span className="absolute -left-[20.5px] top-0.5 bg-orange-500 text-white rounded-full p-0.5 text-[8px]">!</span>
                                    <div className="font-semibold text-slate-800">Reminder Sent</div>
                                    <div className="text-[9px] text-slate-400">02 May 2026</div>
                                  </div>

                                  <div className="relative">
                                    <span className="absolute -left-[20.5px] top-0.5 bg-blue-500 text-white rounded-full p-0.5 text-[8px]">i</span>
                                    <div className="font-semibold text-slate-800">May Bill Generated</div>
                                    <div className="text-[9px] text-slate-400">10 May 2026</div>
                                  </div>

                                  <div className="relative">
                                    <span className="absolute -left-[20.5px] top-0.5 bg-rose-500 text-white rounded-full p-0.5 text-[8px]">?</span>
                                    <div className="font-semibold text-slate-800">Pending Payment</div>
                                    <div className="text-[9px] text-slate-400">Due 15 Jun 2026</div>
                                  </div>

                                </div>
                              </div>

                            </div>

                            {/* Bottom Card Summary & Quick Action Buttons */}
                            <div className="bg-slate-100/60 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                              <div className="flex gap-4 text-xs font-semibold text-slate-700">
                                <div>
                                  Resident Due: <span className="font-bold text-rose-600">₹{flat.residentBalance}</span>
                                </div>
                                <div>
                                  Owner Due: <span className="font-bold text-rose-600">₹{flat.ownerBalance}</span>
                                </div>
                                <div className="border-l border-slate-300 pl-4">
                                  Total Outstanding: <span className="font-extrabold text-slate-900">₹{flat.totalOutstanding}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button 
                                  onClick={() => alert(`PDF generated for Flat ${flat.number}`)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-2xs"
                                >
                                  <FileDown size={12} />
                                  Generate PDF
                                </button>
                                <button 
                                  onClick={() => alert(`WhatsApp reminder sent to ${flat.residentName}`)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-2xs"
                                >
                                  <Send size={12} className="text-[#5B5CEB]" />
                                  WhatsApp Reminder
                                </button>
                                <button 
                                  onClick={() => alert(`Bill file downloaded for Flat ${flat.number}`)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-2xs"
                                >
                                  <Download size={12} />
                                  Download Bill
                                </button>
                                <button 
                                  onClick={() => alert(`Recording payment of Flat ${flat.number}`)}
                                  className="px-3.5 py-1.5 bg-[#5B5CEB] hover:bg-[#494abf] text-white font-bold rounded-lg text-[10px] shadow-2xs"
                                >
                                  Record Payment
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION & INFO SECTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 mt-2 gap-4 px-4 pb-2">
          <div className="text-[11px] text-slate-400 font-bold">
            Showing {(currentPage - 1) * 8 + 1}–{Math.min(currentPage * 8, filteredFlats.length)} of {filteredFlats.length} flats
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  type="button"
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#5B5CEB] text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 bg-white border border-slate-150 rounded-[18px] p-4 shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={handleSelectAll} 
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs shadow-2xs"
          >
            Select All
          </button>
          <button 
            onClick={handleGenerateSelected}
            disabled={selectedFlatIds.size === 0}
            className="px-3.5 py-1.5 bg-[#5B5CEB] hover:bg-[#494abf] text-white font-bold rounded-xl text-xs shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Selected Bills
          </button>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => alert('Summary Download Started')}
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download Summary
          </button>
          <button 
            onClick={() => alert('Excel Export Completed')}
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            Export Excel
          </button>
        </div>
      </div>

    </div>
  );
}
