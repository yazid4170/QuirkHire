// components/PageHero.js
import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PageHero = ({ title, subtitle, image, gradientStart, gradientEnd }) => {
  return (
    <Box sx={{
      height: { xs: '60vh', md: '70vh' },
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: `linear-gradient(to bottom, ${gradientStart || 'rgba(255,255,255,0)'}, ${gradientEnd || 'rgba(85,61,142,0.7)'}), url(${image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      pt: 8
    }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography variant="h1" gutterBottom sx={{ 
            mb: 3, 
            maxWidth: 800,
            color: 'white',
            fontWeight: 800,
            lineHeight: 1.2,
            fontSize: { xs: '2.5rem', md: '3.5rem' }
          }}>
            {title}
          </Typography>
          
          <Typography variant="h4" sx={{ 
            mb: 4, 
            color: 'rgba(255,255,255,0.9)',
            maxWidth: 600,
            fontWeight: 400,
            fontSize: { xs: '1.25rem', md: '1.5rem' }
          }}>
            {subtitle}
          </Typography>
          
          
        </motion.div>
      </Container>
    </Box>
  );
};

export default PageHero;