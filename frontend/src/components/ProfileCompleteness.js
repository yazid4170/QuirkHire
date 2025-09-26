import { LinearProgress, Typography, Box } from '@mui/material';

function ProfileCompleteness({ completeness }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Profile Completeness: {completeness}%
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={completeness} 
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

export default ProfileCompleteness; 