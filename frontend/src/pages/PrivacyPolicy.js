import React from 'react';
import { Container, Typography, Box, Link } from '@mui/material';

const PrivacyPolicy = () => (
  <Container sx={{ py: 4 }}>  
    <Typography variant="h4" gutterBottom>
      Privacy Policy
    </Typography>
    <Typography variant="body1" paragraph>
      Your privacy is important to us. This Privacy Policy explains how QuirkHire collects, uses, shares, and protects your personal information.
    </Typography>

    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>Information Collection</Typography>
      <Typography variant="body1" paragraph>
        We collect information you provide directly, such as your name, email address, resume data, and any other information you choose to provide.
      </Typography>
    </Box>

    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>Usage of Information</Typography>
      <Typography variant="body1" paragraph>
        We use your information to provide resume recommendations, improve our services, and communicate with you about updates or support.
      </Typography>
    </Box>

    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>Data Sharing</Typography>
      <Typography variant="body1" paragraph>
        We do not share your personal information with third parties except as required by law or to provide services on your behalf (e.g., hosting providers).
      </Typography>
    </Box>

    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>Security</Typography>
      <Typography variant="body1" paragraph>
        We implement security measures to protect your information, but no method is 100% secure. Please use a strong password and keep your account details confidential.
      </Typography>
    </Box>

    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>Contact Us</Typography>
      <Typography variant="body1" paragraph>
        If you have questions about this Privacy Policy, please <Link href="/contact">contact us</Link>.
      </Typography>
    </Box>
  </Container>
);

export default PrivacyPolicy;
