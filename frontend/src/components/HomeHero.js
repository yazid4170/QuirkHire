// components/HomeHero.js
import React from 'react';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const HomeHero = () => {
  const navigate = useNavigate();
  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    session ? navigate('/recommend') : navigate('/signup/recruiter');
  };

  return (
    <Box sx={{
      height: { xs: '90vh', md: '100vh' },
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'url(/header.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      pb: 8,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        
      }
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
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
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                Smarter Hiring Starts Here
              </Typography>
              
              <Typography variant="h4" sx={{ 
                mb: 4, 
                color: 'rgba(255,255,255,0.9)',
                maxWidth: 600,
                fontWeight: 400,
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
              }}>
                Transform resumes into perfect matches with AI-powered insights
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Button
                  onClick={handleGetStarted}
                  variant="contained"
                  size="large"
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.2rem',
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  Try It Free →
                </Button>
                <Button
                  component={Link}
                  to="/about"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.2rem',
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Box sx={{
                p: 4,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Typography variant="h5" sx={{ mb: 2, color: 'white' }}>
                  Why Choose QuirkHire?
                </Typography>
                <Box component="ul" sx={{ 
                  pl: 2,
                  color: 'rgba(255,255,255,0.9)',
                  '& li': { mb: 1.5 }
                }}>
                  <li>AI-powered resume analysis</li>
                  <li>Instant candidate matching</li>
                  <li>Comprehensive skill assessment</li>
                  <li>Seamless integration with your workflow</li>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HomeHero;