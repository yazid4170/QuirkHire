import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import { supabase } from '../supabaseClient';
import PageHero from '../components/PageHero';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // This path needs to exactly match your route in App.js
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Use an absolute URL to avoid path duplication
        redirectTo: 'http://localhost:3001/reset-password',
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHero 
        title="Forgot Password" 
        subtitle="Enter your email to receive a password reset link."
        image="/LoginHeader.jpg"
      />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <form onSubmit={handleReset}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
        {success && <Alert severity="success" sx={{ mt: 2 }}>Check your email for a reset link.</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Container>
    </Box>
  );
}

export default ForgotPassword;
