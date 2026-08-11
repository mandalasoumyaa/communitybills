import React from 'react';
import { Box, Button } from '@mui/material';

export default function StickyActionBar({ onCancel, onSaveDraft, isSubmitting }) {
  return (
    <Box className="sticky-action-bar">
      <Button
        variant="text"
        onClick={onCancel}
        disabled={isSubmitting}
        sx={{
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          px: 3,
          color: 'text.secondary',
        }}
      >
        Cancel
      </Button>
      
      <Button
        variant="outlined"
        onClick={onSaveDraft}
        disabled={isSubmitting}
        sx={{
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          px: 3,
          borderColor: 'var(--color-border)',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'var(--color-border-hover)',
            bgcolor: 'grey.50',
          }
        }}
      >
        Save Draft
      </Button>

      <Button
        type="submit"
        className="btn-gradient"
        disabled={isSubmitting}
        sx={{
          borderRadius: '10px',
          textTransform: 'none',
          px: 4,
          py: 1,
        }}
      >
        {isSubmitting ? 'Saving...' : 'Save Expense'}
      </Button>
    </Box>
  );
}
