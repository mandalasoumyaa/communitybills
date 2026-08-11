import React from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemAvatar, ListItemText, Avatar, Button, Stack } from '@mui/material';
import { FiFileText, FiClock } from 'react-icons/fi';
import { BsLightningCharge, BsLightbulb } from 'react-icons/bs';
import { IoWaterOutline } from 'react-icons/io5';
import { GoShield } from 'react-icons/go';
import { FiUsers, FiMoreHorizontal } from 'react-icons/fi';
import { MdOutlineBookmarkBorder } from 'react-icons/md';

const recentIcons = {
  electricity: <BsLightningCharge size={16} />,
  water_tanker: <IoWaterOutline size={16} />,
  security: <GoShield size={16} />,
};

const recentColors = {
  electricity: '#3B82F6',
  water_tanker: '#0EA5E9',
  security: '#8B5CF6',
};

const freqUsedTemplates = [
  { label: 'Electricity Bill', category: 'electricity', vendor: 'TSNPDCL', amount: '9850.00', description: 'Electricity bill payment for common area - May 2025' },
  { label: 'Water Tanker', category: 'water_tanker', vendor: 'Water Supply Corp', amount: '6000.00', description: 'Water tanker supply' },
  { label: 'Security Salary', category: 'security', vendor: 'Security Agency', amount: '18500.00', description: 'Security guards monthly salaries' },
  { label: 'Lift Maintenance', category: 'lift_maintenance', vendor: 'Otis Elevators', amount: '4500.00', description: 'Routine lift maintenance check' },
  { label: 'Housekeeping', category: 'housekeeping', vendor: 'CleanForce Ltd', amount: '12000.00', description: 'Monthly housekeeping charges' },
];

const categoryTitles = {
  electricity: 'Electricity Bill',
  water_tanker: 'Water Tanker',
  security: 'Security Salary',
  salaries: 'Salaries',
  repairs: 'Repairs',
  materials: 'Materials',
  other: 'Other',
  lift_maintenance: 'Lift Maintenance',
  housekeeping: 'Housekeeping'
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

export default function ExpenseSummarySidebar({ 
  amount = 0, 
  gst = 0, 
  recentExpenses = [],
  onApplyTemplate,
  onViewAllExpenses,
  category = 'electricity',
  formData = {}
}) {
  const cleanAmountStr = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
  const parsedAmount = parseFloat(cleanAmountStr) || 0;
  const parsedGst = parseFloat(gst) || 0;
  const total = parsedAmount + parsedGst;

  // Static fallback list if recentExpenses is empty to match the reference mockup exactly
  const displayRecents = recentExpenses.length > 0 ? recentExpenses : [
    { id: '1', category: 'electricity', amount: 9748.0, date: '28 Apr 2025', status: 'Paid', title: 'Electricity Bill' },
    { id: '2', category: 'water_tanker', amount: 6000.0, date: '25 Apr 2025', status: 'Paid', title: 'Water Tanker' },
    { id: '3', category: 'security', amount: 18500.0, date: '25 Apr 2025', status: 'Paid', title: 'Security Salary' },
  ];

  // Helper to format values as currency
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Dynamically render the summary rows depending on selected category
  const renderSummaryContent = () => {
    switch (category) {
      case 'water_tanker': {
        const tankersCount = formData.numberOfTankers || 0;
        const totalLitres = formData.totalLitres || '0 L';
        const subtotal = parseFloat(formData.amount) || 0;
        const gstVal = parseFloat(formData.gst) || 0;
        const totalAmount = subtotal + gstVal;

        return (
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Total Tankers</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{tankersCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Total Litres</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{totalLitres}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Amount</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(subtotal)}</Typography>
            </Box>
            <Divider sx={{ my: 0.5, borderColor: '#E2E8F0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Total Amount</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.25rem' }}>
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>
          </Stack>
        );
      }

      case 'security': {
        const guards = formData.guardsCount || 0;
        const salary = parseFloat(formData.salaryAmount) || 0;
        const pf = parseFloat(formData.pf) || 0;
        const esi = parseFloat(formData.esi) || 0;
        const totalVal = parseFloat(formData.amount) || 0;

        return (
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Guards</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{guards}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Salary</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(salary)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>PF</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(pf)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>ESI</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(esi)}</Typography>
            </Box>
            <Divider sx={{ my: 0.5, borderColor: '#E2E8F0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Total Amount</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.25rem' }}>
                {formatCurrency(totalVal)}
              </Typography>
            </Box>
          </Stack>
        );
      }

      case 'salaries': {
        const basic = parseFloat(formData.basicSalary) || 0;
        const bonus = parseFloat(formData.bonus) || 0;
        const allowances = parseFloat(formData.allowances) || 0;
        const deductions = parseFloat(formData.deductions) || 0;
        const net = parseFloat(formData.amount) || 0;

        return (
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Basic Salary</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(basic)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Bonus</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(bonus)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Allowances</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(allowances)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Deductions</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(deductions)}</Typography>
            </Box>
            <Divider sx={{ my: 0.5, borderColor: '#E2E8F0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Net Salary</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.25rem' }}>
                {formatCurrency(net)}
              </Typography>
            </Box>
          </Stack>
        );
      }

      case 'materials': {
        const subtotal = parseFloat(formData.amount) || 0;
        const grandTotal = parseFloat(formData.grandTotal) || 0;

        return (
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Subtotal</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(subtotal)}</Typography>
            </Box>
            <Divider sx={{ my: 0.5, borderColor: '#E2E8F0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Grand Total</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.25rem' }}>
                {formatCurrency(grandTotal)}
              </Typography>
            </Box>
          </Stack>
        );
      }

      case 'repairs': {
        const labour = parseFloat(formData.labourCost) || 0;
        const material = parseFloat(formData.materialCost) || 0;
        const other = parseFloat(formData.otherCharges) || 0;
        const totalVal = labour + material + other;

        return (
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Labour Cost</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(labour)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Material Cost</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(material)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Other Charges</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(other)}</Typography>
            </Box>
            <Divider sx={{ my: 0.5, borderColor: '#E2E8F0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Total Cost</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.25rem' }}>
                {formatCurrency(totalVal)}
              </Typography>
            </Box>
          </Stack>
        );
      }

      case 'electricity': {
        const units = formData.unitsConsumed || 0;
        const billAmt = parseFloat(formData.billAmount) || 0;
        const totalVal = parseFloat(formData.totalAmount) || 0;

        return (
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Units Consumed</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{units} kWh</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Bill Amount</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(billAmt)}</Typography>
            </Box>
            <Divider sx={{ my: 0.5, borderColor: '#E2E8F0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Total Amount</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.25rem' }}>
                {formatCurrency(totalVal)}
              </Typography>
            </Box>
          </Stack>
        );
      }

      case 'other': {
        const amt = parseFloat(formData.otherAmount) || 0;
        const totalVal = amt;

        return (
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Expense Amount</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(amt)}</Typography>
            </Box>
            <Divider sx={{ my: 0.5, borderColor: '#E2E8F0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Total Amount</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.25rem' }}>
                {formatCurrency(totalVal)}
              </Typography>
            </Box>
          </Stack>
        );
      }

      default: {
        return (
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>Amount</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                ₹{parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Divider sx={{ my: 0.5, borderColor: '#E2E8F0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Total Amount</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '1.25rem' }}>
                ₹{parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Stack>
        );
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Card 1: Expense Summary */}
      <Box className="premium-card">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
          <FiFileText size={18} style={{ color: '#2563EB', marginRight: '8px' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
            Expense Summary
          </Typography>
        </Box>
        {renderSummaryContent()}

        {/* Blue Tip Box */}
        <Box 
          sx={{ 
            bgcolor: '#EFF6FF', 
            borderRadius: '12px', 
            p: 2, 
            display: 'flex', 
            gap: 1.5, 
            alignItems: 'flex-start',
            border: '1px solid #DBEAFE'
          }}
        >
          <BsLightbulb size={18} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
          <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600, lineHeight: 1.4, fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 700 }}>Tip:</span> Please ensure the bill/receipt is clear and readable.
          </Typography>
        </Box>
      </Box>




      {/* Card 3: Recent Expenses */}
      <Box className="premium-card">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FiClock size={18} style={{ color: '#2563EB', marginRight: '8px' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
            Recent Expenses
          </Typography>
        </Box>
        
        <List disablePadding>
          {displayRecents.map((exp, idx) => {
            const cat = exp.category;
            const iconColor = recentColors[cat] || '#64748B';
            const iconBg = `${iconColor}15`;

            return (
              <React.Fragment key={exp.id || idx}>
                <ListItem alignItems="center" sx={{ px: 0, py: 1.5 }}>
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Avatar 
                      sx={{ 
                        width: 34, 
                        height: 34, 
                        bgcolor: iconBg, 
                        color: iconColor 
                      }}
                    >
                      {recentIcons[cat] || <FiMoreHorizontal size={16} />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                          {exp.title || categoryTitles[cat] || cat || 'Expense'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                          ₹{parseFloat(exp.amount).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {formatDate(exp.date)} • <span style={{ color: '#10B981', fontWeight: 700 }}>Paid</span>
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {idx < displayRecents.length - 1 && <Divider component="li" sx={{ borderColor: '#F1F5F9' }} />}
              </React.Fragment>
            );
          })}
        </List>
        
        <Button
          fullWidth
          variant="text"
          onClick={onViewAllExpenses}
          sx={{
            mt: 2,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            '&:hover': {
              bgcolor: '#EFF6FF'
            }
          }}
        >
          View All Expenses →
        </Button>
      </Box>
    </Box>
  );
}
