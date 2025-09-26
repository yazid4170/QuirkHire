import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Container, Typography, CircularProgress, Alert, Box, Paper, Chip, Avatar, Link } from '@mui/material';
import { LinkedIn, GitHub, Twitter, Language, School } from '@mui/icons-material';

function PublicProfilePage({ user_id: propUserId }) {
  // Get user_id from URL params or from props
  const { user_id: paramUserId } = useParams();
  
  // Use prop value first, fall back to URL parameter
  const user_id = propUserId || paramUserId;
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug log for user ID sources
  console.log('PublicProfilePage: Props user_id =', propUserId);
  console.log('PublicProfilePage: URL parameter user_id =', paramUserId);
  console.log('PublicProfilePage: Final user_id =', user_id);
  console.log('PublicProfilePage: Current URL =', window.location.pathname);

  useEffect(() => {
    // Guard against missing or invalid user_id
    if (!user_id || user_id === 'undefined' || user_id === 'null') {
      console.error('PublicProfilePage: Missing or invalid user_id parameter:', user_id);
      setError('Invalid profile link: Missing or invalid user ID parameter');
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('PublicProfilePage: Fetching profile for user_id =', user_id);
        
        // Try candidate profile first
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user_id)
          .single();
        
        let profileType = 'candidate';
        console.log('PublicProfilePage: Candidate profile search result =', { profile, error: profileError });
        
        // If not found, try recruiter profile
        if (profileError || !profile) {
          console.log('PublicProfilePage: Candidate profile not found, trying recruiter profile');
          const { data: recruiterProfile, error: recruiterError } = await supabase
            .from('recruiter_profiles')
            .select('*')
            .eq('id', user_id)
            .single();
            
          console.log('PublicProfilePage: Recruiter profile search result =', { recruiterProfile, error: recruiterError });
          
          if (recruiterError || !recruiterProfile) {
            console.error('PublicProfilePage: Profile not found in either profiles or recruiter_profiles tables');
            throw new Error('Profile not found');
          }
          profile = recruiterProfile;
          profileType = 'recruiter';
        }
        
        // Fetch resume only for candidates
        let resume = null;
        if (profileType === 'candidate') {
          console.log('PublicProfilePage: Fetching resume for candidate');
          const { data: resumeData, error: resumeError } = await supabase
            .from('resumes')
            .select('*')
            .eq('user_id', user_id)
            .single();
          
          console.log('PublicProfilePage: Resume search result =', { resumeData, error: resumeError });
          resume = resumeData;
        }
        
        console.log('PublicProfilePage: Setting profile data =', { profile, profileType, resume });
        setProfileData({ profile, profileType, resume });
      } catch (err) {
        console.error('PublicProfilePage: Error fetching profile:', err.message);
        setError(`Failed to load profile: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user_id]);

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: '2rem auto' }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ margin: 2 }}>{error}</Alert>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar 
            src={profileData.profile.profile_picture} 
            sx={{ 
              width: 120, 
              height: 120, 
              fontSize: '2.5rem',
              bgcolor: 'primary.main' 
            }}
          >
            {profileData.profile.first_name?.charAt(0)}{profileData.profile.last_name?.charAt(0)}
          </Avatar>
          <Typography variant="h4" gutterBottom>
            {profileData.profile.first_name} {profileData.profile.last_name}
          </Typography>
        </Box>

        {profileData.profile.bio && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>About Me</Typography>
            <Typography variant="body1">{profileData.profile.bio}</Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="text.secondary">
            {profileData.profile.email} | {profileData.profile.phone}
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Links</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {profileData.profile.website && (
              <Link href={profileData.profile.website} target="_blank" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Language /> Website
              </Link>
            )}
            {profileData.profile.linkedin && (
              <Link href={profileData.profile.linkedin} target="_blank" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LinkedIn /> LinkedIn
              </Link>
            )}
            {profileData.profile.github && (
              <Link href={profileData.profile.github} target="_blank" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <GitHub /> GitHub
              </Link>
            )}
            {profileData.profile.twitter && (
              <Link href={profileData.profile.twitter} target="_blank" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Twitter /> Twitter
              </Link>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Skills</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {profileData.resume.skills?.map((skill, index) => (
              <Chip key={index} label={skill} color="primary" />
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Certifications</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {profileData.resume.certifications?.length > 0 ? (
              profileData.resume.certifications.map((cert, index) => (
                <Chip 
                  key={index} 
                  label={cert} 
                  color="secondary" 
                  icon={<School />} 
                  sx={{ '& .MuiChip-icon': { color: 'inherit' } }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No certifications listed
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Experience</Typography>
          {profileData.resume.experience?.map((exp, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography fontWeight="bold">{exp.position} at {exp.company}</Typography>
              <Typography variant="body2" color="text.secondary">
                {exp.start_date} - {exp.end_date || 'Present'}
              </Typography>
              {exp.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {exp.description}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Paper>
    </Container>
  );
}

export default PublicProfilePage; 