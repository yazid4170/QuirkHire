// components/FeatureGrid.js
import React from 'react';
import { Grid, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';

const features = [
  {
    title: "AI Matching",
    description: "Advanced algorithms that understand context and skills",
    color: "#FFB6C1",
  },
  {
    title: "Smart Filters",
    description: "Dynamic filtering based on your real needs",
    color: "#FF8FA3",
  },
  {
    title: "Real-time Analysis",
    description: "Instant insights and candidate comparisons",
    color: "#FF6B6B",
  },
];

const FeatureGrid = () => {
  return (
    <Grid container spacing={4}>
      {features.map((feature, index) => (
        <Grid item xs={12} md={4} key={index}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <Paper sx={{
              p: 4,
              height: '100%',
              background: `linear-gradient(45deg, ${feature.color} 0%, ${feature.color}30 100%)`,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
              },
            }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {feature.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {feature.description}
              </Typography>
            </Paper>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
};

export default FeatureGrid;