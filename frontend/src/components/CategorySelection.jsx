import React from 'react';
import { Box, Typography } from '@mui/material';
import { FiUsers, FiTool, FiBox, FiMoreHorizontal } from 'react-icons/fi';
import { BsLightningCharge } from 'react-icons/bs';
import { IoWaterOutline } from 'react-icons/io5';
import { GoShield } from 'react-icons/go';

const categoryThemes = {
  electricity: {
    icon: (selected) => <BsLightningCharge size={22} style={{ color: selected ? '#FFFFFF' : '#2563EB' }} />,
    bg: '#EFF6FF',
    selectedBg: '#2563EB'
  },
  water_tanker: {
    icon: (selected) => <IoWaterOutline size={22} style={{ color: selected ? '#FFFFFF' : '#0EA5E9' }} />,
    bg: '#E0F2FE',
    selectedBg: '#2563EB'
  },
  security: {
    icon: (selected) => <GoShield size={22} style={{ color: selected ? '#FFFFFF' : '#0D9488' }} />,
    bg: '#E6F4F1',
    selectedBg: '#2563EB'
  },
  salaries: {
    icon: (selected) => <FiUsers size={22} style={{ color: selected ? '#FFFFFF' : '#EA580C' }} />,
    bg: '#FFEFE6',
    selectedBg: '#2563EB'
  },
  repairs: {
    icon: (selected) => <FiTool size={22} style={{ color: selected ? '#FFFFFF' : '#16A34A' }} />,
    bg: '#EAF8F0',
    selectedBg: '#2563EB'
  },
  materials: {
    icon: (selected) => <FiBox size={22} style={{ color: selected ? '#FFFFFF' : '#B45309' }} />,
    bg: '#FEF3C7',
    selectedBg: '#2563EB'
  },
  other: {
    icon: (selected) => <FiMoreHorizontal size={22} style={{ color: selected ? '#FFFFFF' : '#64748B' }} />,
    bg: '#F1F5F9',
    selectedBg: '#2563EB'
  },
};

const defaultCategories = [
  { id: 'electricity', name: 'Electricity' },
  { id: 'water_tanker', name: 'Water Tanker' },
  { id: 'security', name: 'Security' },
  { id: 'salaries', name: 'Salaries' },
  { id: 'repairs', name: 'Repairs' },
  { id: 'materials', name: 'Materials' },
  { id: 'other', name: 'Other' },
];

export default function CategorySelection({ selectedCategory, onSelectCategory, categories = [] }) {
  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <Box className="premium-card" sx={{ mb: 3 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem', fontFamily: 'system-ui' }}>
          Select Category
        </Typography>
      </Box>

      {/* Row of 7 Category Cards */}
      <Box
        className="no-scrollbar"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '14px',
          overflowX: 'auto',
          pb: 0.5,
        }}
      >
        {displayCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const theme = categoryThemes[cat.id] || categoryThemes.other;

          return (
            <Box
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              sx={{
                width: '124px',
                height: '116px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                border: isSelected ? '2px solid #2563EB' : '1px solid #F1F5F9',
                outline: isSelected ? '1.5px solid #2563EB' : 'none',
                outlineOffset: '2px',
                bgcolor: isSelected ? '#2563EB' : '#FAF9F6',
                cursor: 'pointer',
                transition: 'all 0.23s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 8px 20px rgba(37,99,235,0.2)' : 'none',
                '&:hover': {
                  borderColor: isSelected ? '#2563EB' : '#CBD5E1',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              {/* Icon Circle */}
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  bgcolor: isSelected ? 'rgba(255, 255, 255, 0.2)' : theme.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                  transition: 'all 0.23s ease',
                }}
              >
                {theme.icon(isSelected)}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  textAlign: 'center',
                  fontFamily: 'system-ui'
                }}
              >
                {cat.name}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
