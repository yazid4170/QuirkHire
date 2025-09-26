import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Divider, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const [password, setPassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();



  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!password || !confirmPassword) throw new Error('Please fill in both password fields.');
      if (password !== confirmPassword) throw new Error('Passwords do not match.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSnackbar({ open: true, message: 'Password updated successfully.', severity: 'success' });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', py: 6 }}>
      <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Account Settings</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Update your password or delete your account below.
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <form onSubmit={handlePasswordChange}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Change Password</Typography>
          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            autoComplete="new-password"
          />
          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ borderRadius: 2 }}
            fullWidth
          >
            Update Password
          </Button>
        </form>
        <Divider sx={{ my: 4 }} />
        {/* Delete Profile section */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: 'error.main' }}>Delete Profile</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This action is irreversible. Your account and all associated data will be permanently deleted.
          </Typography>
          <Button
            variant="contained"
            color="error"
            disabled={loading}
            onClick={() => setShowDeleteDialog(true)}
            sx={{ borderRadius: 2 }}
            fullWidth
          >
            Delete My Profile
          </Button>
        </Box>
        <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
          <DialogTitle>Delete Profile</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to permanently delete your profile and account? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteDialog(false)} disabled={loading}>Cancel</Button>
            <Button onClick={async () => {
              setLoading(true);
              try {
                const user = (await supabase.auth.getUser()).data.user;
                if (!user) throw new Error('Not authenticated');
                // Delete profile from 'profiles' table
                const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id);
                if (profileError) throw profileError;
                // Delete user from auth
                const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
                if (authError) throw authError;
                setSnackbar({ open: true, message: 'Profile deleted. Goodbye!', severity: 'success' });
                setTimeout(() => {
                  navigate('/');
                }, 1500);
              } catch (err) {
                setSnackbar({ open: true, message: err.message || 'Failed to delete profile', severity: 'error' });
              } finally {
                setLoading(false);
                setShowDeleteDialog(false);
              }
            }} color="error" disabled={loading}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
