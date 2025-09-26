import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const ConfirmDialog = ({ open, title, description, onConfirm, onCancel, confirmText = 'Delete', cancelText = 'Cancel', loading = false }) => {
  // Focus the Cancel button when dialog opens for keyboard accessibility
  const cancelRef = React.useRef();
  React.useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <Typography id="confirm-dialog-description" variant="body1" color="text.secondary">{description}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading} ref={cancelRef} aria-label="Cancel deletion">{cancelText}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading} aria-label="Confirm deletion" autoFocus>
          {loading ? 'Deleting...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
