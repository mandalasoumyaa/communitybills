import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Controller, useWatch, useFieldArray } from 'react-hook-form';
import { FiCalendar, FiPlus, FiTrash2, FiInfo } from 'react-icons/fi';
import { RiBankLine } from 'react-icons/ri';
import { LuBuilding2, LuPackage, LuCoins, LuCalculator } from 'react-icons/lu';
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

const vendorsList = [
  'BuildWell Supplies',
  'UltraTech Cement Ltd',
  'Kamdhenu Steel',
  'Hardware & Electricals',
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

export default function MaterialsForm({ control, register, errors, setValue }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'materialsItems'
  });

  const watchedItems = useWatch({
    control,
    name: 'materialsItems'
  }) || [];

  const subtotalVal = useWatch({ control, name: 'amount' }) || 0;
  const gstVal = useWatch({ control, name: 'gst' }) || 0;
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
    if (fields.length === 0) {
      append({ name: '', quantity: '', price: '' });
    }
  }, [fields, append]);

  useEffect(() => {
    let subtotal = 0;
    watchedItems.forEach((item) => {
      const qty = parseFloat(item?.quantity) || 0;
      const price = parseFloat(item?.price) || 0;
      subtotal += qty * price;
    });

    const gst = 0;
    const grandTotal = subtotal;

    setValue('amount', subtotal || 0);
    setValue('gst', gst || 0);
    setValue('grandTotal', grandTotal || 0);
    setValue('totalAmount', grandTotal || 0);
  }, [watchedItems, setValue]);

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 1, mt: -2 }}>
        Record materials expense and payment information
      </Typography>

      {/* Section 1: Vendor Details */}
      <SectionHeader icon={<LuBuilding2 />} title="Vendor Details" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Vendor Name <span style={{ color: '#EF4444' }}>*</span></span>
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
                  renderValue: (value) => value || <span style={{ color: '#94A3B8' }}>Select Vendor</span>,
                  MenuProps: { PaperProps: { sx: { borderRadius: '12px', mt: 0.5 } } }
                }}
              >
                <MenuItem disabled value="">
                  <em>Select Vendor</em>
                </MenuItem>
                {vendorsList.map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>

        {/* Custom Vendor Input */}
        {watchedVendor === 'Other' && (
          <Box className="custom-input fade-slide-in">
            <span className="custom-input-label">Vendor Name * <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('customVendor', { required: watchedVendor === 'Other' ? 'Required' : false })}
              placeholder="Enter Vendor Name"
              fullWidth
              error={!!errors.customVendor}
              helperText={errors.customVendor ? errors.customVendor.message : "Enter the name manually since you selected 'Other'."}
            />
          </Box>
        )}

        <Box className="custom-input">
          <span className="custom-input-label">Invoice Number</span>
          <TextField
            {...register('referenceNumber')}
            placeholder="e.g. BWS/INV/0825"
            fullWidth
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Invoice Date <span style={{ color: '#EF4444' }}>*</span></span>
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

      {/* Section 2: Material Items */}
      <SectionHeader icon={<LuPackage />} title="Material Items" />
      <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 2 }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.5 }}>Item Name</TableCell>
              <TableCell width="120px" sx={{ fontWeight: 700, color: '#475569', py: 1.5 }}>Quantity</TableCell>
              <TableCell width="180px" sx={{ fontWeight: 700, color: '#475569', py: 1.5 }}>Unit Price (₹)</TableCell>
              <TableCell width="180px" sx={{ fontWeight: 700, color: '#475569', py: 1.5 }}>Amount (₹)</TableCell>
              <TableCell width="60px" align="center" sx={{ fontWeight: 700, color: '#475569', py: 1.5 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => {
              const qty = parseFloat(watchedItems[index]?.quantity) || 0;
              const price = parseFloat(watchedItems[index]?.price) || 0;
              const rowTotal = qty * price;

              return (
                <TableRow key={field.id}>
                  <TableCell sx={{ py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
                    <TextField
                      {...register(`materialsItems.${index}.name`, { required: 'Required' })}
                      placeholder="e.g. Cement"
                      fullWidth
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
                    <TextField
                      {...register(`materialsItems.${index}.quantity`, { required: 'Required' })}
                      type="number"
                      placeholder="20"
                      fullWidth
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
                    <TextField
                      {...register(`materialsItems.${index}.price`, { required: 'Required' })}
                      type="number"
                      placeholder="450"
                      fullWidth
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>₹</span>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5, borderBottom: '1px solid #F1F5F9', fontWeight: 600, color: '#0F172A' }}>
                    ₹{rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
                    <IconButton 
                      color="error" 
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      size="small"
                    >
                      <FiTrash2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        startIcon={<FiPlus />}
        onClick={() => append({ name: '', quantity: '', price: '' })}
        sx={{
          color: '#2563EB',
          fontWeight: 700,
          textTransform: 'none',
          fontSize: '0.85rem',
          mb: 3,
          '&:hover': { bgcolor: '#EFF6FF' }
        }}
      >
        Add Item
      </Button>

      {/* Section 3: Cost Summary */}
      <SectionHeader icon={<LuCoins />} title="Cost Summary" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 2fr' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Subtotal (₹)</span>
          <TextField
            value={subtotalVal}
            disabled
            fullWidth
            sx={{ bgcolor: '#F8FAFC' }}
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
          <TotalAmountCard label="Grand Total (₹)" value={subtotalVal} />
        </Box>
      </Box>

    </Box>
  );
}
