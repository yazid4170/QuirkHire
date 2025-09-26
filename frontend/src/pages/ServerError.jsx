import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ServerError = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 8 }}>
      <Typography variant="h1" color="error" sx={{ fontWeight: 800, fontSize: { xs: '3rem', md: '5rem' } }}>500</Typography>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Internal Server Error
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Something went wrong on our end. Please try again later or contact support if the problem persists.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}>Go to Home</Button>
    </Box>
  );
};

export default ServerError;
