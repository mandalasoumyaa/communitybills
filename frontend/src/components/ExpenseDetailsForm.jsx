import React from 'react';
import { Box, Typography } from '@mui/material';

// Import all sub-forms
import ElectricityForm from './ElectricityForm';
import WaterTankerForm from './WaterTankerForm';
import SecurityForm from './SecurityForm';
import SalaryForm from './SalaryForm';
import MaterialsForm from './MaterialsForm';
import RepairsForm from './RepairsForm';
import OtherForm from './OtherForm';

export default function ExpenseDetailsForm({ selectedCategory, control, register, errors, setValue }) {
  
  // Render form based on selectedCategory
  const renderForm = () => {
    switch (selectedCategory) {
      case 'electricity':
        return <ElectricityForm control={control} register={register} errors={errors} setValue={setValue} />;
      case 'water_tanker':
        return <WaterTankerForm control={control} register={register} errors={errors} setValue={setValue} />;
      case 'security':
        return <SecurityForm control={control} register={register} errors={errors} setValue={setValue} />;
      case 'salaries':
        return <SalaryForm control={control} register={register} errors={errors} setValue={setValue} />;
      case 'materials':
        return <MaterialsForm control={control} register={register} errors={errors} setValue={setValue} />;
      case 'repairs':
        return <RepairsForm control={control} register={register} errors={errors} setValue={setValue} />;
      case 'other':
      default:
        return <OtherForm control={control} register={register} errors={errors} setValue={setValue} />;
    }
  };

  return (
    <Box className="premium-card" sx={{ mb: 3 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>
          Expense Details
        </Typography>
      </Box>

      {/* Render selected form with CSS animation */}
      <Box key={selectedCategory} className="fade-slide-in">
        {renderForm()}
      </Box>
    </Box>
  );
}
