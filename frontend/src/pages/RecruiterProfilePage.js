import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Avatar, 
  Button,
  Paper,
  Grid,
  Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Business, Email, Phone, EditOutlined, Language, LinkedIn, Twitter, CommentOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

function RecruiterProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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
        setProfile(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <Typography>Loading profile...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={profile.profile_picture}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mb: 2,
                  margin: '0 auto'
                }}
              />
              <Typography variant="h6">{profile.company}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Company Information
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {profile.description || 'No description provided'}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>
                  <Email sx={{ verticalAlign: 'middle', mr: 1 }} />
                  {profile.email}
                </Typography>
                {profile.phone && (
                  <Typography>
                    <Phone sx={{ verticalAlign: 'middle', mr: 1 }} />
                    {profile.phone}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Social Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {profile.website && (
                  <Link 
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Language sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Website
                  </Link>
                )}
                {profile.linkedin && (
                  <Link 
                    href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <LinkedIn sx={{ verticalAlign: 'middle', mr: 1 }} />
                    LinkedIn
                  </Link>
                )}
                {profile.twitter && (
                  <Link 
                    href={profile.twitter.startsWith('http') ? profile.twitter : `https://${profile.twitter}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Twitter sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Twitter
                  </Link>
                )}
              </Box>
            </Box>

            <Button
              variant="contained"
              startIcon={<EditOutlined />}
              onClick={() => navigate('/profile/recruiter/edit')}
            >
              Edit Profile
            </Button>
            <Button
              variant="outlined"
              startIcon={<CommentOutlined />}
              onClick={() => setReviewModalOpen(true)}
              size="medium"
              sx={{ borderRadius:2, textTransform:'none', fontSize:'0.9rem', px:2, py:0.75, ml:1 }}
            >
              Feedback
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {/* Feedback Modal */}
      <Dialog open={reviewModalOpen} onClose={() => setReviewModalOpen(false)}>
        <DialogTitle>Your opinion matters</DialogTitle>
        <DialogContent>
          <Typography>Please share your feedback:</Typography>
          <TextField
            multiline
            fullWidth
            minRows={3}
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            sx={{ mt:2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewModalOpen(false)}>Cancel</Button>
          <Button
            disabled={reviewSubmitting}
            onClick={async () => {
              if (!reviewText.trim()) return;
              setReviewSubmitting(true);
              const insertObj = { content: reviewText, author_recruiter_id: user.id, role: 'recruiter' };
              const { error: insertErr } = await supabase.from('reviews').insert([insertObj]);
              setReviewSubmitting(false);
              setReviewText('');
              setReviewModalOpen(false);
              if (insertErr) setError(insertErr.message);
            }}
          >Submit</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default RecruiterProfilePage; 