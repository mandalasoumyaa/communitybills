import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Controller, useWatch } from 'react-hook-form';
import { FiCalendar, FiInfo } from 'react-icons/fi';
import { RiBankLine } from 'react-icons/ri';
import { LuPlugZap, LuReceipt, LuCalculator, LuCoins } from 'react-icons/lu';
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

const providers = [
  'TSNPDCL',
  'TSSPDCL',
  'BESCOM',
  'MSEDCL',
  'Tata Power',
  'Adani Electricity',
  'Other'
];

const paymentStatuses = [
  'Paid',
  'Pending',
  'Unpaid'
];

const billingMonths = [
  'January 2025',
  'February 2025',
  'March 2025',
  'April 2025',
  'May 2025',
  'June 2025',
  'July 2025',
  'August 2025',
  'September 2025',
  'October 2025',
  'November 2025',
  'December 2025'
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

export default function ElectricityForm({ control, register, errors, setValue }) {
  const amountVal = useWatch({ control, name: 'billAmount' }) || '';
  const gstVal = useWatch({ control, name: 'gst' }) || '';
  const descVal = useWatch({ control, name: 'description' }) || '';
  const notesVal = useWatch({ control, name: 'notes' }) || '';

  // Watch dropdown values to toggle custom inputs
  const watchedVendor = useWatch({ control, name: 'vendor' });
  const watchedPaymentMode = useWatch({ control, name: 'paymentMode' });
  const watchedPaidFromAccount = useWatch({ control, name: 'paidFromAccount' });

  // Clear custom fields when switching back to predefined options
  useEffect(() => {
    if (watchedVendor !== 'Other') {
      setValue('customVendor', '');
    }
  }, [watchedVendor, setValue]);

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
        Record electricity bill and payment information
      </Typography>

      {/* Section 1: Provider & Meter Details */}
      <SectionHeader icon={<LuPlugZap />} title="Provider & Meter Details" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Electricity Provider / Board <span style={{ color: '#EF4444' }}>*</span></span>
          <Controller
            name="vendor"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                error={!!errors.vendor}
                helperText={errors.vendor?.message}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => value || <span style={{ color: '#94A3B8' }}>-- Select Provider --</span>,
                  MenuProps: { PaperProps: { sx: { borderRadius: '12px', mt: 0.5 } } }
                }}
              >
                <MenuItem disabled value="">
                  <em>-- Select Provider --</em>
                </MenuItem>
                {providers.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>

        {/* Custom Electricity Provider Input */}
        {watchedVendor === 'Other' && (
          <Box className="custom-input fade-slide-in">
            <span className="custom-input-label">Provider Name <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('customVendor', { required: watchedVendor === 'Other' ? 'Required' : false })}
              placeholder="Enter Provider Name"
              fullWidth
              error={!!errors.customVendor}
              helperText={errors.customVendor ? errors.customVendor.message : "Enter the name manually since you selected 'Other'."}
            />
          </Box>
        )}

        <Box className="custom-input">
          <span className="custom-input-label">Consumer Number <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('consumerNumber', { required: 'Required' })}
            placeholder="Enter consumer number"
            fullWidth
            error={!!errors.consumerNumber}
            helperText={errors.consumerNumber?.message}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Meter Number (Optional)</span>
          <TextField
            {...register('meterNumber')}
            placeholder="Enter meter number"
            fullWidth
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Billing Month <span style={{ color: '#EF4444' }}>*</span></span>
          <Controller
            name="billingMonth"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <TextField
                {...field}
                type="month"
                fullWidth
                error={!!errors.billingMonth}
                helperText={errors.billingMonth?.message}
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
        </Box>
      </Box>

      {/* Section 2: Billing Information */}
      <SectionHeader icon={<LuReceipt />} title="Billing Information" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Bill Date <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('billDate', { required: 'Required' })}
            type="date"
            fullWidth
            error={!!errors.billDate}
            helperText={errors.billDate?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiCalendar size={18} style={{ color: '#64748B' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Due Date</span>
          <TextField
            {...register('dueDate')}
            type="date"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiCalendar size={18} style={{ color: '#64748B' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Units (kWh) <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('unitsConsumed', { required: 'Required' })}
            type="number"
            placeholder="678"
            fullWidth
            error={!!errors.unitsConsumed}
            helperText={errors.unitsConsumed?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>kWh</span>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Amount (₹) <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('billAmount', { required: 'Required' })}
            type="number"
            placeholder="4500"
            fullWidth
            error={!!errors.billAmount}
            helperText={errors.billAmount?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* Section 3: Charges Summary */}
      <SectionHeader icon={<LuCoins />} title="Charges Summary" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box>
          <TotalAmountCard label="Total Amount (₹)" value={parseFloat(amountVal || 0)} />
        </Box>
      </Box>

    </Box>
  );
}
