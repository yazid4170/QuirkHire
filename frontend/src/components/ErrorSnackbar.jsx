import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const ErrorSnackbar = ({ open, message, onClose }) => (
  <Snackbar open={open} autoHideDuration={5000} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
    <Alert onClose={onClose} severity="error" sx={{ width: '100%' }}>
      {message}
    </Alert>
  </Snackbar>
);

export default ErrorSnackbar;
