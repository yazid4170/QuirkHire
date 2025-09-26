import { useState } from 'react';
import { Button } from '@mui/material';
import { supabase } from '../supabaseClient';

function ProfilePictureUpload({ userId }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { publicURL } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Return the URL to parent component
      return publicURL;
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Button
      variant="contained"
      component="label"
      disabled={uploading}
      sx={{
        mt: 2,
        textTransform: 'none',
        bgcolor: 'primary.main',
        '&:hover': {
          bgcolor: 'primary.dark'
        }
      }}
    >
      {uploading ? 'Uploading...' : 'Change Profile Picture'}
      <input
        type="file"
        hidden
        accept="image/*"
        onChange={handleUpload}
      />
    </Button>
  );
}

export default ProfilePictureUpload; 