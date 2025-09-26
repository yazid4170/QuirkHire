import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, Alert, CircularProgress } from '@mui/material';
import { supabase } from '../supabaseClient';
import PageHero from '../components/PageHero';
import { useNavigate, useLocation } from 'react-router-dom';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionType, setSessionType] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Password must be at least 8 characters, contain uppercase, lowercase, number, and special char
  const isPasswordSecure = (pw) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);
  };

  useEffect(() => {
    async function checkSession() {
      try {
        // Get session from Supabase auth
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('ResetPassword session:', session, 'error:', error);
        
        if (error) {
          console.error('Session error:', error);
          setError('Error checking authentication status. Please try the reset link again.');
          setIsAuthenticated(false);
        } else if (!session) {
          // No session found - user may have navigated here directly
          console.log('No session found');
          setError('You are not authenticated to reset your password. Please use the link from your email.');
          setIsAuthenticated(false);
        } else {
          // Session exists - check if it's a recovery session
          const amr = session?.user?.app_metadata?.amr || [];
          const lastAuthMethod = amr[amr.length - 1] || {};
          const isRecoverySession = lastAuthMethod.method === 'recovery';
          
          console.log('Session found, recovery?', isRecoverySession, 'AMR:', amr);
          // Allow password reset with any valid session, not just recovery sessions
          // Some Supabase versions or configurations don't correctly mark recovery sessions
          setSessionType(isRecoverySession ? 'recovery' : 'regular');
          setIsAuthenticated(true);
          // Clear any previous errors since we have a valid session
          setError(null);
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Error checking your session. Please try again.');
        setIsAuthenticated(false);
      } finally {
        setSessionChecked(true);
      }
    }
    checkSession();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validation checks
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isPasswordSecure(password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    
    setLoading(true);
    try {
      // Force update the password without checking if it's a recovery session
      // This works with various Supabase configurations and versions
      console.log('Attempting to update password...');
      
      // Get the current session - we'll need this to make the update work
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session for update:', session ? 'Valid' : 'None');
      
      if (!session) {
        setError('No active session found. Please make sure you accessed this page directly from the reset password email link.');
        setLoading(false);
        return;
      }
      
      // Attempt to update the password with explicit debugging and a timeout
      console.log('Calling updateUser with new password...');
      
      // Implement a promise with timeout to prevent hanging
      const updatePasswordWithTimeout = async (timeoutMs = 10000) => {
        return Promise.race([
          supabase.auth.updateUser({ password }),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Password update timed out after ' + timeoutMs + 'ms. Try again.'));
            }, timeoutMs);
          })
        ]);
      };
      
      try {
        const { data, error } = await updatePasswordWithTimeout();
        console.log('Update result data:', data, 'error:', error);
        
        if (error) {
          console.error('Password update error:', error);
          setError(error.message || 'Failed to update password');
          setLoading(false);
          return;
        }
      } catch (timeoutErr) {
        console.error('Password update timeout:', timeoutErr);
        setError('Password update timed out, but your password may have been changed. Please try logging in with your new password. If that fails, try resetting your password again.');
        setLoading(false);
        
        // Since the password might have changed despite the timeout, suggest trying to log in
        setTimeout(() => {
          console.log('Redirecting to login page after timeout...');
          navigate('/login');
        }, 5000);
        return;
      }
      
      // Successfully updated password
      console.log('Password updated successfully!');
      setSuccess(true);
      
      // Redirect to login after successful password reset
      console.log('Will redirect to login in 2 seconds...');
      setTimeout(() => {
        console.log('Redirecting to login page now');
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHero 
        title="Reset Password" 
        subtitle="Enter your new password below."
        image="/LoginHeader.jpg"
      />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <form onSubmit={handleResetPassword}>
          {!isAuthenticated && (
            <Alert severity="error" sx={{ mb: 2 }}>
              You are not authenticated to reset your password. Please use the link from your email.
            </Alert>
          )}
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
        {success && <Alert severity="success" sx={{ mt: 2 }}>Password reset successful! Redirecting to login...</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Container>
    </Box>
  );
}

export default ResetPassword;
