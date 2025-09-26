import React from 'react';
import { AppBar, Toolbar, Tabs, Tab, Box, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();
  const currentTab = ['/', '/recommend', '/upload', '/login'].indexOf(location.pathname);

  return (
    <Box sx={{ 
      backgroundImage: `url(${process.env.PUBLIC_URL}/header.png)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      boxShadow: 3,
      mb: 4
    }}>
      <AppBar position="static" sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <Toolbar sx={{ 
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(124, 77, 255, 0.6)' // Light purple with transparency
        }}>
          <Typography 
            variant="h2" 
            sx={{ 
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
              mb: 2,
              textAlign: 'center',
              fontWeight: 700,
              color: 'white'
            }}
          >
            Resume Recommender
          </Typography>
          <Tabs 
            value={currentTab} 
            textColor="inherit"
            sx={{
              '.MuiTabs-indicator': {
                backgroundColor: '#40C4FF', // Light blue indicator
                height: 3
              }
            }}
          >
            <Tab 
              label="Home" 
              component={Link} 
              to="/" 
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 500,
                '&:hover': { color: '#40C4FF !important' } // Light blue on hover
              }}
            />
            <Tab 
              label="Recommend" 
              component={Link} 
              to="/recommend" 
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 500,
                '&:hover': { color: '#40C4FF !important' } // Light blue on hover
              }}
            />
            <Tab 
              label="Upload" 
              component={Link} 
              to="/upload" 
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 500,
                '&:hover': { color: '#40C4FF !important' } // Light blue on hover
              }}
            />
            <Tab 
              label="Profile" 
              component={Link} 
              to="/login" 
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 500,
                '&:hover': { color: '#40C4FF !important' } // Light blue on hover
              }}
            />
          </Tabs>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Header;