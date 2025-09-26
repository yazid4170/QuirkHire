import React, { useState } from 'react';
import { 
  Container, Typography, Button,TextField,Box,Paper,InputAdornment,IconButton, Divider, Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { motion } from 'framer-motion';
import { alpha, styled } from '@mui/material/styles';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import PageHero from '../components/PageHero';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: alpha(theme.palette.background.default, 0.8),
    transition: 'all 0.3s ease',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.default, 0.95),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    '&.Mui-focused': {
      backgroundColor: alpha(theme.palette.background.default, 1),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  }
}));

function CandidateSignup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password must be at least 8 characters, contain uppercase, lowercase, number, and special char
  const isPasswordSecure = (pw) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isPasswordSecure(formData.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.REACT_APP_SITE_URL + '/complete-profile',
          data: { 
            role: 'candidate',
            account_type: 'candidate',
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('User object is undefined');

      // Step 2: Try to create profile (this may fail due to RLS, but we'll handle it)
      try {
        await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id,
              email: data.user.email,
              first_name: formData.firstName,
              last_name: formData.lastName,
              created_at: new Date().toISOString()
            }
          ]);
      } catch (profileError) {
        // We'll ignore this error since it's expected
        console.log('Profile will be created after email confirmation');
      }

      // Step 3: Show success message regardless of profile creation
      setSuccess(true);
      setShowConfirmation(true);
    } catch (error) {
      setError(error.message || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHero 
        title="Candidate Sign Up" 
        subtitle="Join thousands of candidates using AI-powered recruitment"
        image="/SubscribeHeader.jpg"
      />

      <Container maxWidth="sm" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              background: (theme) => `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
              boxShadow: (theme) => `0 10px 40px -10px ${alpha(theme.palette.primary.main, 0.2)}`,
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Typography variant="h4" align="center" gutterBottom>
              Candidate Sign Up
            </Typography>
            {success ? (
              <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                We've sent a confirmation email to {formData.email}. 
                Please check your inbox and click the confirmation link to complete your registration.
              </Typography>
            ) : (
              <Box component="form" onSubmit={handleSignUp} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <StyledTextField
                  label="Email Address"
                  name="email"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <StyledTextField
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  value={formData.password}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error && <div className="error-message">{error}</div>}

                <Button
                  type="submit"
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&:disabled': {
                      background: (theme) => `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.5)} 30%, ${alpha(theme.palette.secondary.main, 0.5)} 90%)`,
                      color: 'text.disabled',
                      '&:hover': {
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Signing up...' : 'Sign Up'}
                </Button>

                <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </Typography>

                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Already have an account?
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Link 
                    href="/login" 
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Sign in here
                  </Link>
                </Box>
              </Box>
            )}
          </Paper>
        </motion.div>
      </Container>

      <Dialog open={showConfirmation} onClose={() => setShowConfirmation(false)}>
        <DialogTitle>Confirm Your Email</DialogTitle>
        <DialogContent>
          <Typography>
            We've sent a confirmation email to {formData.email}. 
            Please check your inbox and click the confirmation link to complete your registration.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmation(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CandidateSignup;