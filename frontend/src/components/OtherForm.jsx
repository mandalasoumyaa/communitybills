import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Controller, useWatch } from 'react-hook-form';
import { FiCalendar, FiInfo, FiUploadCloud, FiFileText } from 'react-icons/fi';
import { RiBankLine } from 'react-icons/ri';
import { FiCamera } from 'react-icons/fi';
import { LuCoins, LuCalculator } from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';

const paymentModes = [
  'Bank Transfer',
  'Cash',
  'UPI / QR Code',
  'Credit Card',
  'Cheque',
  'Other'
];

const accounts = [
  'SBI - Main Account',
  'HDFC - Reserve Account',
  'Petty Cash',
  'Maintenance Collection A/C',
  'Other'
];

const paymentStatuses = [
  'Paid',
  'Pending',
  'Unpaid'
];

const otherCategories = [
  'Office Supplies',
  'Miscellaneous',
  'Bank Charges',
  'Other'
];

const SectionHeader = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, mt: 4, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
    <Box sx={{ color: '#2563EB', display: 'flex', alignItems: 'center', fontSize: '1.2rem' }}>
      {icon}
    </Box>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
      {title}
    </Typography>
  </Box>
);

const TotalAmountCard = ({ label, value }) => (
  <Box
    sx={{
      bgcolor: '#ECFDF5',
      border: '1px solid #A7F3D0',
      borderRadius: '16px',
      p: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
      boxShadow: '0 2px 8px rgba(16,185,129,0.04)'
    }}
  >
    <Box>
      <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 700, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ color: '#047857', fontWeight: 800 }}>
        ₹{parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
        <FiCheckCircle size={14} style={{ color: '#10B981' }} />
        <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
          Auto Calculated
        </Typography>
      </Box>
    </Box>
    <Box sx={{ color: '#10B981', display: 'flex', fontSize: '2.2rem' }}>
      <LuCalculator />
    </Box>
  </Box>
);

export default function OtherForm({ control, register, errors, setValue }) {
  const amountVal = useWatch({ control, name: 'otherAmount' }) || '';
  const gstVal = useWatch({ control, name: 'otherGst' }) || '';
  const descVal = useWatch({ control, name: 'description' }) || '';
  const notesVal = useWatch({ control, name: 'notes' }) || '';
  const [fileName, setFileName] = useState('');

  // Watch dropdown values to toggle custom inputs
  const watchedCategory = useWatch({ control, name: 'otherExpenseCategory' });
  const watchedPaymentMode = useWatch({ control, name: 'paymentMode' });
  const watchedPaidFromAccount = useWatch({ control, name: 'paidFromAccount' });

  // Clear custom fields when switching back to predefined options
  useEffect(() => {
    if (watchedCategory !== 'Other') {
      setValue('customExpenseCategory', '');
    }
  }, [watchedCategory, setValue]);

  useEffect(() => {
    if (watchedPaymentMode !== 'Other') {
      setValue('customPaymentMode', '');
    }
  }, [watchedPaymentMode, setValue]);

  useEffect(() => {
    if (watchedPaidFromAccount !== 'Other') {
      setValue('customPaidFromAccount', '');
    }
  }, [watchedPaidFromAccount, setValue]);

  useEffect(() => {
    const amt = parseFloat(amountVal) || 0;
    const gst = parseFloat(gstVal) || 0;
    const total = amt + gst;

    setValue('amount', amt || '');
    setValue('totalAmount', total || 0);
  }, [amountVal, gstVal, setValue]);

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 1, mt: -2 }}>
        Record other expense and payment information
      </Typography>

      {/* Section 1: Expense Information */}
      <SectionHeader icon={<FiFileText />} title="Expense Information" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Expense Name <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('expenseName', { required: 'Required' })}
            placeholder="e.g. Office Stationery"
            fullWidth
            error={!!errors.expenseName}
            helperText={errors.expenseName?.message}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Vendor / Payee <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('vendor', { required: 'Required' })}
            placeholder="Enter vendor or payee"
            fullWidth
            error={!!errors.vendor}
            helperText={errors.vendor?.message}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Expense Category <span style={{ color: '#EF4444' }}>*</span></span>
          <Controller
            name="otherExpenseCategory"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                error={!!errors.otherExpenseCategory}
                helperText={errors.otherExpenseCategory?.message}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => value || <span style={{ color: '#94A3B8' }}>Select Category</span>,
                  MenuProps: { PaperProps: { sx: { borderRadius: '12px', mt: 0.5 } } }
                }}
              >
                <MenuItem disabled value="">
                  <em>Select Category</em>
                </MenuItem>
                {otherCategories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>

        {/* Custom Expense Category Input */}
        {watchedCategory === 'Other' && (
          <Box className="custom-input fade-slide-in">
            <span className="custom-input-label">Custom Category <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('customExpenseCategory', { required: watchedCategory === 'Other' ? 'Required' : false })}
              placeholder="Enter Expense Category"
              fullWidth
              error={!!errors.customExpenseCategory}
              helperText={errors.customExpenseCategory ? errors.customExpenseCategory.message : "Enter the name manually since you selected 'Other'."}
            />
          </Box>
        )}

        <Box className="custom-input">
          <span className="custom-input-label">Expense Date <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('date', { required: 'Required' })}
            type="date"
            fullWidth
            error={!!errors.date}
            helperText={errors.date?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiCalendar size={18} style={{ color: '#64748B' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* Section 2: Charges */}
      <SectionHeader icon={<LuCoins />} title="Charges" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 2fr' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Amount (₹) <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('otherAmount', { required: 'Required' })}
            type="number"
            placeholder="e.g. 2500"
            fullWidth
            error={!!errors.otherAmount}
            helperText={errors.otherAmount?.message}
          />
        </Box>

        <Box>
          <TotalAmountCard label="Total Amount (₹)" value={parseFloat(amountVal || 0)} />
        </Box>
      </Box>



      {/* Attachments (Optional) */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 2, mt: 3.5 }}>
        Attachments (Optional)
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Upload Receipt</span>
          <Box
            sx={{
              border: '2px dashed #E2E8F0',
              borderRadius: '16px',
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: '#FFFFFF',
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#2563EB', bgcolor: '#F8FAFC' }
            }}
            component="label"
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => setFileName(e.target.files[0]?.name || '')}
            />
            <FiUploadCloud size={32} style={{ color: '#3B82F6', marginBottom: '8px' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
              {fileName ? fileName : 'Drag & drop your file here'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
              or <span style={{ color: '#2563EB', fontWeight: 700 }}>Browse Files</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
              Supports: JPG, PNG, PDF (Max 5MB)
            </Typography>
          </Box>
        </Box>

        <Box>
          <span className="custom-input-label">Quick Upload Options</span>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
              }}
            >
              <Box sx={{ p: 1, bgcolor: '#F5F3FF', color: '#8B5CF6', borderRadius: '8px', display: 'flex' }}>
                <FiCamera size={18} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block' }}>Take Photo</Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>Capture bill using camera</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

    </Box>
  );
}
