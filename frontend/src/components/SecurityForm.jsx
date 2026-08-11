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
import { GoShield } from 'react-icons/go';
import { FiUsers } from 'react-icons/fi';
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

const securityAgencies = [
  'Shield Security Services',
  'Sentinel Guard Group',
  'G4S Security',
  'Other'
];

const shifts = [
  '24x7',
  'Day Shift (12h)',
  'Night Shift (12h)',
  '8 Hours Shift'
];

const months = [
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

const paymentStatuses = [
  'Paid',
  'Pending',
  'Unpaid'
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

export default function SecurityForm({ control, register, errors, setValue }) {
  const salaryVal = useWatch({ control, name: 'salaryAmount' }) || '';
  const pfVal = useWatch({ control, name: 'pf' }) || '';
  const esiVal = useWatch({ control, name: 'esi' }) || '';
  const bonusVal = useWatch({ control, name: 'bonus' }) || '';
  const otherChargesVal = useWatch({ control, name: 'otherCharges' }) || '';
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
    const salary = parseFloat(salaryVal) || 0;
    const pf = parseFloat(pfVal) || 0;
    const esi = parseFloat(esiVal) || 0;
    const bonus = parseFloat(bonusVal) || 0;
    const other = parseFloat(otherChargesVal) || 0;

    const total = salary + pf + esi + bonus + other;
    setValue('amount', total || '');
    setValue('totalAmount', total || 0);
  }, [salaryVal, pfVal, esiVal, bonusVal, otherChargesVal, setValue]);

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 1, mt: -2 }}>
        Record security agency and payment information
      </Typography>

      {/* Section 1: Security Agency Details */}
      <SectionHeader icon={<GoShield />} title="Security Agency" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Security Agency <span style={{ color: '#EF4444' }}>*</span></span>
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
                  renderValue: (value) => value || <span style={{ color: '#94A3B8' }}>Select Agency</span>,
                  MenuProps: { PaperProps: { sx: { borderRadius: '12px', mt: 0.5 } } }
                }}
              >
                <MenuItem disabled value="">
                  <em>Select Agency</em>
                </MenuItem>
                {securityAgencies.map((agency) => (
                  <MenuItem key={agency} value={agency}>
                    {agency}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>

        {/* Custom Security Agency Input */}
        {watchedVendor === 'Other' && (
          <Box className="custom-input fade-slide-in">
            <span className="custom-input-label">Security Agency Name <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('customVendor', { required: watchedVendor === 'Other' ? 'Required' : false })}
              placeholder="Enter Security Agency Name"
              fullWidth
              error={!!errors.customVendor}
              helperText={errors.customVendor ? errors.customVendor.message : "Enter the name manually since you selected 'Other'."}
            />
          </Box>
        )}

        <Box className="custom-input">
          <span className="custom-input-label">Contact Person</span>
          <TextField
            {...register('contactPerson')}
            placeholder="Ramesh Kumar"
            fullWidth
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Invoice Number</span>
          <TextField
            {...register('referenceNumber')}
            placeholder="SSS/INV/2025"
            fullWidth
          />
        </Box>
      </Box>

      {/* Section 2: Staff Details */}
      <SectionHeader icon={<FiUsers />} title="Staff Details" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Number of Guards <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('guardsCount', { required: 'Required' })}
            type="number"
            placeholder="6"
            fullWidth
            error={!!errors.guardsCount}
            helperText={errors.guardsCount?.message}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Shift <span style={{ color: '#EF4444' }}>*</span></span>
          <Controller
            name="shift"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                error={!!errors.shift}
                helperText={errors.shift?.message}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => value || <span style={{ color: '#94A3B8' }}>Select Shift</span>,
                  MenuProps: { PaperProps: { sx: { borderRadius: '12px', mt: 0.5 } } }
                }}
              >
                <MenuItem disabled value="">
                  <em>Select Shift</em>
                </MenuItem>
                {shifts.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Month <span style={{ color: '#EF4444' }}>*</span></span>
          <Controller
            name="salaryMonth"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <TextField
                {...field}
                type="month"
                fullWidth
                error={!!errors.salaryMonth}
                helperText={errors.salaryMonth?.message}
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
        </Box>
      </Box>

      {/* Section 3: Salary Summary */}
      <SectionHeader icon={<LuCoins />} title="Salary Summary" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5 }}>
        {/* Row 1: 5 equal columns for all salary detail inputs */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(180px, 1fr))' }, gap: 2.5 }}>
          <Box className="custom-input">
            <span className="custom-input-label">Salary Amount (₹) <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('salaryAmount', { required: 'Required' })}
              type="number"
              placeholder="35000"
              fullWidth
              error={!!errors.salaryAmount}
              helperText={errors.salaryAmount?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box className="custom-input">
            <span className="custom-input-label">PF (₹)</span>
            <TextField
              {...register('pf')}
              type="number"
              placeholder="4300"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box className="custom-input">
            <span className="custom-input-label">ESI (₹)</span>
            <TextField
              {...register('esi')}
              type="number"
              placeholder="1200"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box className="custom-input">
            <span className="custom-input-label">Bonus (₹)</span>
            <TextField
              {...register('bonus')}
              type="number"
              placeholder="1000"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box className="custom-input">
            <span className="custom-input-label">Other Charges (₹)</span>
            <TextField
              {...register('otherCharges')}
              type="number"
              placeholder="600"
              fullWidth
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

        {/* Row 2: Full width total card */}
        <Box>
          <TotalAmountCard 
            label="Total Amount (₹)" 
            value={
              (parseFloat(salaryVal) || 0) + 
              (parseFloat(pfVal) || 0) + 
              (parseFloat(esiVal) || 0) + 
              (parseFloat(bonusVal) || 0) + 
              (parseFloat(otherChargesVal) || 0)
            } 
          />
        </Box>
      </Box>
    </Box>
  );
}
