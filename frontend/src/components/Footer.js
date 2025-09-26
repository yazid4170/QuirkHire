import React from 'react';
import { Box, Container, Grid, Typography, IconButton, Link, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const StyledFooter = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  padding: theme.spacing(6, 0),
  marginTop: 'auto',
}));

const FooterLink = styled(Link)({
  color: '#fff',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});

const Footer = () => {
  return (
    <StyledFooter>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              QuirkHire
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Revolutionizing the way recruiters find the perfect candidates through AI-powered resume matching.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <IconButton color="inherit" aria-label="LinkedIn">
                <LinkedInIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <TwitterIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="GitHub">
                <GitHubIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <InstagramIcon />
              </IconButton>
            </Stack>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
            </Stack>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Contact Us
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailIcon />
                <Typography variant="body2">
                  support@quirkhire.com
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PhoneIcon />
                <Typography variant="body2">
                  +123456789
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Typography 
          variant="body2" 
          align="center" 
          sx={{ 
            mt: 4, 
            pt: 2, 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {new Date().getFullYear()} QuirkHire. All rights reserved.
        </Typography>
      </Container>
    </StyledFooter>
  );
};

export default Footer;