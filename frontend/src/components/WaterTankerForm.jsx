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
import { IoWaterOutline } from 'react-icons/io5';
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

const tankerSuppliers = [
  'AWC Water Suppliers',
  'Sri Balaji Water Supply',
  'Metro Water Services',
  'Other'
];

const capacities = [
  '6,000 L',
  '10,000 L',
  '12,000 L',
  '20,000 L'
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

export default function WaterTankerForm({ control, register, errors, setValue }) {
  const numTankers = useWatch({ control, name: 'numberOfTankers' }) || '';
  const capacityStr = useWatch({ control, name: 'capacityPerTanker' }) || '';
  const rateTanker = useWatch({ control, name: 'ratePerTanker' }) || '';
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
    const tankers = parseFloat(numTankers) || 0;
    const capacity = parseFloat(String(capacityStr).replace(/[^0-9.]/g, '')) || 0;
    const rate = parseFloat(rateTanker) || 0;
    const gst = parseFloat(gstVal) || 0;

    const totalLitres = tankers * capacity;
    const subtotal = tankers * rate;
    const totalAmount = subtotal + gst;

    setValue('totalLitres', totalLitres ? `${totalLitres.toLocaleString('en-IN')} L` : '');
    setValue('amount', subtotal || '');
    setValue('totalAmount', totalAmount || 0);
  }, [numTankers, capacityStr, rateTanker, gstVal, setValue]);

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 1, mt: -2 }}>
        Record water tanker expense and payment information
      </Typography>

      {/* Section 1: Tanker Details */}
      <SectionHeader icon={<IoWaterOutline />} title="Tanker Details" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Tanker Supplier <span style={{ color: '#EF4444' }}>*</span></span>
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
                  renderValue: (value) => value || <span style={{ color: '#94A3B8' }}>Select Supplier</span>,
                  MenuProps: { PaperProps: { sx: { borderRadius: '12px', mt: 0.5 } } }
                }}
              >
                <MenuItem disabled value="">
                  <em>Select Supplier</em>
                </MenuItem>
                {tankerSuppliers.map((supplier) => (
                  <MenuItem key={supplier} value={supplier}>
                    {supplier}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>

        {/* Custom Supplier Input */}
        {watchedVendor === 'Other' && (
          <Box className="custom-input fade-slide-in">
            <span className="custom-input-label">Supplier Name <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('customVendor', { required: watchedVendor === 'Other' ? 'Required' : false })}
              placeholder="Enter Supplier Name"
              fullWidth
              error={!!errors.customVendor}
              helperText={errors.customVendor ? errors.customVendor.message : "Enter the name manually since you selected 'Other'."}
            />
          </Box>
        )}

        <Box className="custom-input">
          <span className="custom-input-label">Number of Tankers <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('numberOfTankers', { required: 'Required' })}
            type="number"
            placeholder="e.g. 5"
            fullWidth
            error={!!errors.numberOfTankers}
            helperText={errors.numberOfTankers?.message}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Capacity per Tanker (Litres) <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('capacityPerTanker', { 
              required: 'Please enter tanker capacity.',
              validate: value => {
                const val = parseFloat(value);
                return (!isNaN(val) && val > 0) || 'Please enter tanker capacity.';
              }
            })}
            type="number"
            inputProps={{ step: "any", min: "0.0001" }}
            placeholder="Enter capacity in litres"
            fullWidth
            error={!!errors.capacityPerTanker}
            helperText={errors.capacityPerTanker?.message}
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Delivery Date <span style={{ color: '#EF4444' }}>*</span></span>
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

      {/* Section 2: Charges Summary */}
      <SectionHeader icon={<LuCoins />} title="Charges Summary" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 2fr' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Rate per Tanker (₹) <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('ratePerTanker', { required: 'Required' })}
            type="number"
            placeholder="e.g. 1250"
            fullWidth
            error={!!errors.ratePerTanker}
            helperText={errors.ratePerTanker?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box>
          <TotalAmountCard label="Total Amount (₹)" value={(parseFloat(numTankers) || 0) * (parseFloat(rateTanker) || 0)} />
        </Box>
      </Box>

    </Box>
  );
}
