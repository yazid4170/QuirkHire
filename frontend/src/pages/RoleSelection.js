import React from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { alpha } from '@mui/system';
import { useNavigate } from 'react-router-dom';

function RoleSelection() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          background: (theme) => `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
          boxShadow: (theme) => `0 10px 40px -10px ${alpha(theme.palette.primary.main, 0.2)}`,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
          Are you a Recruiter or Candidate?
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/signup/recruiter')}
            sx={{
              py: 2,
              borderRadius: 3,
              background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
              },
            }}
          >
            Recruiter
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/signup/candidate')}
            sx={{
              py: 2,
              borderRadius: 3,
              background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
              },
            }}
          >
            Candidate
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default RoleSelection; 