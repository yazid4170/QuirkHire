import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageHero from '../components/PageHero';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();



  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      
      // Redirect to profile page after successful login
      navigate('/profile');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHero 
        title="Login" 
        subtitle="Access your account to continue"
        image="/LoginHeader.jpg"
      />

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            margin="normal"
            required
          />

          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link href="/signup" sx={{ textDecoration: 'none' }}>
              Don't have an account? Sign up
            </Link>
          </Box>
        </form>
        <Box sx={{ mt: 1, mb: 2, textAlign: 'right' }}>
          <Link component={RouterLink} to="/forgot-password" underline="hover" color="primary">
            Forgot Password?
          </Link>
        </Box>
      </Container>
    </Box>
  );
}

export default LoginPage; 