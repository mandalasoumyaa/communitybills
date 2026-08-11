import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Controller, useWatch } from 'react-hook-form';
import { FiCalendar, FiUser, FiInfo } from 'react-icons/fi';
import { RiBankLine } from 'react-icons/ri';
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

const employees = [
  { name: 'Suresh Kumar', id: 'EMP1021', designation: 'Maintenance Staff' },
  { name: 'Ramesh Sharma', id: 'EMP1022', designation: 'Plumber' },
  { name: 'Amit Singh', id: 'EMP1023', designation: 'Electrician' },
  { name: 'Other', id: '', designation: '' }
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

export default function SalaryForm({ control, register, errors, setValue }) {
  const basicSalaryVal = useWatch({ control, name: 'basicSalary' }) || '';
  const bonusVal = useWatch({ control, name: 'bonus' }) || '';
  const allowancesVal = useWatch({ control, name: 'allowances' }) || '';
  const deductionsVal = useWatch({ control, name: 'deductions' }) || '';
  const employeeNameSelected = useWatch({ control, name: 'employeeName' }) || '';
  const descVal = useWatch({ control, name: 'description' }) || '';
  const notesVal = useWatch({ control, name: 'notes' }) || '';

  // Watch dropdown values to toggle custom inputs
  const watchedEmployeeName = useWatch({ control, name: 'employeeName' });
  const watchedPaymentMode = useWatch({ control, name: 'paymentMode' });
  const watchedPaidFromAccount = useWatch({ control, name: 'paidFromAccount' });

  // Clear custom fields when switching back to predefined options
  useEffect(() => {
    if (watchedEmployeeName !== 'Other') {
      setValue('customEmployeeName', '');
      setValue('customVendor', '');
    }
  }, [watchedEmployeeName, setValue]);

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
    if (employeeNameSelected) {
      const matched = employees.find(emp => emp.name === employeeNameSelected);
      if (matched && matched.name !== 'Other') {
        setValue('employeeId', matched.id);
        setValue('designation', matched.designation);
        setValue('vendor', matched.name);
      } else if (employeeNameSelected === 'Other') {
        setValue('vendor', 'Other');
      }
    }
  }, [employeeNameSelected, setValue]);

  useEffect(() => {
    const basic = parseFloat(basicSalaryVal) || 0;
    const bonus = parseFloat(bonusVal) || 0;
    const allowances = parseFloat(allowancesVal) || 0;
    const deductions = parseFloat(deductionsVal) || 0;

    const netSalary = basic + bonus + allowances - deductions;
    setValue('amount', netSalary || '');
    setValue('totalAmount', netSalary || 0);
  }, [basicSalaryVal, bonusVal, allowancesVal, deductionsVal, setValue]);

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 1, mt: -2 }}>
        Record salaries expense and payment information
      </Typography>

      {/* Section 1: Employee Details */}
      <SectionHeader icon={<FiUser />} title="Employee Details" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
        <Box className="custom-input">
          <span className="custom-input-label">Employee Name <span style={{ color: '#EF4444' }}>*</span></span>
          <Controller
            name="employeeName"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                error={!!errors.employeeName}
                helperText={errors.employeeName?.message}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => value || <span style={{ color: '#94A3B8' }}>Select Employee</span>,
                  MenuProps: { PaperProps: { sx: { borderRadius: '12px', mt: 0.5 } } }
                }}
              >
                <MenuItem disabled value="">
                  <em>Select Employee</em>
                </MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.name} value={emp.name}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>

        {/* Custom Employee Name Input */}
        {watchedEmployeeName === 'Other' && (
          <Box className="custom-input fade-slide-in">
            <span className="custom-input-label">Employee Name * <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('customEmployeeName', { required: watchedEmployeeName === 'Other' ? 'Required' : false })}
              placeholder="Enter Employee Name"
              fullWidth
              error={!!errors.customEmployeeName}
              helperText={errors.customEmployeeName ? errors.customEmployeeName.message : "Enter the name manually since you selected 'Other'."}
              onChange={(e) => {
                setValue('vendor', e.target.value); // vendor maps to employee name
                setValue('customVendor', e.target.value);
              }}
            />
          </Box>
        )}

        <Box className="custom-input">
          <span className="custom-input-label">Employee ID</span>
          <TextField
            {...register('employeeId')}
            placeholder="e.g. EMP1021"
            fullWidth
          />
        </Box>

        <Box className="custom-input">
          <span className="custom-input-label">Designation</span>
          <TextField
            {...register('designation')}
            placeholder="e.g. Maintenance Staff"
            fullWidth
          />
        </Box>
      </Box>

      {/* Section 2: Salary Details */}
      <SectionHeader icon={<LuCoins />} title="Salary Details" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }, gap: 2.5 }}>
          <Box className="custom-input">
            <span className="custom-input-label">Basic Salary (₹) <span style={{ color: '#EF4444' }}>*</span></span>
            <TextField
              {...register('basicSalary', { required: 'Required' })}
              type="number"
              placeholder="50000"
              fullWidth
              error={!!errors.basicSalary}
              helperText={errors.basicSalary?.message}
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
              placeholder="5000"
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
            <span className="custom-input-label">Allowances (₹)</span>
            <TextField
              {...register('allowances')}
              type="number"
              placeholder="3000"
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
            <span className="custom-input-label">Deductions (₹)</span>
            <TextField
              {...register('deductions')}
              type="number"
              placeholder="4000"
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

        <Box>
          <TotalAmountCard 
            label="Net Salary (₹)" 
            value={
              (parseFloat(basicSalaryVal) || 0) + 
              (parseFloat(bonusVal) || 0) + 
              (parseFloat(allowancesVal) || 0) - 
              (parseFloat(deductionsVal) || 0)
            } 
          />
        </Box>
      </Box>

    </Box>
  );
}
