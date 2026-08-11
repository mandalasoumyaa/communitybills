import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Controller, useWatch } from 'react-hook-form';
import { FiCalendar, FiInfo, FiUploadCloud } from 'react-icons/fi';
import { RiBankLine } from 'react-icons/ri';
import { FiTool, FiDollarSign, FiCpu } from 'react-icons/fi';
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
      <FiCpu />
    </Box>
  </Box>
);

export default function RepairsForm({ control, register, errors, setValue }) {
  const labourCostVal = useWatch({ control, name: 'labourCost' }) || '';
  const materialCostVal = useWatch({ control, name: 'materialCost' }) || '';
  const otherChargesVal = useWatch({ control, name: 'otherCharges' }) || '';
  const notesVal = useWatch({ control, name: 'notes' }) || '';

  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);

  // Watch dropdown values to toggle custom inputs
  const watchedPaymentMode = useWatch({ control, name: 'paymentMode' });
  const watchedPaidFromAccount = useWatch({ control, name: 'paidFromAccount' });

  // Clear custom fields when switching back to predefined options
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
    const labour = parseFloat(labourCostVal) || 0;
    const material = parseFloat(materialCostVal) || 0;
    const other = parseFloat(otherChargesVal) || 0;
    const total = labour + material + other;

    setValue('amount', total || '');
    setValue('totalAmount', total || 0);
  }, [labourCostVal, materialCostVal, otherChargesVal, setValue]);

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 1, mt: -2 }}>
        Record repairs expense and payment information
      </Typography>

      {/* Section 1: Repair Details */}
      <SectionHeader icon={<FiTool />} title="Repair Details" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5 }}>
        {/* Row 1: Details */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
          <Box className="custom-input">
            <span className="custom-input-label">Vendor / Technician <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('vendor', { required: 'Required' })}
              placeholder="e.g. Sri Durga Electricals"
              fullWidth
              error={!!errors.vendor}
              helperText={errors.vendor?.message}
            />
          </Box>

          <Box className="custom-input">
            <span className="custom-input-label">Complaint / Work Order No.</span>
            <TextField
              {...register('referenceNumber')}
              placeholder="WO/2025/948"
              fullWidth
            />
          </Box>

          <Box className="custom-input">
            <span className="custom-input-label">Area / Location <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('apartment', { required: 'Required' })}
              placeholder="Block A - Parking Area"
              fullWidth
              error={!!errors.apartment}
              helperText={errors.apartment?.message}
            />
          </Box>
        </Box>

        {/* Row 2: Description */}
        <Box className="custom-input">
          <span className="custom-input-label">Work Description <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('description', { required: 'Required' })}
            placeholder="Street light wiring repair and replacement"
            fullWidth
            error={!!errors.description}
            helperText={errors.description?.message}
          />
        </Box>
      </Box>

      {/* Section 2: Repair Cost */}
      <SectionHeader icon={<FiDollarSign />} title="Repair Cost" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 2fr' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Labour Cost (₹) <span style={{ color: '#EF4444' }}>*</span></span>
          <TextField
            {...register('labourCost', { required: 'Required' })}
            type="number"
            placeholder="3500"
            fullWidth
            error={!!errors.labourCost}
            helperText={errors.labourCost?.message}
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
          <span className="custom-input-label">Material Cost (₹)</span>
          <TextField
            {...register('materialCost')}
            type="number"
            placeholder="6200"
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
            placeholder="800"
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

        <Box>
          <TotalAmountCard label="Total Cost (₹)" value={(parseFloat(labourCostVal) || 0) + (parseFloat(materialCostVal) || 0) + (parseFloat(otherChargesVal) || 0)} />
        </Box>
      </Box>



      {/* Upload Images (Optional) */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 2, mt: 3.5 }}>
        Upload Images (Optional)
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Before Image</span>
          <Box
            sx={{
              border: '2px dashed #E2E8F0',
              borderRadius: '16px',
              p: 2.5,
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
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => setBeforeImage(e.target.files[0]?.name || null)}
            />
            <FiUploadCloud size={28} style={{ color: '#64748B', marginBottom: '8px' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
              {beforeImage ? beforeImage : <>Drag & drop or <span style={{ color: '#2563EB' }}>Browse</span></>}
            </Typography>
          </Box>
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">After Image</span>
          <Box
            sx={{
              border: '2px dashed #E2E8F0',
              borderRadius: '16px',
              p: 2.5,
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
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => setAfterImage(e.target.files[0]?.name || null)}
            />
            <FiUploadCloud size={28} style={{ color: '#64748B', marginBottom: '8px' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
              {afterImage ? afterImage : <>Drag & drop or <span style={{ color: '#2563EB' }}>Browse</span></>}
            </Typography>
          </Box>
        </Box>
      </Box>

    </Box>
  );
}
