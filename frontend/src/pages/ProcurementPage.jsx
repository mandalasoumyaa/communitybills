import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  PlusCircle,
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Eye,
  Calendar,
  ChevronDown,
  Search,
  Filter,
  MoreVertical,
  Building,
  HardHat,
  User,
  Users,
  ArrowLeft,
  DollarSign,
  Wallet,
  Clock,
  Check,
  Info
} from 'lucide-react';

export default function ProcurementPage({ addLog }) {
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'add_procurement'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All Outstanding');
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  // Form Mode selection: 'Purchase', 'Employee Advance', 'Contractor Advance'
  const [procurementType, setProcurementType] = useState('Employee Advance');

  // Main outstanding items state list
  const [items, setItems] = useState([]);

  // Aggregate stats
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [vendorDue, setVendorDue] = useState(0);
  const [contractorDue, setContractorDue] = useState(0);
  const [employeeDue, setEmployeeDue] = useState(0);
  const [installmentDue, setInstallmentDue] = useState(0);

  // Recalculate summary totals whenever items list changes
  useEffect(() => {
    let tot = 0;
    let vDue = 0;
    let cDue = 0;
    let eDue = 0;

    items.forEach(item => {
      if (item.type === 'Vendor') {
        vDue += item.balance;
        tot += item.balance;
      }
      else if (item.type === 'Contractor') {
        cDue += item.balance;
        tot += item.balance;
      }
      else if (item.type === 'Employee Advance') {
        eDue += item.balance;
        tot += item.balance;
      }
    });

    setTotalOutstanding(tot);
    setVendorDue(vDue);
    setContractorDue(cDue);
    setEmployeeDue(eDue);
  }, [items]);

  // Purchase Form State
  const [formBasic, setFormBasic] = useState({
    name: "",
    category: "",
    vendor: "",
    purchaseType: "Goods",
    purchaseDate: "2026-05-05",
    expectedDeliveryDate: ""
  });

  const [formItem, setFormItem] = useState({
    description: "",
    qty: "",
    unit: "Units",
    unitPrice: ""
  });

  const [formPayment, setFormPayment] = useState({
    paymentType: "Full Payment",
    advancePaid: "",
    paymentStatus: "Pending",
    paymentMethod: "Bank Transfer",
    paymentDate: "2026-08-06",
    transactionId: ""
  });

  const [formDelivery, setFormDelivery] = useState({
    deliveryStatus: "Ordered",
    deliveryDate: "",
    receivedBy: ""
  });

  const [formDocs, setFormDocs] = useState({
    quotation: null,
    invoice: null,
    purchaseOrder: null,
    warranty: null
  });

  const [formNotes, setFormNotes] = useState({
    remarks: "",
    internalNotes: ""
  });

  // Employee Advance Form State
  const [formEmpAdv, setFormEmpAdv] = useState({
    employeeName: "",
    department: "",
    monthlySalary: "",
    advanceAmount: "",
    monthlyDeduction: "",
    recoveryStartMonth: "",
    paymentMethod: "",
    reason: "",
    notes: ""
  });

  // Contractor Advance Form State
  const [formContAdv, setFormContAdv] = useState({
    contractorName: "",
    category: "",
    projectValue: "",
    advanceAmount: "",
    monthlyDeduction: "",
    recoveryStartMonth: "August 2026",
    paymentMethod: "Bank Transfer",
    reason: "",
    notes: ""
  });

  const purchaseCost = (parseFloat(formItem.qty) || 0) * (parseFloat(formItem.unitPrice) || 0);
  const [installments, setInstallments] = useState([]);
  const totalInstallmentsAmount = installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0);
  const purchaseBalance = purchaseCost - totalInstallmentsAmount - (parseFloat(formPayment.advancePaid) || 0);
  const remainingInstallmentBalance = purchaseCost - totalInstallmentsAmount;

  const handleAddInstallmentRow = () => {
    const enteredAmount = parseFloat(formPayment.advancePaid) || 0;
    if (enteredAmount <= 0) {
      alert("Please enter a Paid Amount greater than 0 to add as an installment.");
      return;
    }

    const nextNum = installments.length + 1;
    const suffix = nextNum === 1 ? "st" : nextNum === 2 ? "nd" : nextNum === 3 ? "rd" : "th";
    setInstallments([
      ...installments,
      {
        id: Date.now(),
        name: `${nextNum}${suffix} Installment`,
        dueDate: formPayment.paymentDate || "2026-08-06",
        amount: enteredAmount,
        method: formPayment.paymentMethod || "Bank Transfer",
        status: formPayment.paymentStatus || "Paid"
      }
    ]);

    // Reset inputs
    setFormPayment({
      paymentType: "Installments",
      advancePaid: "",
      paymentStatus: "Pending",
      paymentMethod: "Bank Transfer",
      paymentDate: "2026-08-06",
      transactionId: ""
    });
  };

  const handleUpdateInstallmentRow = (id, field, value) => {
    setInstallments(installments.map(inst => inst.id === id ? { ...inst, [field]: value } : inst));
  };

  const handleDeleteInstallmentRow = (id) => {
    setInstallments(installments.filter(inst => inst.id !== id));
  };

  // Dynamic Timeline Calculator for Employee & Contractor Advance
  const getTimeline = (type) => {
    const isEmp = type === 'employee';
    const amountVal = isEmp ? parseFloat(formEmpAdv.advanceAmount) : parseFloat(formContAdv.advanceAmount);
    const deductionVal = isEmp ? parseFloat(formEmpAdv.monthlyDeduction) : parseFloat(formContAdv.monthlyDeduction);
    const startStr = isEmp ? formEmpAdv.recoveryStartMonth : formContAdv.recoveryStartMonth;

    if (!amountVal || !deductionVal || amountVal <= 0 || deductionVal <= 0) return [];

    const list = [];
    let remaining = amountVal;
    
    const startParts = startStr.split(' ');
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let monthIdx = months.indexOf(startParts[0]);
    let year = parseInt(startParts[1]) || 2026;

    if (monthIdx === -1) monthIdx = 7; // August default

    let iterations = 0;
    while (remaining > 0 && iterations < 36) { // Safety limit 3 years
      const currentDeduction = Math.min(remaining, deductionVal);
      remaining -= currentDeduction;
      const displayMonth = months[monthIdx].substring(0, 3) + " " + year;
      list.push({
        monthName: displayMonth,
        deduction: currentDeduction,
        balance: remaining
      });

      monthIdx++;
      if (monthIdx >= 12) {
        monthIdx = 0;
        year++;
      }
      iterations++;
    }
    return list;
  };

  const empTimeline = getTimeline('employee');
  const contTimeline = getTimeline('contractor');

  const empEstimatedCompletion = empTimeline.length > 0 ? empTimeline[empTimeline.length - 1].monthName : "—";
  const contEstimatedCompletion = contTimeline.length > 0 ? contTimeline[contTimeline.length - 1].monthName : "—";

  const resetForm = () => {
    setFormBasic({
      name: "",
      category: "",
      vendor: "",
      purchaseType: "Goods",
      purchaseDate: "2026-08-06",
      expectedDeliveryDate: ""
    });
    setFormItem({
      description: "",
      qty: "",
      unit: "Units",
      unitPrice: ""
    });
    setFormPayment({
      paymentType: "Full Payment",
      advancePaid: "",
      paymentStatus: "Pending",
      paymentMethod: "Bank Transfer",
      paymentDate: "2026-08-06",
      transactionId: ""
    });
    setFormDelivery({
      deliveryStatus: "Ordered",
      deliveryDate: "",
      receivedBy: ""
    });
    setFormDocs({
      quotation: null,
      invoice: null,
      purchaseOrder: null,
      warranty: null
    });
    setFormNotes({
      remarks: "",
      internalNotes: ""
    });
    setInstallments([]);
  };

  const handleSaveProcurement = (e) => {
    e.preventDefault();

    if (procurementType === 'Purchase') {
      if (!formBasic.name) {
        alert("Please enter Item / Service Name.");
        return;
      }
      const typeMapping = {
        "Goods": "Vendor",
        "Services": "Contractor",
        "Asset Purchase": "Installment",
        "Staff Advance": "Employee Advance"
      };
      const mappedType = typeMapping[formBasic.purchaseType] || "Vendor";
      const generatedId = `PO-${Math.floor(1008 + Math.random() * 9000)}`;

      const newRecord = {
        id: generatedId,
        type: mappedType,
        name: formBasic.name,
        category: formBasic.category || "General",
        totalAmount: purchaseCost,
        paidAmount: parseFloat(formPayment.advancePaid) || 0,
        balance: purchaseBalance > 0 ? purchaseBalance : 0,
        status: formPayment.paymentStatus,
        phone: "9988776655",
        email: "info@supplier.com",
        description: formItem.description || `Purchase of ${formBasic.name}`,
        details: formPayment.paymentType === 'Installments'
          ? installments.map(inst => `${inst.name} - ₹${parseFloat(inst.amount).toLocaleString('en-IN')} (${inst.status})`)
          : ["Full payment - ₹" + purchaseCost.toLocaleString('en-IN')]
      };
      setItems([newRecord, ...items]);
    } 
    else if (procurementType === 'Employee Advance') {
      const generatedId = `ADV-${Math.floor(1001 + Math.random() * 9000)}`;
      const newRecord = {
        id: generatedId,
        type: "Employee Advance",
        name: formEmpAdv.employeeName,
        category: "Staff Advance",
        totalAmount: parseFloat(formEmpAdv.advanceAmount) || 0,
        paidAmount: 0,
        balance: parseFloat(formEmpAdv.advanceAmount) || 0,
        status: "Recovering",
        phone: "9876543210",
        email: "staff@greenfield.com",
        description: formEmpAdv.reason || "Staff salary advance",
        details: [`Deduction of ₹${parseFloat(formEmpAdv.monthlyDeduction).toLocaleString('en-IN')}/mo starting ${formEmpAdv.recoveryStartMonth}`]
      };
      setItems([newRecord, ...items]);
    } 
    else if (procurementType === 'Contractor Advance') {
      const generatedId = `CON-${Math.floor(1001 + Math.random() * 9000)}`;
      const newRecord = {
        id: generatedId,
        type: "Contractor",
        name: formContAdv.contractorName || "New Contractor",
        category: formContAdv.category || "Contractor Advance",
        totalAmount: parseFloat(formContAdv.advanceAmount) || 0,
        paidAmount: 0,
        balance: parseFloat(formContAdv.advanceAmount) || 0,
        status: "Partially Paid",
        phone: "9911223344",
        email: "contractor@greenfield.com",
        description: formContAdv.reason || "Contractor project advance",
        details: [`Project value: ₹${(parseFloat(formContAdv.projectValue) || 0).toLocaleString('en-IN')}`]
      };
      setItems([newRecord, ...items]);
    }

    setViewMode('dashboard');
    if (addLog) addLog(`Created new ${procurementType} record`, 'add');
  };

  const [transactions, setTransactions] = useState([]);

  const getFilteredItems = () => {
    return items.filter(item => {
      if (activeTab === 'All Outstanding') return true;
      if (activeTab === 'Vendor Payments' && item.type !== 'Vendor') return false;
      if (activeTab === 'Contractor Payments' && item.type !== 'Contractor') return false;
      if (activeTab === 'Employee Advances' && item.type !== 'Employee Advance') return false;
      if (activeTab === 'Installment Payments' && item.type !== 'Installment') return false;

      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Vendor': return <Building className="h-4 w-4 text-blue-655" />;
      case 'Contractor': return <HardHat className="h-4 w-4 text-purple-650" />;
      case 'Employee Advance': return <User className="h-4 w-4 text-emerald-600" />;
      case 'Installment': return <Calendar className="h-4 w-4 text-amber-600" />;
      default: return <ShoppingBag className="h-4 w-4 text-slate-600" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'Vendor': return 'bg-blue-50';
      case 'Contractor': return 'bg-purple-50';
      case 'Employee Advance': return 'bg-emerald-50';
      case 'Installment': return 'bg-amber-50';
      default: return 'bg-slate-50';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Paid</span>;
      case 'Partially Paid':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">Partially Paid</span>;
      case 'Recovering':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">Recovering</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  if (viewMode === 'add_procurement') {
    return (
      <div className="max-w-7xl mx-auto space-y-4 pb-4">
        {/* Form Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <span>Procurement</span>
              <span>&gt;</span>
              <span className="text-indigo-650">Add New Procurement</span>
            </div>
            <h3 className="text-xl font-bold text-slate-905">Add New Procurement</h3>
          </div>
          <button 
            onClick={() => setViewMode('dashboard')}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-100 bg-white hover:bg-slate-50 text-slate-655 font-bold text-xs rounded-xl transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </button>
        </div>

        {/* Step 1: Procurement Type Selection */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
            1. Procurement Type
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { type: 'Purchase', label: 'Purchase', icon: <ShoppingBag className="h-4 w-4" /> },
              { type: 'Employee Advance', label: 'Employee Advance', icon: <User className="h-4 w-4" /> },
              { type: 'Contractor Advance', label: 'Contractor Advance', icon: <Users className="h-4 w-4" /> }
            ].map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setProcurementType(opt.type)}
                className={`p-3.5 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition shadow-sm ${
                  procurementType === opt.type 
                    ? 'border-[#4f46e5] text-[#4f46e5] bg-indigo-50/20' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body Split Grid depending on selected type */}
        <form onSubmit={handleSaveProcurement} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {procurementType === 'Purchase' && (
            <>
              {/* Left Column: steps 1, 2, 3 */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Basic Information */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    Basic Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-slate-550 font-semibold block mb-1">Item / Service Name *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Enter item or service name"
                        value={formBasic.name}
                        onChange={(e) => setFormBasic({ ...formBasic, name: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-550 font-semibold block mb-1">Category *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Enter category"
                        value={formBasic.category}
                        onChange={(e) => setFormBasic({ ...formBasic, category: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-550 font-semibold block mb-1">Vendor / Supplier *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Enter vendor"
                        value={formBasic.vendor}
                        onChange={(e) => setFormBasic({ ...formBasic, vendor: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <label className="text-slate-550 font-semibold block mb-1">Purchase Type *</label>
                      <select 
                        value={formBasic.purchaseType}
                        onChange={(e) => setFormBasic({ ...formBasic, purchaseType: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-[#4f46e5]"
                      >
                        <option value="Goods">Goods</option>
                        <option value="Services">Services</option>
                        <option value="Asset Purchase">Asset Purchase</option>
                        <option value="Staff Advance">Staff Advance</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-550 font-semibold block mb-1">Purchase Date *</label>
                      <input 
                        type="date" 
                        required
                        value={formBasic.purchaseDate}
                        onChange={(e) => setFormBasic({ ...formBasic, purchaseDate: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-550 font-semibold block mb-1">Expected Delivery Date</label>
                      <input 
                        type="date" 
                        value={formBasic.expectedDeliveryDate}
                        onChange={(e) => setFormBasic({ ...formBasic, expectedDeliveryDate: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                  </div>
                </div>

                {/* Item Details */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    Item Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="md:col-span-2">
                      <label className="text-slate-550 font-semibold block mb-1">Description</label>
                      <textarea 
                        rows="1"
                        placeholder="Enter description"
                        value={formItem.description}
                        onChange={(e) => setFormItem({ ...formItem, description: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5] resize-none h-9"
                      />
                    </div>
                    <div>
                      <label className="text-slate-550 font-semibold block mb-1">Quantity *</label>
                      <input 
                        type="number" 
                        required 
                        min="1"
                        value={formItem.qty}
                        onChange={(e) => setFormItem({ ...formItem, qty: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-550 font-semibold block mb-1">Unit</label>
                      <select 
                        value={formItem.unit}
                        onChange={(e) => setFormItem({ ...formItem, unit: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-[#4f46e5]"
                      >
                        <option value="Units">Units</option>
                        <option value="Litres">Litres</option>
                        <option value="Kg">Kg</option>
                        <option value="Hours">Hours</option>
                        <option value="Services">Services</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <label className="text-slate-550 font-semibold block mb-1">Unit Price (₹) *</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        required 
                        value={formItem.unitPrice}
                        placeholder="Enter unit price"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormItem({ ...formItem, unitPrice: val });
                          }
                        }}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-455 block font-semibold mb-1">Total Cost (₹)</label>
                      <input 
                        type="text" 
                        disabled 
                        value={purchaseCost > 0 ? purchaseCost.toLocaleString('en-IN') : ""}
                        placeholder="0.00"
                        className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-655 font-semibold outline-none"
                      />
                    </div>
                  </div>
                </div>
                {/* Payment Information */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-5">
                  <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    Payment Information
                  </h4>
                  
                  <div>
                    <label className="text-slate-905 font-bold block mb-2 flex items-center gap-1">
                      Payment Type * 
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                    </label>
                    <div className="flex gap-4 pt-1 items-center h-10">
                       <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-sm">
                        <input 
                          type="radio" 
                          name="paymentType" 
                          checked={formPayment.paymentType === 'Full Payment'}
                          onChange={() => {
                            setFormPayment({
                              paymentType: 'Full Payment',
                              advancePaid: '',
                              paymentStatus: 'Paid',
                              paymentMethod: 'Bank Transfer',
                              paymentDate: '2026-08-06',
                              transactionId: ''
                            });
                            setInstallments([]);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-550 border-slate-300"
                        />
                        <span>Full Payment</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-sm">
                        <input 
                          type="radio" 
                          name="paymentType" 
                          checked={formPayment.paymentType === 'Installments'}
                          onChange={() => {
                            setFormPayment({
                              paymentType: 'Installments',
                              advancePaid: '',
                              paymentStatus: 'Pending',
                              paymentMethod: 'Bank Transfer',
                              paymentDate: '2026-08-06',
                              transactionId: ''
                            });
                            setInstallments([]);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-550 border-slate-300"
                        />
                        <span>Installments</span>
                      </label>
                    </div>
                  </div>

                  {formPayment.paymentType === 'Full Payment' ? (
                    <div className="space-y-4">
                      {/* First Row: Total, Amount Paid, Balance */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Total Amount (₹) *</label>
                          <input 
                            type="text" 
                            disabled 
                            value={purchaseCost > 0 ? purchaseCost.toLocaleString('en-IN') : "0"}
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Amount Paid (₹) *</label>
                          <input 
                            type="text" 
                            disabled 
                            value={purchaseCost > 0 ? purchaseCost.toLocaleString('en-IN') : "0"}
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Balance Amount (₹)</label>
                          <input 
                            type="text" 
                            disabled 
                            value="0"
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none"
                          />
                        </div>
                      </div>

                      {/* Second Row: Payment Method, Payment Date, Transaction ID */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Payment Method *</label>
                          <select 
                            value={formPayment.paymentMethod}
                            onChange={(e) => setFormPayment({ ...formPayment, paymentMethod: e.target.value })}
                            className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-blue-550 text-slate-800 font-medium"
                          >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Card">Card</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Payment Date *</label>
                          <div className="relative">
                            <input 
                              type="date" 
                              value={formPayment.paymentDate}
                              onChange={(e) => setFormPayment({ ...formPayment, paymentDate: e.target.value })}
                              className="w-full h-10 px-3 pl-10 border border-slate-200 rounded-xl outline-none focus:border-blue-550 text-slate-800 font-medium"
                            />
                            <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Transaction ID</label>
                          <input 
                            type="text" 
                            value={formPayment.transactionId || ""}
                            placeholder="e.g. TXN123456789"
                            onChange={(e) => setFormPayment({ ...formPayment, transactionId: e.target.value })}
                            className="w-full h-10 px-3 border border-slate-200 rounded-xl outline-none focus:border-blue-550 text-slate-800 font-semibold"
                          />
                        </div>
                      </div>

                      {/* Third Row: Payment Status badge */}
                      <div className="space-y-1.5">
                        <label className="text-slate-905 font-bold block text-xs">Payment Status</label>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs rounded-lg">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
                          Paid
                        </div>
                      </div>

                      {/* Success banner */}
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                        <span>This purchase has been paid in full.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Grid for installments */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-end">
                        <div>
                          <label className="text-slate-900 font-bold block mb-2">Total Amount (₹)</label>
                          <input 
                            type="text" 
                            disabled 
                            value={purchaseCost > 0 ? purchaseCost.toLocaleString('en-IN') : ""}
                            placeholder="0"
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Paid Amount (₹)</label>
                          <input 
                            type="number" 
                            min="0"
                            max={purchaseCost}
                            value={formPayment.advancePaid}
                            placeholder="0"
                            onChange={(e) => setFormPayment({ ...formPayment, advancePaid: e.target.value })}
                            className="w-full h-10 px-3 border border-slate-200 rounded-xl outline-none focus:border-blue-550 font-semibold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Balance Amount (₹)</label>
                          <input 
                            type="text" 
                            disabled 
                            value={purchaseBalance > 0 ? purchaseBalance.toLocaleString('en-IN') : "0"}
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[#dc2626] font-bold outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Payment Status *</label>
                          <select 
                            value={formPayment.paymentStatus}
                            onChange={(e) => setFormPayment({ ...formPayment, paymentStatus: e.target.value })}
                            className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-blue-550 text-slate-800 font-medium"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Partially Paid">Partially Paid</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Payment Method</label>
                          <select 
                            value={formPayment.paymentMethod}
                            onChange={(e) => setFormPayment({ ...formPayment, paymentMethod: e.target.value })}
                            className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-blue-550 text-slate-800 font-medium"
                          >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Card">Card</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-905 font-bold block mb-2">Payment Date</label>
                          <div className="relative">
                            <input 
                              type="date" 
                              value={formPayment.paymentDate}
                              onChange={(e) => setFormPayment({ ...formPayment, paymentDate: e.target.value })}
                              className="w-full h-10 px-3 pl-10 border border-slate-200 rounded-xl outline-none focus:border-blue-550 text-slate-800 font-medium"
                            />
                            <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleAddInstallmentRow}
                          className="flex items-center gap-1.5 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-55 bg-white font-bold text-xs rounded-xl shadow-sm transition duration-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Installment
                        </button>
                      </div>

                      {installments.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                          <h5 className="text-xs font-bold text-slate-805">Installment Schedule</h5>
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                                  <th className="py-2.5 px-4">Payment Date</th>
                                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                                  <th className="py-2.5 px-4 text-center">Method</th>
                                  <th className="py-2.5 px-4 text-center w-28">Status</th>
                                  <th className="py-2.5 px-4 text-center w-20">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {installments.map((inst, index) => (
                                  <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-2 px-4 text-center text-slate-500">{index + 1}</td>
                                    <td className="py-2 px-4 text-slate-700">{inst.dueDate}</td>
                                    <td className="py-2 px-4 text-right text-slate-800 font-bold">{inst.amount.toLocaleString('en-IN')}</td>
                                    <td className="py-2 px-4 text-center text-slate-600">{inst.method}</td>
                                    <td className="py-2 px-4 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        inst.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                      }`}>
                                        {inst.status}
                                      </span>
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteInstallmentRow(inst.id)}
                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                        title="Delete installment"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="flex justify-end items-center text-[11px] text-slate-500 font-semibold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                            <span>Total Scheduled Installments: ₹ {totalInstallmentsAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: steps 4, 5 */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Documents (Optional) */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    Documents (Optional)
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Upload Quotation", key: "quotation" },
                      { label: "Upload Invoice", key: "invoice" },
                      { label: "Upload Purchase Order", key: "purchaseOrder" },
                      { label: "Upload Warranty Document", key: "warranty" }
                    ].map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 gap-2">
                        <div className="flex items-center gap-1.5 text-slate-655 font-semibold">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="flex flex-col">
                            <span>{doc.label}</span>
                            {formDocs[doc.key] && (
                              <span className="text-[9px] text-emerald-600 font-normal truncate max-w-[150px]">
                                {formDocs[doc.key].name}
                              </span>
                            )}
                          </div>
                        </div>
                        <label className="cursor-pointer px-2.5 py-1 border border-slate-200 rounded-xl hover:bg-slate-50 text-[10px] font-bold text-slate-655 flex items-center gap-1 transition">
                          <input 
                            type="file" 
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setFormDocs({ ...formDocs, [doc.key]: e.target.files[0] });
                              }
                            }}
                          />
                          {formDocs[doc.key] ? "Change" : "Choose File"}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes (Optional) */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    Notes (Optional)
                  </h4>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Remarks</label>
                      <textarea 
                        rows="3"
                        placeholder="Enter remarks"
                        value={formNotes.remarks}
                        onChange={(e) => setFormNotes({ ...formNotes, remarks: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Internal Notes</label>
                      <textarea 
                        rows="3"
                        placeholder="Enter internal notes (visible to admin only)"
                        value={formNotes.internalNotes}
                        onChange={(e) => setFormNotes({ ...formNotes, internalNotes: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {procurementType === 'Employee Advance' && (
            <>
              {/* Left Column: Advance Details */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    2. Advance Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Employee Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter employee name"
                        value={formEmpAdv.employeeName}
                        onChange={(e) => setFormEmpAdv({ ...formEmpAdv, employeeName: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Department</label>
                      <select
                        value={formEmpAdv.department}
                        onChange={(e) => setFormEmpAdv({ ...formEmpAdv, department: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-[#4f46e5]"
                      >
                        <option value="Security">Security</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Administration">Administration</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Monthly Salary (₹) *</label>
                      <input 
                        type="number" 
                        required
                        value={formEmpAdv.monthlySalary}
                        onChange={(e) => setFormEmpAdv({ ...formEmpAdv, monthlySalary: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Advance Amount (₹) *</label>
                      <input 
                        type="number" 
                        required
                        value={formEmpAdv.advanceAmount}
                        onChange={(e) => setFormEmpAdv({ ...formEmpAdv, advanceAmount: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Monthly Deduction (₹) *</label>
                      <input 
                        type="number" 
                        required
                        value={formEmpAdv.monthlyDeduction}
                        onChange={(e) => setFormEmpAdv({ ...formEmpAdv, monthlyDeduction: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Recovery Start Month *</label>
                      <select
                        value={formEmpAdv.recoveryStartMonth}
                        onChange={(e) => setFormEmpAdv({ ...formEmpAdv, recoveryStartMonth: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-[#4f46e5]"
                      >
                        <option value="August 2026">August 2026</option>
                        <option value="September 2026">September 2026</option>
                        <option value="October 2026">October 2026</option>
                        <option value="November 2026">November 2026</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Payment Method *</label>
                      <select
                        value={formEmpAdv.paymentMethod}
                        onChange={(e) => setFormEmpAdv({ ...formEmpAdv, paymentMethod: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-[#4f46e5]"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Reason / Purpose *</label>
                      <input 
                        type="text" 
                        required
                        value={formEmpAdv.reason}
                        onChange={(e) => setFormEmpAdv({ ...formEmpAdv, reason: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-555 font-semibold block mb-1">Notes (Optional)</label>
                    <div className="relative">
                      <textarea 
                        rows="3"
                        maxLength="250"
                        placeholder="Enter notes..."
                        value={formEmpAdv.notes}
                        onChange={(e) => setFormEmpAdv({ ...formEmpAdv, notes: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none resize-none text-xs"
                      />
                      <span className="absolute bottom-2 right-3 text-[9px] text-slate-400">
                        {formEmpAdv.notes.length} / 250
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Advance Summary & Timeline preview */}
              <div className="lg:col-span-4 space-y-4">
                {/* Advance Summary */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    <Wallet className="h-4 w-4 text-[#4f46e5]" />
                    Advance Summary
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Advance Given</span>
                      <span className="font-extrabold text-slate-800">₹ {(parseFloat(formEmpAdv.advanceAmount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Recovered Amount</span>
                      <span className="font-extrabold text-slate-800">₹ 0</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Remaining Balance</span>
                      <span className="font-extrabold text-[#4f46e5]">₹ {(parseFloat(formEmpAdv.advanceAmount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Monthly Deduction</span>
                      <span className="font-extrabold text-slate-800">₹ {(parseFloat(formEmpAdv.monthlyDeduction) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-semibold">Estimated Completion</span>
                      <span className="font-bold text-slate-800">{empEstimatedCompletion}</span>
                    </div>
                  </div>
                </div>

                {/* Recovery Preview Timeline */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    <Clock className="h-4 w-4 text-[#4f46e5]" />
                    Recovery Preview
                  </h4>
                  {empTimeline.length > 0 ? (
                    <div className="space-y-4 relative pl-4 before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-[2px] before:bg-indigo-150">
                      {empTimeline.map((step, idx) => {
                        const isLast = idx === empTimeline.length - 1;
                        return (
                          <div key={idx} className="relative flex items-start gap-3 text-[11px]">
                            {/* timeline node */}
                            <div className={`absolute left-[-21px] flex items-center justify-center h-4.5 w-4.5 rounded-full border-2 bg-white z-10 ${
                              isLast ? 'border-emerald-500' : 'border-[#4f46e5]'
                            }`}>
                              {isLast ? (
                                <Check className="h-2.5 w-2.5 text-emerald-600 stroke-[3]" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#4f46e5]" />
                              )}
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <span className="font-bold text-slate-800">{step.monthName}</span>
                              <span className="text-slate-500 text-center">₹ {step.deduction.toLocaleString('en-IN')}</span>
                              <span className="text-right font-semibold text-slate-655">₹ {step.balance.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic text-center py-4">Enter amount and deduction to preview recovery.</p>
                  )}
                </div>

                {/* Information Alert Banner */}
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-3 flex items-start gap-2.5 text-[10px] text-indigo-900 font-semibold leading-relaxed">
                  <AlertCircle className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                  <span>
                    When monthly salary is recorded in <span className="text-indigo-950 font-extrabold">Billing & Finance → Manage Expenses</span>, the selected deduction amount is automatically recovered and the remaining balance is updated.
                  </span>
                </div>
              </div>
            </>
          )}

          {procurementType === 'Contractor Advance' && (
            <>
              {/* Left Column: Contractor Advance Details */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    2. Contractor Advance Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Contractor Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Enter contractor name"
                        value={formContAdv.contractorName}
                        onChange={(e) => setFormContAdv({ ...formContAdv, contractorName: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Work Category *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Painting, Electrical"
                        value={formContAdv.category}
                        onChange={(e) => setFormContAdv({ ...formContAdv, category: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Project / Contract Value (₹) *</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Enter project value"
                        value={formContAdv.projectValue}
                        onChange={(e) => setFormContAdv({ ...formContAdv, projectValue: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Advance Amount (₹) *</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Enter advance amount"
                        value={formContAdv.advanceAmount}
                        onChange={(e) => setFormContAdv({ ...formContAdv, advanceAmount: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Monthly/Milestone Deduction (₹) *</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Enter deduction per interval"
                        value={formContAdv.monthlyDeduction}
                        onChange={(e) => setFormContAdv({ ...formContAdv, monthlyDeduction: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Recovery Start Month *</label>
                      <select
                        value={formContAdv.recoveryStartMonth}
                        onChange={(e) => setFormContAdv({ ...formContAdv, recoveryStartMonth: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-[#4f46e5]"
                      >
                        <option value="August 2026">August 2026</option>
                        <option value="September 2026">September 2026</option>
                        <option value="October 2026">October 2026</option>
                        <option value="November 2026">November 2026</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Payment Method *</label>
                      <select
                        value={formContAdv.paymentMethod}
                        onChange={(e) => setFormContAdv({ ...formContAdv, paymentMethod: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-[#4f46e5]"
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-555 font-semibold block mb-1">Reason / Purpose *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Enter reason"
                        value={formContAdv.reason}
                        onChange={(e) => setFormContAdv({ ...formContAdv, reason: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-555 font-semibold block mb-1">Notes (Optional)</label>
                    <div className="relative">
                      <textarea 
                        rows="3"
                        maxLength="250"
                        placeholder="Enter notes..."
                        value={formContAdv.notes}
                        onChange={(e) => setFormContAdv({ ...formContAdv, notes: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none resize-none text-xs"
                      />
                      <span className="absolute bottom-2 right-3 text-[9px] text-slate-400">
                        {formContAdv.notes.length} / 250
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Contractor Advance Summary & Timeline preview */}
              <div className="lg:col-span-4 space-y-4">
                {/* Advance Summary */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-805 flex items-center gap-2 border-b border-slate-50 pb-2">
                    <Wallet className="h-4 w-4 text-[#4f46e5]" />
                    Advance Summary
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Advance Given</span>
                      <span className="font-extrabold text-slate-800">₹ {(parseFloat(formContAdv.advanceAmount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-505 font-semibold">Recovered Amount</span>
                      <span className="font-extrabold text-slate-800">₹ 0</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Remaining Balance</span>
                      <span className="font-extrabold text-[#4f46e5]">₹ {(parseFloat(formContAdv.advanceAmount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Milestone Deduction</span>
                      <span className="font-extrabold text-slate-800">₹ {(parseFloat(formContAdv.monthlyDeduction) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-semibold">Estimated Completion</span>
                      <span className="font-bold text-slate-800">{contEstimatedCompletion}</span>
                    </div>
                  </div>
                </div>

                {/* Recovery Preview Timeline */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-850 flex items-center gap-2 border-b border-slate-50 pb-2">
                    <Clock className="h-4 w-4 text-[#4f46e5]" />
                    Recovery Preview
                  </h4>
                  {contTimeline.length > 0 ? (
                    <div className="space-y-4 relative pl-4 before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-[2px] before:bg-indigo-150">
                      {contTimeline.map((step, idx) => {
                        const isLast = idx === contTimeline.length - 1;
                        return (
                          <div key={idx} className="relative flex items-start gap-3 text-[11px]">
                            {/* timeline node */}
                            <div className={`absolute left-[-21px] flex items-center justify-center h-4.5 w-4.5 rounded-full border-2 bg-white z-10 ${
                              isLast ? 'border-emerald-500' : 'border-[#4f46e5]'
                            }`}>
                              {isLast ? (
                                <Check className="h-2.5 w-2.5 text-emerald-600 stroke-[3]" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#4f46e5]" />
                              )}
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <span className="font-bold text-slate-800">{step.monthName}</span>
                              <span className="text-slate-500 text-center">₹ {step.deduction.toLocaleString('en-IN')}</span>
                              <span className="text-right font-semibold text-slate-655">₹ {step.balance.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic text-center py-4">Enter amount and deduction to preview recovery.</p>
                  )}
                </div>

                {/* Information Alert Banner */}
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-3 flex items-start gap-2.5 text-[10px] text-indigo-900 font-semibold leading-relaxed">
                  <AlertCircle className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                  <span>
                    When milestone payouts are approved in <span className="text-indigo-950 font-extrabold">Billing & Finance → Manage Expenses</span>, the selected deduction amount is automatically recovered and the remaining balance is updated.
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Form Footer Buttons */}
          <div className="lg:col-span-12 flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewMode('dashboard')}
              className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-605 font-semibold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#4f46e5] hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              {procurementType === 'Purchase' ? 'Save Procurement' : 'Save Advance'}
            </button>
          </div>

        </form>

      </div>
    );
  }

  // Dashboard View Mode
  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-4">
      
      {/* Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">Procurement Dashboard</h2>
          <p className="text-slate-500 text-xs mt-0.5">Track all purchases, payments, advances and outstanding balances in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("Report generation started...")}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-655 font-bold text-xs rounded-xl transition"
          >
            <FileText className="h-4 w-4" />
            Report
          </button>
          <button 
            onClick={() => {
              resetForm();
              setViewMode('add_procurement');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Add New
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#f8fafc] border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-[#6366f1] rounded-xl">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Outstanding (All)</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1 leading-tight">
                {totalOutstanding > 0 ? `₹ ${totalOutstanding.toLocaleString('en-IN')}` : "—"}
              </h3>
              <span className="text-[10px] text-slate-450 block font-medium mt-0.5">Across all categories</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-555 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vendor Payments Due</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1 leading-tight">
                {vendorDue > 0 ? `₹ ${vendorDue.toLocaleString('en-IN')}` : "—"}
              </h3>
              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                {items.filter(item => item.type === 'Vendor' && item.balance > 0).length > 0
                  ? `${items.filter(item => item.type === 'Vendor' && item.balance > 0).length} Vendors`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-655 rounded-xl">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contractor Payments Due</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1 leading-tight">
                {contractorDue > 0 ? `₹ ${contractorDue.toLocaleString('en-IN')}` : "—"}
              </h3>
              <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
                {items.filter(item => item.type === 'Contractor' && item.balance > 0).length > 0
                  ? `${items.filter(item => item.type === 'Contractor' && item.balance > 0).length} Contractors`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Employee Advance Due</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1 leading-tight">
                {employeeDue > 0 ? `₹ ${employeeDue.toLocaleString('en-IN')}` : "—"}
              </h3>
              <span className="text-[10px] text-slate-450 block font-medium mt-0.5">
                {items.filter(item => item.type === 'Employee Advance' && item.balance > 0).length > 0
                  ? `${items.filter(item => item.type === 'Employee Advance' && item.balance > 0).length} Employees`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Split Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Filter Tabs & Table */}
        <div className="lg:col-span-8 space-y-3">
          
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            
            {/* Filter controls row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-50">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['All Outstanding', 'Vendor Payments', 'Contractor Payments', 'Employee Advances'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === tab
                      ? 'bg-indigo-50 text-[#6366f1] shadow-sm'
                      : 'text-slate-500 hover:bg-slate-55'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or ref. no."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#6366f1] w-64"
                  />
                </div>
                <button 
                  onClick={() => alert("Opening advanced filter modal...")}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-655 hover:bg-slate-55 flex items-center gap-1 text-xs font-bold"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </button>
              </div>
            </div>

            {/* Outstanding Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Name / Reference</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-right">Total Amount (₹)</th>
                    <th className="pb-3 text-right">Paid / Recovered (₹)</th>
                    <th className="pb-3 text-right">Balance (₹)</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {getFilteredItems().map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${getIconBg(item.type)}`}>
                            {getIcon(item.type)}
                          </div>
                          <span className="font-semibold text-slate-500">{item.type}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="font-bold text-slate-805 text-xs">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{item.id}</div>
                      </td>
                      <td className="py-2.5 text-slate-600 font-medium">{item.category}</td>
                      <td className="py-3.5 font-semibold text-slate-800 text-right">{item.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 font-semibold text-emerald-605 text-right">{item.paidAmount.toLocaleString('en-IN')}</td>
                      <td className={`py-2.5 font-bold text-right ${item.balance > 0 ? 'text-rose-600' : 'text-slate-805'}`}>
                        {item.balance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-center">{getStatusBadge(item.status)}</td>
                      <td className="py-3.5 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="px-3.5 py-1.5 bg-slate-55 hover:bg-indigo-50 hover:text-indigo-650 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs flex items-center gap-1.5 transition"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getFilteredItems().length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-slate-400 italic">
                        No outstanding obligations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Bottom Split: Employee Advance Recovery & Recent Transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            
            {/* Employee Advance Recovery Card */}
            <div className="bg-white border border-slate-100 rounded-[16px] p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-805">Employee Advance Recovery Tracker</h4>
                  {items.some(item => item.type === 'Employee Advance') ? (
                    <p className="text-xs text-slate-455 mt-0.5 font-medium">
                      {items.find(item => item.type === 'Employee Advance').name} ({items.find(item => item.type === 'Employee Advance').category})
                    </p>
                  ) : (
                    <p className="text-xs text-slate-455 mt-0.5 font-medium">No active employee advance</p>
                  )}
                </div>
                <button 
                  onClick={() => alert("Viewing all employee advances...")}
                  className="text-xs font-bold text-[#6366f1] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center text-xs">
                <div className="p-3 bg-indigo-50/50 rounded-[16px]">
                  <span className="text-slate-455 block font-medium">Advance Given</span>
                  <span className="font-extrabold text-indigo-700 mt-1 block text-lg">
                    ₹ {items.filter(item => item.type === 'Employee Advance').reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-[16px]">
                  <span className="text-slate-455 block font-medium">Recovered</span>
                  <span className="font-extrabold text-emerald-700 mt-1 block text-lg">
                    ₹ {items.filter(item => item.type === 'Employee Advance').reduce((sum, item) => sum + item.paidAmount, 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-rose-50/55 rounded-[16px]">
                  <span className="text-slate-455 block font-medium">Balance Due</span>
                  <span className="font-extrabold text-rose-700 mt-1 block text-lg">
                    ₹ {items.filter(item => item.type === 'Employee Advance').reduce((sum, item) => sum + item.balance, 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-[16px]">
                  <span className="text-slate-455 block font-medium">Monthly Deduction</span>
                  <span className="font-extrabold text-amber-700 mt-1 block text-lg">
                    ₹ {items.some(item => item.type === 'Employee Advance') ? '2,000' : '0'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 py-1">
                {/* Dynamic circular progress */}
                {(() => {
                  const empAdvs = items.filter(item => item.type === 'Employee Advance');
                  const given = empAdvs.reduce((sum, item) => sum + item.totalAmount, 0);
                  const paid = empAdvs.reduce((sum, item) => sum + item.paidAmount, 0);
                  const pct = given > 0 ? Math.round((paid / given) * 100) : 0;
                  return (
                    <div className="relative flex items-center justify-center h-20 w-20 shrink-0">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="28" className="stroke-slate-100 fill-none" strokeWidth="5" />
                        <circle cx="40" cy="40" r="28" className="stroke-[#6366f1] fill-none" strokeWidth="5"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 - (pct / 100) * (2 * Math.PI * 28)}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-center flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-slate-805 leading-none">{pct}%</span>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none mt-1">Recovered</span>
                      </div>
                    </div>
                  );
                })()}

                {/* mini schedule table */}
                <div className="flex-1 overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="pb-2.5">Month</th>
                        <th className="pb-2.5 text-right">Deduction</th>
                        <th className="pb-2.5 text-right">Balance</th>
                        <th className="pb-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-655 font-medium text-[11px]">
                      {items.some(item => item.type === 'Employee Advance') ? (
                        <>
                          <tr>
                            <td className="py-3">Jul 2026</td>
                            <td className="py-3 text-right">₹ 2,000</td>
                            <td className="py-3 text-right">₹ 8,000</td>
                            <td className="py-3 text-center text-emerald-600 font-bold">Paid</td>
                          </tr>
                          <tr>
                            <td className="py-3">Aug 2026</td>
                            <td className="py-3 text-right">₹ 2,000</td>
                            <td className="py-3 text-right">₹ 6,000</td>
                            <td className="py-3 text-center text-emerald-600 font-bold">Paid</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-6 text-slate-500 font-medium italic">No schedule records.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4.5 flex items-center gap-3 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Advance balance updates automatically whenever salary is recorded.</span>
              </div>
            </div>

            {/* Recent Transactions Card */}
            <div className="bg-white border border-slate-100 rounded-[16px] p-7 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h4 className="text-[20px] font-bold text-slate-805">Recent Transactions</h4>
                <button 
                  onClick={() => alert("Viewing all transactions...")}
                  className="text-[15px] font-semibold text-[#6366f1] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto text-[15px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[13px] text-slate-400 border-b border-slate-100 font-semibold uppercase tracking-wider">
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Reference</th>
                      <th className="pb-2.5">Description</th>
                      <th className="pb-2.5 text-right">Amount (₹)</th>
                      <th className="pb-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {transactions.length > 0 ? (
                      transactions.map((txn, index) => (
                        <tr key={index}>
                          <td className="py-3.5 text-slate-455">{txn.date}</td>
                          <td className="py-3.5 font-bold text-slate-705">{txn.ref}</td>
                          <td className="py-3.5 text-slate-655 max-w-[120px] truncate" title={txn.desc}>{txn.desc}</td>
                          <td className={`py-3.5 text-right font-extrabold ${txn.amt < 0 ? 'text-slate-800' : 'text-emerald-605'}`}>
                            {txn.amt < 0 ? '-' : '+'}{Math.abs(txn.amt).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`px-2 py-1 rounded text-[13px] font-semibold uppercase ${
                              txn.status === 'Paid' || txn.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-slate-500 font-medium italic">No recent transactions.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Outstanding Summary */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Card: Outstanding Summary Chart */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-[18px] font-semibold text-slate-805">Outstanding Summary</h4>
            
            <div className="flex items-center gap-4 py-1">
              {/* Donut Chart representation */}
              <div className="relative flex items-center justify-center h-20 w-20 shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="28" className="stroke-slate-100 fill-none" strokeWidth="6" />
                  {/* Vendor Payments */}
                  <circle cx="40" cy="40" r="28" className="stroke-blue-500 fill-none" strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 - (totalOutstanding > 0 ? (vendorDue / totalOutstanding) * 100 : 0) / 100 * (2 * Math.PI * 28)}
                    strokeLinecap="round" />
                  {/* Contractor Payments */}
                  <circle cx="40" cy="40" r="28" className="stroke-purple-550 fill-none" strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 - (totalOutstanding > 0 ? (contractorDue / totalOutstanding) * 100 : 0) / 100 * (2 * Math.PI * 28)}
                    transform={`rotate(${totalOutstanding > 0 ? (vendorDue / totalOutstanding) * 360 : 0} 40 40)`}
                    strokeLinecap="round" />
                  {/* Employee Advances */}
                  <circle cx="40" cy="40" r="28" className="stroke-emerald-500 fill-none" strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 - (totalOutstanding > 0 ? (employeeDue / totalOutstanding) * 100 : 0) / 100 * (2 * Math.PI * 28)}
                    transform={`rotate(${totalOutstanding > 0 ? ((vendorDue + contractorDue) / totalOutstanding) * 360 : 0} 40 40)`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute text-center flex flex-col justify-center items-center p-1">
                  <span className="text-[14px] font-bold text-slate-808 leading-none">₹ {totalOutstanding.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase leading-none mt-1">Outstanding</span>
                </div>
              </div>

              {/* Legends details */}
              <div className="space-y-2.5 text-[15px] flex-1">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-455 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block"></span>
                    Vendor Payments
                  </span>
                  <span className="font-bold text-slate-805 text-[15px]">₹ {vendorDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-455 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-550 inline-block"></span>
                    Contractor Payments
                  </span>
                  <span className="font-bold text-slate-805 text-[15px]">₹ {contractorDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-455 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    Employee Advances
                  </span>
                  <span className="font-bold text-slate-850 text-[15px]">₹ {employeeDue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Detail View Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 bg-slate-955/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-indigo-655 uppercase tracking-widest">{selectedItemDetail.type} Obligations</span>
                <h3 className="text-base font-bold text-slate-805 mt-0.5">{selectedItemDetail.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">Reference ID: {selectedItemDetail.id}</p>
              </div>
              <button 
                onClick={() => setSelectedItemDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Category / Position</span>
                <span className="font-semibold text-slate-805 mt-0.5 block">{selectedItemDetail.category}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Description</span>
                <p className="text-slate-600 mt-0.5">{selectedItemDetail.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-50">
                <div>
                  <span className="text-slate-400 block font-semibold">Total Cost</span>
                  <span className="font-bold text-slate-808">₹ {selectedItemDetail.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Total Paid</span>
                  <span className="font-bold text-emerald-600">₹ {selectedItemDetail.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Balance Due</span>
                  <span className="font-bold text-rose-600">₹ {selectedItemDetail.balance.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Obligations Schedule</span>
                {selectedItemDetail.details && selectedItemDetail.details.length > 0 ? (
                  <ul className="space-y-1 bg-slate-50/55 p-2 rounded-xl border border-slate-100 text-[11px] text-slate-600 list-disc list-inside">
                    {selectedItemDetail.details.map((dt, i) => (
                      <li key={i}>{dt}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-400 italic">No breakdown details available.</span>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                {selectedItemDetail.phone && (
                  <a 
                    href={`tel:${selectedItemDetail.phone}`}
                    className="px-3.5 py-1.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl text-slate-600 font-semibold text-xs"
                  >
                    Call Contact
                  </a>
                )}
                <button
                  onClick={() => setSelectedItemDetail(null)}
                  className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-semibold"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Alert Footer Banner */}
      <div className="bg-indigo-50/40 border border-indigo-100 rounded-[16px] p-5 flex items-center gap-4 text-[16px] text-indigo-900 font-medium mt-6">
        <AlertCircle className="h-6 w-6 text-[#6366f1] shrink-0" />
        <span>Procurement module helps you track all kinds of payable and receivable obligations in one place for better financial control and transparency.</span>
      </div>

    </div>
  );
}
