import React, { useState, useEffect, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';

// Using native browser PDF preview via iframe; removed react-pdf and worker imports
import { 
  Container, Typography, Box, Avatar, Button, Paper, Grid, 
  IconButton, Card, Stack, List, ListItem, ListItemAvatar,
  ListItemText, Divider, Chip, CircularProgress, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, 
  DialogActions, Backdrop, Modal, Fade
} from '@mui/material';
import { 
  WorkOutline, CodeOutlined, LanguageOutlined,
  EditOutlined, DownloadOutlined, EmailOutlined,
  PhoneOutlined, LinkedIn, GitHub, CardMembershipOutlined,
  Business, Visibility, DeleteOutlined, SchoolOutlined, CommentOutlined
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { supabase } from '../supabaseClient';
import ConfirmDialog from '../components/ConfirmDialog';
import ErrorSnackbar from '../components/ErrorSnackbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TextField } from '@mui/material';

const SectionHeader = ({ icon, title }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    mb: 3,
    '& svg': {
      color: 'primary.main',
      mr: 2,
      fontSize: 24
    }
  }}>
    {icon}
    <Typography variant="h6" fontWeight={700} color="text.primary">
      {title}
    </Typography>
  </Box>
);

function CandidateProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // PDF preview states
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [numPdfPages, setNumPdfPages] = useState(1);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [profileViews, setProfileViews] = useState([]);
  const [loadingViews, setLoadingViews] = useState(true);
  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  
  // Store stable references to avoid unnecessary re-renders
  const profileRef = React.useRef(null);
  const resumeRef = React.useRef(null);
  const dataFetchedRef = React.useRef(false);
  const viewsFetchedRef = React.useRef(false);
  
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Dialog & error state for destructive actions
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  

  // Track if we've already logged the user info
  const loggedUserRef = React.useRef(false);
  
  // Resume content ref for PDF export
  const resumeContentRef = useRef(null);
  
  // Function to generate a professional PDF resume
  // previewMode=true creates a preview, false downloads directly
  const generateResumePDF = async (previewMode = true) => {
    if (!profile || !resume) {
      setSnackbarMsg('No resume data available to export');
      setSnackbarOpen(true);
      return;
    }
    
    try {
      setPdfPreviewLoading(true);
      
      if (!profile || !resume) {
        setSnackbarMsg('No profile or resume data available');
        setSnackbarOpen(true);
        return;
      }
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        author: profile.first_name + ' ' + profile.last_name,
        subject: 'Resume',
        keywords: 'resume, cv, job application',
        creator: 'QuirkHire'
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Set background color
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Layout variables
      const sidebarWidth = 60; // mm
      const headerHeight = 30; // mm
      const contentX = sidebarWidth + 8;
      const contentYStart = headerHeight + 8;
      // Colors
      const accentR = 125, accentG = 86, accentB = 227; // light purple-blue gradient accent
      const headerR = 43, headerG = 45, headerB = 66; // dark header background
      
      // Sidebar background: light grey
      doc.setFillColor(245,245,245);
      doc.rect(0, 0, sidebarWidth, pageHeight, 'F');
      
      // Sidebar avatar and name
      const sideAvatarSize = 25; // mm
      const sideAvatarX = sidebarWidth/2 - sideAvatarSize/2;
      const sideAvatarY = (headerHeight - sideAvatarSize) / 2;
      if (profile.profile_picture) {
        try {
          const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = profile.profile_picture;
          await new Promise((rsl, rej) => { img.onload = rsl; img.onerror = rej; setTimeout(rsl, 3000); });
          const canvas = document.createElement('canvas'); const px = 100; canvas.width = px; canvas.height = px;
          const ctx = canvas.getContext('2d'); ctx.beginPath(); ctx.arc(px/2, px/2, px/2, 0, 2*Math.PI); ctx.closePath(); ctx.clip(); ctx.drawImage(img, 0, 0, px, px);
          const url = canvas.toDataURL('image/png');
          doc.addImage(url, 'PNG', sideAvatarX, sideAvatarY, sideAvatarSize, sideAvatarSize);
        } catch {} 
      }
      doc.setFontSize(16); doc.setTextColor(0,0,0);
      doc.text(`${profile.first_name} ${profile.last_name}`, sidebarWidth/2, sideAvatarY + sideAvatarSize + 4, { align: 'center' });

      // Sidebar sections rendering
      let sideY = sideAvatarY + sideAvatarSize + 8;
      // Contact Section
      const contacts = [];
      if (profile.email) contacts.push(`Email: ${profile.email}`);
      if (profile.phone) contacts.push(`Phone: ${profile.phone}`);
      if (profile.website) contacts.push(`Website: ${profile.website}`);

      if (profile.linkedin) {
        const liUrl = profile.linkedin.replace(/\/$/, '');
        const liHandle = liUrl.substring(liUrl.lastIndexOf('/') + 1);
        contacts.push(`LinkedIn: @${liHandle}`);
      }
      if (profile.github) {
        const ghUrl = profile.github.replace(/\/$/, '');
        const ghHandle = ghUrl.substring(ghUrl.lastIndexOf('/') + 1);
        contacts.push(`GitHub: @${ghHandle}`);
      }
      
      const contactBoxHeight = 8 + contacts.length * 6 + 4;
      doc.setFillColor(headerR, headerG, headerB);
      doc.rect(0, sideY - 2, sidebarWidth, contactBoxHeight, 'F');
      doc.setTextColor(255,255,255); doc.setFontSize(12);
      doc.text('Contact', 5, sideY + 4);
      sideY += 8; doc.setFontSize(10);
      contacts.forEach(c => { doc.text(c, 5, sideY); sideY += 6; });
      sideY += 8;
      // Helper for other sections
      const drawSec = (title, items) => {
        doc.setFillColor(headerR, headerG, headerB);
        doc.rect(0, sideY - 2, sidebarWidth, 8, 'F');
        doc.setTextColor(255,255,255); doc.setFontSize(12);
        doc.text(title, 5, sideY + 4);
        // Move below header
        sideY += 12;
        doc.setTextColor(0,0,0); doc.setFontSize(10);
        const maxTextWidth = sidebarWidth - 4;
        items.forEach(i => {
          // Wrap long lines
          const lines = doc.splitTextToSize(`• ${i}`, maxTextWidth);
          lines.forEach(line => {
            doc.text(line, 5, sideY);
            sideY += 5;
          });
        });
        // Extra spacing after items
        sideY += 12;
      };
      drawSec('Skills', parseField(resume.skills || []));
      drawSec('Languages', parseField(resume.languages || []).map(l => typeof l==='string'?l:`${l.name||''} - ${l.fluency||''}`));
      drawSec('Certifications', parseField(resume.certifications || []));

      // Main content area
      let mainY = contentYStart;
      doc.setTextColor(0,0,0);
      doc.setFontSize(16);
      doc.text('Professional Summary', contentX, mainY);
      mainY += 8;
      doc.setFontSize(11);
      if (profile.bio) { doc.text(profile.bio, contentX, mainY, { maxWidth: pageWidth - contentX - 14 }); mainY += 12; }
      
      // Education
      if (resume.education?.length) {
        doc.setFontSize(16);
        doc.text('Education', contentX, mainY);
        mainY += 8;
        doc.setFontSize(11);
        parseField(resume.education).forEach(edu => {
          doc.text(`• ${edu.degree} @ ${edu.institution}`, contentX, mainY); mainY += 6;
        });
        mainY += 6;
      }
      
      // Experience
      if (resume.experience?.length) {
        doc.setFontSize(16);
        doc.text('Experience', contentX, mainY); mainY += 8;
        doc.setFontSize(11);
        parseField(resume.experience).forEach(exp => {
          doc.text(`• ${exp.position} at ${exp.company}`, contentX, mainY); mainY += 6;
          // description truncated
          const lines = doc.splitTextToSize(exp.description, pageWidth - contentX - 14);
          doc.text(lines, contentX + 4, mainY); mainY += lines.length * 6;
        });
      }

      // Footer note on last page
      const totalPages = doc.internal.getNumberOfPages();
      doc.setPage(totalPages);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by QuirkHire', 14, pageHeight - 10);

      if (previewMode) {
        // Generate data URL for preview
        const pdfDataUri = doc.output('datauristring');
        setPdfDataUrl(pdfDataUri);
        setPdfPreviewOpen(true);
        setSnackbarMsg('PDF preview ready!');
        setSnackbarOpen(true);
      } else {
        // Save the PDF directly
        doc.save(`${profile.first_name}_${profile.last_name}_Resume.pdf`);
        
        // Success message
        setSnackbarMsg('PDF downloaded successfully!');
        setSnackbarOpen(true);
      }
      
      setPdfPreviewLoading(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      setSnackbarMsg(`Error generating PDF: ${error.message}`);
      setSnackbarOpen(true);
      setPdfPreviewLoading(false);
    }
  };

  // Debug user object - only log once on mount
  useEffect(() => {
    if (user?.id && !loggedUserRef.current) {
      console.log('[CandidateProfilePage] User loaded:', user.id);
      loggedUserRef.current = true;
    }
  }, [user?.id]); // Only depend on user ID

  // Delete resume handler
  const handleDeleteResume = async () => {
    if (deleteLoading) return; // Prevent double-clicks
    
    setDeleteLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');
      
      const { error: deleteError } = await supabase
        .from('resumes')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteError) throw deleteError;
      
      setResume(null);
      resumeRef.current = null;
      setSnackbarMsg('Resume deleted successfully.');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg(err.message || 'Failed to delete resume');
      setSnackbarOpen(true);
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
    }
  };

  // Primary data fetching function with proper memoization
  const fetchData = useCallback(async () => {
    // Prevent redundant fetches when data is already loaded
    if (dataFetchedRef.current || !user?.id || authLoading) return;
    
    setLoading(true);
    setError(null);
    console.log('Starting profile data fetch');
    
    try {
      const userId = user.id;
      const userEmail = user.email;
      const firstName = user.user_metadata?.first_name;
      const lastName = user.user_metadata?.last_name;
      
      console.log('[CandidateProfilePage] fetchData for:', {userId, userEmail, firstName, lastName});
      
      // Fetch profile with a single clean query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error('[CandidateProfilePage] Profile fetch error:', profileError);
        throw new Error('Unable to load profile. Please try again later.');
      }
      
      console.log('[CandidateProfilePage] Profile data fetched:', profileData ? 'success' : 'empty');
      
      // Fetch resume data
      let resumeData = null;
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (error) {
          console.warn('Resume fetch error (non-critical):', error);
        } else {
          resumeData = data;
          console.log('Resume data fetched:', resumeData ? 'success' : 'empty');
        }
      } catch (resumeError) {
        console.warn('Resume fetch exception (non-critical):', resumeError);
        // Non-critical error, continue without resume data
      }

      // Set profile data from fetched data or create default
      const finalProfileData = profileData || {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        profile_picture: null,
        bio: '',
        phone: '',
        address: '',
        linkedin: '',
        github: '',
        twitter: ''
      };
      
      // Update refs first, then state to avoid race conditions
      profileRef.current = finalProfileData;
      resumeRef.current = resumeData;
      
      setProfile(finalProfileData);
      setResume(resumeData);
      dataFetchedRef.current = true;
      
      console.log('Profile data loading complete');
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, user?.user_metadata?.first_name, user?.user_metadata?.last_name, authLoading]); // Added all user dependencies

  // Fetch profile views separately to avoid unnecessary re-renders
  const fetchProfileViews = useCallback(async () => {
    // Prevent duplicate fetches
    if (viewsFetchedRef.current || !user?.id || authLoading) return;
    
    try {
      setLoadingViews(true);
      console.log('Starting profile views fetch');
      
      // Try to fetch from notifications table, fall back to mock data
      try {
        const { count, error: tableError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true });
        
        if (tableError) {
          console.error('Notifications table error:', tableError);
          
          // Create mock data for demo purposes
          const mockViews = [
            {
              company_name: 'TechCorp Inc.',
              viewed_at: new Date().toISOString(),
            },
            {
              company_name: 'Global Innovations',
              viewed_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
            }
          ];
          
          console.log('Using mock profile views for demo:', mockViews);
          setProfileViews(mockViews);
          viewsFetchedRef.current = true;
          return;
        }
        
        console.log('Notifications table exists, count:', count);
        
        // Fetch notifications of type 'profile_view' for the current user
        const { data: notifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'profile_view')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching notifications:', error);
          setProfileViews([]);
          return;
        }

        console.log('Found notifications:', notifications?.length || 0);
        
        if (!notifications || notifications.length === 0) {
          console.log('No profile view notifications found');
          setProfileViews([]);
          return;
        }

        // Process notifications into profile views
        const views = notifications.map(notification => ({
          company_name: notification.data?.viewer_company || 'Company',
          profile_picture: notification.data?.viewer_profile_picture,
          viewed_at: notification.created_at
        }));
        
        console.log('Processed profile views:', views);
        setProfileViews(views);
      } catch (tableCheckError) {
        console.error('Error checking notifications table:', tableCheckError);
        setProfileViews([]);
      }
    } catch (error) {
      console.error('Error in fetchProfileViews:', error);
      setProfileViews([]);
    } finally {
      setLoadingViews(false);
      viewsFetchedRef.current = true;
    }
  }, [user?.id, authLoading]); // Only depend on user ID and auth loading state

  // Effect to fetch data when user is available
  useEffect(() => {
    if (user?.id && !authLoading && !dataFetchedRef.current) {
      fetchData();
    }
  }, [user?.id, authLoading, fetchData]);
  
  // Separate effect for profile views
  useEffect(() => {
    if (user?.id && !authLoading && !viewsFetchedRef.current) {
      fetchProfileViews();
    }
  }, [user?.id, authLoading, fetchProfileViews]);

  // Safety timeout to prevent stuck loading state
  useEffect(() => {
    let timeoutId;
    
    if (loading) {
      timeoutId = setTimeout(() => {
        // Only force-exit loading state if we're still loading after timeout
        if (loading) {
          console.warn('Loading timeout exceeded, forcing state update');
          setLoading(false);
          
          // Use cached data if available
          if (!profile && profileRef.current) {
            setProfile(profileRef.current);
          }
          
          if (!profile && !profileRef.current) {
            setError('Loading timed out. Please refresh the page to try again.');
          }
        }
      }, 10000); // 10-second timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, profile]);
  
  // Handle tab visibility changes to prevent data loss
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, restore from refs if needed
        console.log('Tab visible again, checking cached data');
        if (profileRef.current && !profile) {
          setProfile(profileRef.current);
        }
        if (resumeRef.current && !resume) {
          setResume(resumeRef.current);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile, resume]);

  const parseField = (field) => {
    if (!field) return [];
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field.split(',').map(item => item.trim());
      }
    }
    return field;
  };
  
  const renderProfileViews = () => {
    return (
      <Box sx={{ mt: 4 }}>
        <SectionHeader 
          icon={<Visibility />} 
          title="Companies That Viewed Your Profile" 
        />
        {loadingViews ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : !profileViews || profileViews.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', border: `1px dashed ${alpha(theme.palette.divider, 0.5)}` }}>
            <Typography color="text.secondary" gutterBottom>
              No companies have viewed your profile yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete your profile and share your resume link to increase visibility
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<EditOutlined />}
              onClick={() => navigate('/profile/edit')}
            >
              Enhance Profile
            </Button>
          </Paper>
        ) : (
          <List>
            {profileViews.map((view, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Business />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {view.company_name || 'Company'}
                        </Typography>
                        {view.viewed_at && (
                          <Chip 
                            size="small" 
                            label={new Date(view.viewed_at).toLocaleDateString()} 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Viewed your profile
                      </Typography>
                    }
                  />
                </ListItem>
                {index < profileViews.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    );
  };

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  if (loading) return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      my: 4
    }}>
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography>Loading profile...</Typography>
    </Box>
  );

  if (error) return <Typography color="error">Error: {error}</Typography>;

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Profile Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          It looks like your profile hasn't been set up yet.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/complete-profile')}
        >
          Complete Your Profile
        </Button>
      </Container>
    );
  }

  // Render the main profile page UI after auth checks
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Profile Header */}
      <Box
        sx={{
          position: 'relative',
          mb: 7,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 10px 40px 0 rgba(0,0,0,0.06)',
        }}
      >
        {/* Banner Background */}
        <Box
          sx={{
            height: 180,
            width: '100%',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            position: 'relative',
            opacity: 0.9,
          }}
        />
        {/* Profile Content Card */}
        <Card
          sx={{
            mx: { xs: 2, md: 6 },
            mt: -8,
            mb: 2,
            borderRadius: 3,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'visible',
            bgcolor: 'background.paper',
          }}
          elevation={0}
        >
          {/* Avatar - positioned to overlap the banner */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            p: { xs: 3, md: 4 },
            alignItems: { xs: 'center', md: 'flex-start' },
          }}>
            <Avatar 
              src={profile.profile_picture}
              alt={`${profile.first_name} ${profile.last_name}`}
              sx={{ 
                width: 130, 
                height: 130,
                border: '4px solid #fff',
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                fontSize: 50,
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                mb: { xs: 3, md: 0 },
                mr: { md: 4 },
                objectFit: 'cover'
              }}
            >
              {profile.first_name ? profile.first_name[0].toUpperCase() : '?'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 600, 
                  letterSpacing: -0.5,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                }}
              >
                {profile.first_name} {profile.last_name}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mt: 1, 
                  mb: 3, 
                  color: 'text.secondary',
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  maxWidth: '650px'
                }}
              >
                {profile.bio || 'No bio available'}
              </Typography>
              <Stack 
                direction="row" 
                spacing={1.5} 
                sx={{ 
                  mb: 0.5,
                  justifyContent: { xs: 'center', md: 'flex-start' } 
                }}
              >
                {profile.email && (
                  <Tooltip title="Email">
                    <IconButton 
                      aria-label="email" 
                      component="a" 
                      href={`mailto:${profile.email}`}
                      color="primary"
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.08), 
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                      }}
                      size="small"
                    >
                      <EmailOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {profile.phone && (
                  <Tooltip title="Phone">
                    <IconButton 
                      aria-label="phone" 
                      component="a" 
                      href={`tel:${profile.phone}`}
                      color="primary"
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.08), 
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                      }}
                      size="small"
                    >
                      <PhoneOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {profile.linkedin && (
                  <Tooltip title="LinkedIn">
                    <IconButton 
                      aria-label="linkedin" 
                      component="a" 
                      href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.08), 
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                      }}
                      size="small"
                    >
                      <LinkedIn fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {profile.github && (
                  <Tooltip title="GitHub">
                    <IconButton 
                      aria-label="github" 
                      component="a" 
                      href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.08), 
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                      }}
                      size="small"
                    >
                      <GitHub fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {profile.website && (
                  <Tooltip title="Website">
                    <IconButton 
                      aria-label="website" 
                      component="a" 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.08), 
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                      }}
                      size="small"
                    >
                      <LanguageOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Box>
          </Box>
        </Card>
        {/* Actions Bar */}
        <Card
          sx={{
            mx: { xs: 2, md: 6 },
            mb: 2,
            py: 1.5,
            px: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: 'center',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            bgcolor: alpha('#fff', 0.9),
          }}
          elevation={0}
        >
          <Button
            variant="contained"
            disableElevation
            startIcon={<EditOutlined />}
            onClick={() => navigate('/profile/edit')}
            size="medium"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.9rem',
              px: 2,
              py: 0.75,
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
            aria-label="Edit Profile"
          >
            Edit Profile
          </Button>
          {resume && (
            <>
              <Button
                variant="contained"
                disableElevation
                startIcon={<EditOutlined />}
                onClick={() => navigate('/resume/create')}
                size="medium"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  px: 2,
                  py: 0.75,
                  bgcolor: theme.palette.info.main,
                  '&:hover': { bgcolor: theme.palette.info.dark },
                }}
                aria-label="Edit Resume"
              >
                Edit Resume
              </Button>
              <Button
                variant="contained"
                disableElevation
                color="secondary"
                startIcon={<DownloadOutlined />}
                onClick={() => generateResumePDF(true)}
                disabled={pdfPreviewLoading}
                size="medium"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  px: 2,
                  py: 0.75,
                }}
                aria-label="Export Resume as PDF"
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteOutlined />}
                onClick={() => setConfirmOpen(true)}
                size="medium"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  px: 2,
                  py: 0.75,
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                    borderColor: theme.palette.error.dark 
                  },
                }}
                aria-label="Delete Resume"
              >
                Delete Resume
              </Button>
              <Button
                variant="outlined"
                startIcon={<CommentOutlined />}
                onClick={() => setReviewModalOpen(true)}
                size="medium"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  px: 2,
                  py: 0.75,
                }}
                aria-label="Reviews"
              >
                Write us a review
              </Button>
            </>
          )}
        </Card>
      </Box>
      {/* Main Content */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* Resume Section */}
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography>Loading profile...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="error" variant="h6" gutterBottom>
                {error}
              </Typography>
            </Box>
          ) : resume ? (
            <>
              {/* Skills */}
              {resume.skills?.length > 0 && (
                <Card sx={{ mb: 4, p: 3, borderRadius: 5, boxShadow: 2 }}>
                  <SectionHeader icon={<CodeOutlined />} title="Core Skills" />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {parseField(resume.skills).map((skill, i) => (
                      <Chip key={i} label={skill} color="primary" sx={{ mb: 1 }} />
                    ))}
                  </Box>
                </Card>
              )}
              {/* Languages */}
              {resume.languages?.length > 0 && (
                <Card sx={{ mb: 4, p: 3, borderRadius: 5, boxShadow: 2 }}>
                  <SectionHeader icon={<LanguageOutlined />} title="Languages" />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {parseField(resume.languages).map((lang, i) => {
                      // Handle both string format and object format with name/fluency
                      let displayText = '';
                      let langObj = null;
                      
                      if (typeof lang === 'string') {
                        displayText = lang;
                      } else if (typeof lang === 'object' && lang !== null) {
                        langObj = lang;
                        const langName = lang.name || lang.language || '';
                        const fluency = lang.fluency || lang.level || '';
                        
                        if (langName) {
                          displayText = fluency ? `${langName} - ${fluency}` : langName;
                        } else {
                          return null; // Skip invalid language entries
                        }
                      } else {
                        return null; // Skip invalid language entries
                      }
                      
                      return (
                        <Chip 
                          key={i} 
                          label={displayText} 
                          color="secondary" 
                          sx={{ mb: 1 }} 
                        />
                      );
                    })}
                  </Box>
                </Card>
              )}
              {/* Certifications */}
              {resume.certifications?.length > 0 && (
                <Card sx={{ mb: 4, p: 3, borderRadius: 5, boxShadow: 2 }}>
                  <SectionHeader icon={<CardMembershipOutlined />} title="Certifications" />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {parseField(resume.certifications).map((cert, i) => (
                      <Chip key={i} label={cert} color="success" sx={{ mb: 1 }} />
                    ))}
                  </Box>
                </Card>
              )}
              {/* Experience */}
              {resume.experience?.length > 0 && (
                <Card sx={{ mb: 4, p: 3, borderRadius: 5, boxShadow: 2 }}>
                  <SectionHeader icon={<WorkOutline />} title="Professional Experience" />
                  <Stack spacing={2} divider={<Divider flexItem />}>
                    {parseField(resume.experience).map((exp, i) => (
                      <Box key={i}>
                        <Typography variant="subtitle1" fontWeight={600}>{exp.title} @ {exp.company}</Typography>
                        <Typography variant="body2" color="text.secondary">{exp.start_date} - {exp.end_date || 'Present'}</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>{exp.description}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Card>
              )}
              {/* Education */}
              {resume.education?.length > 0 && (
                <Card sx={{ mb: 4, p: 3, borderRadius: 5, boxShadow: 2 }}>
                  <SectionHeader icon={<SchoolOutlined />} title="Education" />
                  <Stack spacing={2} divider={<Divider flexItem />}>
                    {parseField(resume.education).map((edu, i) => (
                      <Box key={i}>
                        <Typography variant="subtitle1" fontWeight={600}>{edu.degree} @ {edu.institution}</Typography>
                        <Typography variant="body2" color="text.secondary">{edu.start_date} - {edu.end_date || 'Present'}</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>{edu.description}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Card>
              )}
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', border: `1px dashed ${theme.palette.divider}` }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                No resume created yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<EditOutlined />}
                onClick={() => navigate('/resume/create')}
                sx={{ borderRadius: 2 }}
                aria-label="Create Resume"
              >
                Create Resume
              </Button>
            </Paper>
          )}
        </Grid>
        {/* Profile Views & Notifications */}
        <Grid item xs={12} md={4}>
          {renderProfileViews()}
        </Grid>
      </Grid>
      {/* ConfirmDialog and Snackbar are rendered at the end of the main container */}
      <ConfirmDialog 
        open={confirmOpen}
        title="Delete Resume"
        content="Are you sure you want to delete your resume? This action cannot be undone."
        onConfirm={handleDeleteResume}
        onCancel={() => setConfirmOpen(false)}
      />
      
      {/* PDF Preview Modal */}
      <Modal
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={pdfPreviewOpen}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2">
                Resume Preview
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadOutlined />}
                  onClick={() => {
                    setPdfPreviewOpen(false);
                    generateResumePDF(false);
                  }}
                  sx={{ mr: 2 }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setPdfPreviewOpen(false)}
                >
                  Close
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: alpha('#f5f5f5', 0.7),
              p: 2,
              borderRadius: 1,
              minHeight: '300px',
              '& .react-pdf__Document': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
              '& .react-pdf__Page': {
                maxWidth: '100%',
                boxShadow: '0 0 10px rgba(0,0,0,0.15)',
                mb: 2,
                bgcolor: '#fff'
              }
            }}>
              {pdfDataUrl ? (
                <iframe
                  src={pdfDataUrl}
                  title="PDF Preview"
                  width="100%"
                  height="100%"
                  style={{ border: 'none', flex: 1 }}
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <CircularProgress />
                </Box>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>
      <ErrorSnackbar
        open={snackbarOpen}
        message={snackbarMsg}
        onClose={() => setSnackbarOpen(false)}
      />
      {/* Feedback Modal */}
      <Dialog open={reviewModalOpen} onClose={() => setReviewModalOpen(false)}>
        <DialogTitle>Your opinion matters</DialogTitle>
        <DialogContent>
          <Typography>Please help us improve by leaving your feedback below:</Typography>
          <TextField
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            multiline
            fullWidth
            minRows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewModalOpen(false)}>Cancel</Button>
          <Button onClick={async () => {
              if (!reviewText.trim()) return;
              setReviewSubmitting(true);
              const insertObj = { content: reviewText, author_candidate_id: user.id, role: 'candidate' };
              const { error } = await supabase.from('reviews').insert([insertObj]);
              setReviewSubmitting(false);
              setReviewModalOpen(false);
              setReviewText('');
              setSnackbarMsg(error ? error.message : 'Thanks for your feedback!');
              setSnackbarOpen(true);
            }} disabled={reviewSubmitting}
          >Submit</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default CandidateProfilePage;