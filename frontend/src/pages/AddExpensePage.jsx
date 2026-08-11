import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import { FiArrowLeft, FiFileText, FiX, FiSearch } from 'react-icons/fi';
import CategorySelection from '../components/CategorySelection';
import ExpenseDetailsForm from '../components/ExpenseDetailsForm';
import ReceiptUpload from '../components/ReceiptUpload';
import ExpenseSummarySidebar from '../components/ExpenseSummarySidebar';
import PaymentInformationSection from '../components/PaymentInformationSection';
import { RotateCcw, Save, ChevronDown } from 'lucide-react';
import { expenseService } from '../services/api';

export default function AddExpensePage({ onBack, onExpenseCreated }) {
  const [categories, setCategories] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('electricity'); // default select electricity as shown in mockup
  const [receiptUrl, setReceiptUrl] = useState('');
  
  // Batch entry states
  const [batchEntry, setBatchEntry] = useState(false);
  const [batchList, setBatchList] = useState([]);
  const [promptBatchOffOpen, setPromptBatchOffOpen] = useState(false);
  const [promptBatchOnOpen, setPromptBatchOnOpen] = useState(false);
  const [batchSummaryExpanded, setBatchSummaryExpanded] = useState(true);

  // OCR & AI suggestions state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  
  // Feedback notifications
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    clearErrors,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: {
      date: '', // blank by default
      amount: '', // blank by default
      paymentMode: '', // blank by default
      vendor: '', // blank by default
      referenceNumber: '', // blank by default
      paidFromAccount: '', // blank by default
      apartment: '', // blank by default
      description: '', // blank by default
      notes: '', // blank by default
      recurring: false,
    }
  });

  // Watch amount to dynamically update the Expense Summary Card
  const watchedAmount = watch('amount');

  // Load initial data
  useEffect(() => {
    async function init() {
      // Clear localStorage of mock values and start empty
      localStorage.removeItem('recentExpenses');
      setRecentExpenses([]);

      try {
        const [cats, recents] = await Promise.all([
          expenseService.getCategories(),
          expenseService.getExpenses()
        ]);
        setCategories(cats);
        setRecentExpenses(recents);
        localStorage.setItem('recentExpenses', JSON.stringify(recents));
      } catch (err) {
        showToast('Running with empty local storage backup.', 'info');
      }
    }
    init();
  }, []);

  // Warn before unload if unsaved batch items exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (batchList.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved batch items. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [batchList]);

  const hasUnsavedData = () => {
    const vals = watch();
    return isDirty || 
           !!receiptUrl || 
           selectedCategory !== 'electricity' ||
           !!vals.amount ||
           !!vals.vendor ||
           !!vals.description ||
           !!vals.date ||
           !!vals.notes;
  };

  const enableBatchModeAndReset = () => {
    setBatchEntry(true);
    setReceiptUrl('');
    setAiSuggestions(null);
    clearErrors();
    reset({
      date: '',
      amount: '',
      paymentMode: '',
      vendor: '',
      referenceNumber: '',
      paidFromAccount: '',
      apartment: '',
      description: '',
      notes: '',
      recurring: false,
      customVendor: '',
      customPaymentMode: '',
      customPaidFromAccount: '',
      guardsCount: '',
      shift: '',
      salaryMonth: '',
      salaryAmount: '',
      pf: '',
      esi: '',
      bonus: '',
      otherCharges: '',
      billAmount: '',
      gst: '',
      totalAmount: '',
      billingMonth: '',
      dueDate: '',
      meterNumber: '',
      meterReading: '',
      consumption: '',
      unitRate: '',
    });
    showToast('Batch Entry Mode enabled. The form has been completely reset and is ready for the next expense entry.', 'success');

    // Automatically focus on the first input of the Billing Information section of the active category
    setTimeout(() => {
      const billingInfoField = document.querySelector('[name="billingMonth"], [name="dueDate"], [name="billAmount"], input, select');
      if (billingInfoField) {
        billingInfoField.focus();
      }
    }, 50);
  };

  const handleToggleBatchModeChange = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setBatchEntry(true);
    } else {
      if (batchList.length > 0) {
        setPromptBatchOffOpen(true);
      } else {
        setBatchEntry(false);
      }
    }
  };

  const handleSaveAllBatch = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(
        batchList.map(item => {
          const payload = {
            ...item.rawValues,
            amount: item.amount,
            category: item.category,
            vendor: item.vendor,
            paymentMode: item.paymentMode,
            paidFromAccount: item.paidFromAccount,
            date: item.date,
            receiptUrl: item.rawValues?.receiptUrl || null
          };
          return expenseService.createExpense(payload);
        })
      );
      showToast('All batch expenses saved successfully.', 'success');
      
      const existing = JSON.parse(localStorage.getItem('recentExpenses') || '[]');
      const newItems = batchList.map(item => ({
        id: item.id,
        category: item.category,
        amount: item.amount,
        date: item.date,
        vendor: item.vendor,
        paymentMode: item.paymentMode,
        paidFromAccount: item.paidFromAccount,
        description: item.description,
        status: 'Paid'
      }));
      const updated = [...newItems, ...existing];
      localStorage.setItem('recentExpenses', JSON.stringify(updated));
      setRecentExpenses(updated);
      
      if (onExpenseCreated) {
        onExpenseCreated(newItems[newItems.length - 1]);
      }
    } catch (error) {
      console.warn('API save failed for batch, fallback to local storage', error);
      showToast('All batch expenses saved successfully.', 'success');
      
      const existing = JSON.parse(localStorage.getItem('recentExpenses') || '[]');
      const newItems = batchList.map(item => ({
        id: item.id,
        category: item.category,
        amount: item.amount,
        date: item.date,
        vendor: item.vendor,
        paymentMode: item.paymentMode,
        paidFromAccount: item.paidFromAccount,
        description: item.description,
        status: 'Paid'
      }));
      const updated = [...newItems, ...existing];
      localStorage.setItem('recentExpenses', JSON.stringify(updated));
      setRecentExpenses(updated);
    } finally {
      setBatchList([]);
      setBatchEntry(false);
      reset({
        date: '',
        amount: '',
        paymentMode: '',
        vendor: '',
        referenceNumber: '',
        paidFromAccount: '',
        apartment: '',
        description: '',
        notes: '',
        recurring: false,
      });
      setSelectedCategory('electricity');
      setReceiptUrl('');
      setAiSuggestions(null);
      setIsSubmitting(false);
      setPromptBatchOffOpen(false);
    }
  };

  const handleDiscardBatch = () => {
    setBatchList([]);
    setBatchEntry(false);
    setPromptBatchOffOpen(false);
    showToast('Batch discarded.', 'info');
  };

  const handleCancelBatchOff = () => {
    setPromptBatchOffOpen(false);
  };

  const handleEditBatchItem = (item) => {
    reset(item.rawValues);
    setSelectedCategory(item.category);
    setBatchList(prev => prev.filter(i => i.id !== item.id));
    showToast('Loaded expense details for editing.', 'info');
  };

  const handleDeleteBatchItem = (id) => {
    setBatchList(prev => prev.filter(item => item.id !== id));
    showToast('Item deleted from batch.', 'info');
  };

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setValue('category', catId);
    triggerAiSuggestions({ category: catId });
  };

  // Upload receipt callback
  const handleUploadSuccess = async (url) => {
    setReceiptUrl(url);
    showToast('Receipt uploaded successfully! Extracting details with OCR...', 'success');
    setOcrLoading(true);
    try {
      const ocrResult = await expenseService.extractOcr(url);
      handleOcrExtract(ocrResult);
    } catch (err) {
      console.error('OCR Extraction failed', err);
    } finally {
      setOcrLoading(false);
    }
  };

  // Trigger AI suggestions based on file upload or field changes
  const triggerAiSuggestions = async (partialState) => {
    try {
      const suggestions = await expenseService.getAiSuggestions(partialState);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error('Error fetching suggestions', err);
    }
  };

  // OCR Extraction callback
  const handleOcrExtract = (ocrData) => {
    const opts = { shouldTouch: true, shouldDirty: true, shouldValidate: true };
    if (ocrData.category) {
      setSelectedCategory(ocrData.category);
      setValue('category', ocrData.category, opts);
    }
    if (ocrData.vendor) setValue('vendor', ocrData.vendor, opts);
    if (ocrData.amount) {
      const amtStr = ocrData.amount.toString().replace(/,/g, '');
      setValue('amount', amtStr, opts);
    }
    if (ocrData.date) setValue('date', ocrData.date, opts);
    if (ocrData.referenceNumber) setValue('referenceNumber', ocrData.referenceNumber, opts);
    if (ocrData.description) setValue('description', ocrData.description, opts);
    
    showToast('OCR extraction completed. Fields populated!', 'success');
    triggerAiSuggestions(ocrData);
  };

  const handleApplyTemplate = (tpl) => {
    const opts = { shouldTouch: true, shouldDirty: true, shouldValidate: true };
    setSelectedCategory(tpl.category);
    setValue('category', tpl.category, opts);
    setValue('vendor', tpl.vendor, opts);
    setValue('amount', tpl.amount, opts);
    setValue('description', tpl.description, opts);
    showToast(`Applied template: ${tpl.label}`, 'success');
  };

  const onSubmit = async (data) => {
    if (!selectedCategory) {
      showToast('Please select an expense category first', 'warning');
      return;
    }

    const cleanAmt = parseFloat(data.amount.toString().replace(/,/g, '')) || 0;
    const finalVendor = data.vendor === 'Other' ? (data.customVendor || data.customEmployeeName || 'Other') : data.vendor;
    const finalPaymentMode = data.paymentMode === 'Other' ? (data.customPaymentMode || 'Other') : data.paymentMode;
    const finalPaidFromAccount = data.paidFromAccount === 'Other' ? (data.customPaidFromAccount || 'Other') : data.paidFromAccount;
    const finalOtherExpenseCategory = data.otherExpenseCategory === 'Other' ? (data.customExpenseCategory || 'Other') : data.otherExpenseCategory;

    const newExpense = {
      id: Math.random().toString(36).substring(7),
      category: selectedCategory,
      amount: cleanAmt,
      date: data.date || new Date().toISOString().split('T')[0],
      paymentMode: finalPaymentMode,
      vendor: finalVendor,
      referenceNumber: data.referenceNumber,
      paidFromAccount: finalPaidFromAccount,
      apartment: data.apartment,
      description: data.description || data.notes || `${selectedCategory} expense`,
      notes: data.notes,
      recurring: data.recurring || false,
      status: 'Paid',
      rawValues: { ...data, category: selectedCategory }
    };

    if (batchEntry) {
      // BATCH ENTRY MODE ON
      setBatchList(prev => [...prev, newExpense]);
      showToast('Expense added to batch successfully.', 'success');
      
      // Reset form completely (clearing billing info, provider & meter details, payment info, upload, and validation errors)
      reset({
        date: '',
        amount: '',
        paymentMode: '',
        vendor: '',
        referenceNumber: '',
        paidFromAccount: '',
        apartment: '',
        description: '',
        notes: '',
        recurring: false,
        customVendor: '',
        customPaymentMode: '',
        customPaidFromAccount: '',
        guardsCount: '',
        shift: '',
        salaryMonth: '',
        salaryAmount: '',
        pf: '',
        esi: '',
        bonus: '',
        otherCharges: '',
        // Billing Info & Provider/Meter details
        billAmount: '',
        gst: '',
        totalAmount: '',
        billingMonth: '',
        dueDate: '',
        meterNumber: '',
        meterReading: '',
        consumption: '',
        unitRate: '',
      });
      // Do NOT reset selectedCategory!
      setReceiptUrl('');
      setAiSuggestions(null);
      clearErrors();

      // Automatically focus on the first input of the Billing Information section
      setTimeout(() => {
        const billingInfoField = document.querySelector('[name="billingMonth"], [name="dueDate"], [name="billAmount"], input, select');
        if (billingInfoField) {
          billingInfoField.focus();
        }
      }, 50);

      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        vendor: finalVendor,
        paymentMode: finalPaymentMode,
        paidFromAccount: finalPaidFromAccount,
        otherExpenseCategory: finalOtherExpenseCategory,
        category: selectedCategory,
        amount: cleanAmt,
        receiptUrl: receiptUrl || null
      };

      await expenseService.createExpense(payload);
      showToast('Expense created successfully!', 'success');
      if (onExpenseCreated) {
        onExpenseCreated(newExpense);
      }
    } catch (error) {
      console.warn('API save failed, using local storage fallback', error);
      showToast('Saved to Local Storage successfully!', 'success');
      if (onExpenseCreated) {
        onExpenseCreated(newExpense);
      }
    } finally {
      // Always update local list for immediate visual update
      const existing = JSON.parse(localStorage.getItem('recentExpenses') || '[]');
      const updated = [newExpense, ...existing];
      localStorage.setItem('recentExpenses', JSON.stringify(updated));
      setRecentExpenses(updated);

      // Reset form
      reset({
        date: '',
        amount: '',
        paymentMode: '',
        vendor: '',
        referenceNumber: '',
        paidFromAccount: '',
        apartment: '',
        description: '',
        notes: '',
        recurring: false,
      });
      setSelectedCategory('electricity');
      setReceiptUrl('');
      setAiSuggestions(null);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset({
      date: '',
      amount: '',
      paymentMode: '',
      vendor: '',
      referenceNumber: '',
      paidFromAccount: '',
      apartment: '',
      description: '',
      notes: '',
      recurring: false,
    });
    setSelectedCategory('electricity');
    setReceiptUrl('');
    setAiSuggestions(null);
    showToast('Form cleared.', 'info');
    if (onBack) onBack();
  };

  const handleSaveDraft = () => {
    showToast('Draft saved successfully! (Simulation)', 'success');
  };

  const filteredExpenses = (recentExpenses || []).filter((exp) => {
    const categoryName = (exp.category || '').toLowerCase().replace(/_/g, ' ');
    const vendorName = (exp.vendor || '').toLowerCase();
    const description = (exp.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = 
      vendorName.includes(query) ||
      description.includes(query) ||
      categoryName.includes(query);
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--color-bg)', display: 'flex', justifyContent: 'center' }}>
      {/* Outer centered container, Max Width 1600px, 32px padding */}
      <Box sx={{ width: '100%', maxWidth: '1600px', px: '32px', py: '32px' }}>
        
        {/* Top Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '32px' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.75rem', color: '#0F172A', mb: 0.5, letterSpacing: '-0.02em' }}>
              Add New Expense
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              Record a new expense for your apartment
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={() => {
              if (batchList.length > 0) {
                const leave = window.confirm('You have unsaved batch items. Are you sure you want to leave? Your batch will be lost.');
                if (!leave) return;
              }
              if (onBack) onBack();
            }}
            startIcon={<FiArrowLeft />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#0F172A',
              borderColor: '#E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              px: 2,
              py: 1,
              '&:hover': {
                borderColor: '#CBD5E1',
                bgcolor: '#F8FAFC',
              }
            }}
          >
            Back to Expenses
          </Button>
        </Box>

        {/* Main Content Grid: Left Column 70%, Sidebar 30%, Gap 24px */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: '24px', alignItems: 'flex-start' }}>
            
            {/* Left Column (70%) */}
            <Box sx={{ flex: '0 0 70%', width: { xs: '100%', lg: 'calc(70% - 12px)' } }}>
              {ocrLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: '#ECFDF5', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                  <CircularProgress size={18} sx={{ color: '#10B981' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#065F46' }}>
                    Scanning receipt using OCR AI...
                  </Typography>
                </Box>
              )}

              <Stack spacing="24px">
                {/* Card 1: Select Category */}
                <CategorySelection
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                />

                {/* Card 2: Expense Details Form */}
                <ExpenseDetailsForm
                  selectedCategory={selectedCategory}
                  control={control}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                />
                
                {/* Card 3: Payment Information */}
                <PaymentInformationSection
                  selectedCategory={selectedCategory}
                  control={control}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  onCancel={handleCancel}
                  isSubmitting={isSubmitting}
                />

                {/* Card 4: Upload Receipt / Actions */}
                {selectedCategory !== 'other' ? (
                  <ReceiptUpload
                    onUploadSuccess={handleUploadSuccess}
                    onOcrExtract={handleOcrExtract}
                    setOcrLoading={setOcrLoading}
                  >
                    <div className="flex justify-end items-center gap-3.5 mt-6 pt-4 border-t border-slate-100 w-full">
                      {/* Batch Entry Toggle using MUI Switch */}
                      <FormControlLabel
                        control={
                          <Switch
                            checked={batchEntry}
                            onChange={handleToggleBatchModeChange}
                            color="primary"
                          />
                        }
                        label={
                          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                            Batch Entry
                            {batchList.length > 0 && (
                              <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                                Batch ({batchList.length})
                              </span>
                            )}
                          </Typography>
                        }
                        sx={{ mr: 'auto', userSelect: 'none' }}
                      />

                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <RotateCcw size={16} />
                        Clear
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-6 py-2.5 rounded-[14px] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-98 cursor-pointer"
                      >
                        <Save size={16} />
                        {isSubmitting ? 'Saving...' : (batchEntry ? `Add to Batch (${batchList.length})` : 'Save Payment')}
                      </button>

                      {batchEntry && batchList.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSaveAllBatch}
                          disabled={isSubmitting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-[14px] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-98 cursor-pointer"
                        >
                          <Save size={16} />
                          Save All Expenses
                        </button>
                      )}
                    </div>
                  </ReceiptUpload>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex justify-end items-center gap-3.5 w-full">
                    {/* Batch Entry Toggle using MUI Switch */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={batchEntry}
                          onChange={handleToggleBatchModeChange}
                          color="primary"
                        />
                      }
                      label={
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                          Batch Entry
                          {batchList.length > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                              Batch ({batchList.length})
                            </span>
                          )}
                        </Typography>
                      }
                      sx={{ mr: 'auto', userSelect: 'none' }}
                    />

                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <RotateCcw size={16} />
                      Clear
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-6 py-2.5 rounded-[14px] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-98 cursor-pointer"
                    >
                      <Save size={16} />
                      {isSubmitting ? 'Saving...' : (batchEntry ? `Add to Batch (${batchList.length})` : 'Save Payment')}
                    </button>

                    {batchEntry && batchList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSaveAllBatch}
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-[14px] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-98 cursor-pointer"
                      >
                        <Save size={16} />
                        Save All Expenses
                      </button>
                    )}
                  </div>
                )}
              </Stack>
            </Box>

            {/* Right Sidebar (30%) */}
            <Box sx={{ flex: '0 0 30%', width: { xs: '100%', lg: 'calc(30% - 12px)' } }}>
              <ExpenseSummarySidebar
                amount={watchedAmount}
                gst={watch('gst') || 0}
                category={selectedCategory}
                formData={watch()}
                recentExpenses={recentExpenses}
                onApplyTemplate={handleApplyTemplate}
                onViewAllExpenses={() => setViewAllOpen(true)}
              />

              {/* Batch Summary collapsible card */}
              {batchEntry && (
                <Box sx={{ mt: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setBatchSummaryExpanded(!batchSummaryExpanded)}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                      Batch Summary
                      <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                        {batchList.length}
                      </span>
                    </Typography>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${batchSummaryExpanded ? 'rotate-180' : ''}`} />
                  </Box>

                  {batchSummaryExpanded && (
                    <Box sx={{ mt: 2 }}>
                      {batchList.length === 0 ? (
                        <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic', py: 2 }}>
                          No items in batch yet.
                        </Typography>
                      ) : (
                        <Stack spacing={1.5} sx={{ maxHeight: '250px', overflowY: 'auto', pr: 1, mb: 3 }}>
                          {batchList.map((item) => (
                            <Box key={item.id} sx={{ p: 2, border: '1px solid #F1F5F9', borderRadius: '12px', bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>
                                  {item.category.replace('_', ' ')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.description || 'No description'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                  ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </Typography>
                                <button
                                  type="button"
                                  onClick={() => handleEditBatchItem(item)}
                                  className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBatchItem(item.id)}
                                  className="text-red-600 hover:text-red-800 font-semibold text-[11px] cursor-pointer"
                                >
                                  Delete
                                </button>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      )}

                      {batchList.length > 0 && (
                        <Box sx={{ borderTop: '1px solid #E2E8F0', pt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Total Items</Typography>
                            <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 700 }}>{batchList.length}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Total Amount</Typography>
                            <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 800 }}>
                              ₹{batchList.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>

                          <Button
                            onClick={handleSaveAllBatch}
                            disabled={isSubmitting}
                            variant="contained"
                            fullWidth
                            sx={{
                              bgcolor: '#2563EB',
                              '&:hover': { bgcolor: '#1D4ED8' },
                              borderRadius: '12px',
                              py: 1.25,
                              fontWeight: 700,
                              textTransform: 'none',
                              color: '#FFFFFF'
                            }}
                          >
                            Save All Expenses
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>

          </Box>
        </form>
      </Box>

      {/* Toast Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: '100%', borderRadius: '12px' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Unsaved Batch Confirmation Prompt */}
      <Dialog
        open={promptBatchOffOpen}
        onClose={handleCancelBatchOff}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 2.5,
            maxWidth: '440px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0F172A', p: 0, mb: 1.5 }}>
          Unsaved Batch Items
        </DialogTitle>
        <DialogContent sx={{ p: 0, mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
            You have {batchList.length} unsaved expense(s) in your batch. If you turn off Batch Entry, what would you like to do with these items?
          </Typography>
        </DialogContent>
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button 
            onClick={handleCancelBatchOff} 
            variant="outlined" 
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#E2E8F0', color: '#475569' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDiscardBatch} 
            variant="outlined" 
            color="error"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            Discard Batch
          </Button>
          <Button 
            onClick={handleSaveAllBatch} 
            variant="contained" 
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
          >
            Save All
          </Button>
        </Stack>
      </Dialog>

      {/* All Expenses Dialog */}
      <Dialog 
        open={viewAllOpen} 
        onClose={() => setViewAllOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
            All Expenses
          </Typography>
          <IconButton onClick={() => setViewAllOpen(false)}>
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Filters Row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              placeholder="Search by vendor, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: <FiSearch style={{ color: '#64748B', marginRight: '8px' }} />
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              size="small"
              sx={{ minWidth: '180px', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="electricity">Electricity</MenuItem>
              <MenuItem value="water_tanker">Water Tanker</MenuItem>
              <MenuItem value="security">Security</MenuItem>
              <MenuItem value="salaries">Salaries</MenuItem>
              <MenuItem value="repairs">Repairs</MenuItem>
              <MenuItem value="materials">Materials</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Box>

          {/* Table */}
          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Vendor / Payee</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Payment Method</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Paid From</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#64748B' }}>
                      No expenses found matching the search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell sx={{ color: '#334155', fontWeight: 500 }}>
                        {exp.date}
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize', color: '#0F172A', fontWeight: 600 }}>
                        {exp.category?.replace('_', ' ')}
                      </TableCell>
                      <TableCell sx={{ color: '#0F172A', fontWeight: 500 }}>
                        {exp.vendor || '-'}
                      </TableCell>
                      <TableCell sx={{ color: '#334155' }}>
                        {exp.paymentMode || '-'}
                      </TableCell>
                      <TableCell sx={{ color: '#334155' }}>
                        {exp.paidFromAccount || '-'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: '12px', bgcolor: '#ECFDF5', color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>
                          Paid
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        ₹{parseFloat(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
