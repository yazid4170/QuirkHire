import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 8 }}>
      <Typography variant="h1" color="primary" sx={{ fontWeight: 800, fontSize: { xs: '3rem', md: '5rem' } }}>404</Typography>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Oops! The page you’re looking for doesn’t exist or has been moved.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}>Go to Home</Button>
    </Box>
  );
};

export default NotFound;
