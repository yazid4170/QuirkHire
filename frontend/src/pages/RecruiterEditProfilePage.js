import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  IconButton,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PhotoCamera } from '@mui/icons-material';

function RecruiterEditProfilePage() {
  const [profile, setProfile] = useState({
    company: '',
    description: '',
    phone: '',
    website: '',
    linkedin: '',
    twitter: '',
    profile_picture: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');

        const { data, error } = await supabase
          .from('recruiter_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data || {
          company: '',
          description: '',
          phone: '',
          website: '',
          linkedin: '',
          twitter: '',
          profile_picture: null
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = new Date().getTime();
      const fileName = `${profile.id}_${timestamp}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, profile_picture: publicUrl }));
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('recruiter_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/profile/recruiter');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Edit Company Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar
              src={profile.profile_picture}
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="avatar-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Change Profile Picture'}
              </Button>
            </label>
          </Box>

          <TextField
            fullWidth
            label="Company Name"
            value={profile.company}
            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Phone Number"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Company Description"
            multiline
            rows={4}
            value={profile.description}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Website"
            value={profile.website}
            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="LinkedIn"
            value={profile.linkedin}
            onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Twitter"
            value={profile.twitter}
            onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
            margin="normal"
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/profile/recruiter')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default RecruiterEditProfilePage; 