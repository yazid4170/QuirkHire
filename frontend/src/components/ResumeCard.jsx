// components/ResumeCard.js
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Stack, 
  Divider, 
  Box, 
  Avatar,
  useTheme,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Button
} from '@mui/material';
import { motion } from 'framer-motion';
import { styled, alpha } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { InfoOutlined, Check, OpenInNew } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService'; // Update import path

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: `0 10px 40px -10px ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
  backdropFilter: 'blur(20px)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px -20px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  }
}));



const ScoreBadge = styled(Chip)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.common.white,
  fontWeight: 700,
  fontSize: '0.95rem',
  padding: theme.spacing(1),
  height: 32,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
}));

const DetailChip = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
}));



const InfoButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: alpha(theme.palette.info.main, 0.1),
  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
  color: theme.palette.info.main,
  width: 32,
  height: 32,
  '&:hover': {
    backgroundColor: alpha(theme.palette.info.main, 0.2),
  },
}));

const MatchReasonsList = styled(List)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(8px)',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  padding: theme.spacing(1.5),
  margin: theme.spacing(2, 0),
}));



const ResumeCard = ({ resume }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [showReasons, setShowReasons] = useState(false);
  const MAX_SKILLS = 3;  // Maximum number of skills to show
  const MAX_CERTS = 2;   // Maximum number of certifications to show

  // Safe access functions with fallbacks
  const safeName = () => {
    if (!resume) return 'Candidate';
    // Check for name from profile info
    if (typeof resume.name === 'string' && resume.name) return resume.name;
    // Check profile fields directly
    if (resume.first_name || resume.last_name) {
      return `${resume.first_name || ''} ${resume.last_name || ''}`.trim();
    }
    // Use user_id as fallback
    if (resume.user_id) return `Candidate ${resume.user_id}`;
    return 'Unnamed Candidate';
  };
  
  const safeInitial = () => {
    const name = safeName();
    return name && typeof name === 'string' && name.length > 0 ? name.charAt(0).toUpperCase() : '?';
  };
  
  // Handle both NLP and LLM response formats
  // If resume has a nested 'resume' property, it's from the LLM recommender
  const resumeData = resume?.resume ? resume.resume : resume;
  
  // Handle undefined or null score
  const formattedScore = resume?.score !== undefined ? 
    parseFloat(resume.score).toFixed(2) : '0.00';

  // Convert education object to a string
  const educationText = resumeData?.education && Array.isArray(resumeData.education) && resumeData.education.length > 0
    ? `${resumeData.education[0].degree || resumeData.education[0].name || 'Degree'} at ${resumeData.education[0].institution || resumeData.education[0].school || 'Institution'}`
    : 'No education information available';
    
  // Convert experience object to a string
  const experienceText = resumeData?.experience && Array.isArray(resumeData.experience) && resumeData.experience.length > 0
    ? `${resumeData.experience[0].position || resumeData.experience[0].title || 'Position'} at ${resumeData.experience[0].company || resumeData.experience[0].employer || 'Company'}`
    : 'No experience information available';
    
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Resume data:', resumeData);
    }
  }, [resumeData]);
    
  // Safe access to arrays with resumeData (supports both NLP and LLM formats)
  const skills = Array.isArray(resumeData?.skills) ? resumeData.skills : [];
  const experience = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
  const languages = Array.isArray(resumeData?.languages) ? resumeData.languages : [];
  const certifications = Array.isArray(resumeData?.certifications) ? resumeData.certifications : [];
  // Match reasons come from the top-level object for LLM responses
  const matchReasons = Array.isArray(resume?.match_reasons) ? resume.match_reasons : [];
  
  // Check if this resume has LLM insights
  const hasLlmInsights = matchReasons.some(reason => 
    reason.startsWith('✓ Strength:') || 
    reason.startsWith('△ Gap:') || 
    reason.length > 100 // Likely an LLM reasoning
  );
  
  // Process match reasons to remove duplicates
  const processedMatchReasons = (() => {
    // Create a Set to track unique reasons
    const uniqueReasons = new Set();
    
    // Filter out duplicates
    return matchReasons.filter(reason => {
      // If we haven't seen this reason before, add it and return true
      if (!uniqueReasons.has(reason)) {
        uniqueReasons.add(reason);
        return true;
      }
      // If we've seen this reason before, return false
      return false;
    });
  })();

  const handleCardClick = async () => {
    if (resumeData?.user_id && resumeData.user_id !== 'undefined' && resumeData.user_id !== undefined && resumeData.user_id !== null && resumeData.user_id !== '') {
      try {
        console.log('Current user:', user);
        console.log('Resume user ID:', resumeData.user_id);
        
        // Create notification if the viewer is a recruiter
        if (user && user.user_metadata?.account_type === 'recruiter' && resumeData.user_id !== user.id) {
          console.log('Creating notification for recruiter view');
          try {
            const result = await notificationService.createNotification(
              resumeData.user_id,
              'profile_view',
              `${user.user_metadata?.company || 'A company'} viewed your profile`,
              { 
                viewer_id: user.id,
                viewer_company: user.user_metadata?.company || 'Unknown Company',
                viewer_email: user.email,
                viewer_profile_picture: user.user_metadata?.avatar_url || null
              }
            );
            console.log('Notification creation result:', result);
          } catch (err) {
            console.error('Error creating notification:', err);
          }
        }
        navigate(`/profile/${resumeData.user_id}`);
      } catch (err) {
        console.error("Error in handleCardClick:", err);
        alert("Profile navigation is not available at this time.");
      }
    } else {
      console.warn('Cannot navigate: resumeData.user_id is missing or invalid:', resumeData?.user_id);
      alert('Cannot view profile: This resume is missing a user ID.');
    }
  };

  const handleOpenNewTab = async (e) => {
    e.stopPropagation();
    if (resumeData?.user_id && resumeData.user_id !== 'undefined' && resumeData.user_id !== undefined && resumeData.user_id !== null && resumeData.user_id !== '') {
      try {
        window.open(`/profile/${resumeData.user_id}`, '_blank');
      } catch (err) {
        console.error("Error in handleOpenNewTab:", err);
      }
    } else {
      console.warn('Cannot open new tab: resumeData.user_id is missing or invalid:', resumeData?.user_id);
      alert('Cannot view profile: This resume is missing a user ID.');
    }
  };

  const toggleReasons = (e) => {
    e.stopPropagation(); // Prevent card click
    setShowReasons(!showReasons);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height: '100%' }}
    >
      <StyledCard 
        onClick={handleCardClick}
        sx={{ 
          cursor: 'pointer',
          '&:hover': {
            boxShadow: `0 12px 45px -10px ${alpha(theme.palette.primary.main, 0.3)}`
          },
          position: 'relative',
        }}
      >
        {/* Info Button */}
        {matchReasons.length > 0 && (
          <Tooltip title="Why this match?">
            <InfoButton 
              size="small" 
              onClick={toggleReasons}
              aria-label="Show match reasons"
            >
              <InfoOutlined fontSize="small" />
            </InfoButton>
          </Tooltip>
        )}

        {/* Open in New Tab Button */}
        <Tooltip title="Open profile in new tab">
          <IconButton
            size="small"
            onClick={handleOpenNewTab}
            sx={{
              position: 'absolute',
              top: 12,
              right: matchReasons.length > 0 ? 48 : 12,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              color: theme.palette.primary.main,
              width: 32,
              height: 32,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <CardContent sx={{ flex: 1, p: 2.5 }}>
          {/* Header with Avatar and Name */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              color: 'primary.main',
              width: 60, 
              height: 60,
              fontSize: '1.5rem',
              fontWeight: 700 
            }}>
              {safeInitial()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {resumeData?.name || 'Unnamed Candidate'}
              </Typography>
              <ScoreBadge label={`${formattedScore} Match`} />
            </Box>
          </Stack>
          
          {/* Resume Details */}
          <Stack spacing={2}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                🎓 Education
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {educationText}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                💼 Experience
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {experienceText}
              </Typography>
            </Box>
            
            {skills.length > 0 && (
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  🔧 Skills
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {skills.slice(0, MAX_SKILLS).map((skill, index) => (
                    <DetailChip key={index}>{skill}</DetailChip>
                  ))}
                  {skills.length > MAX_SKILLS && (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>+{skills.length - MAX_SKILLS} more</Typography>
                  )}
                </Stack>
              </Box>
            )}
            
            {languages.length > 0 && (
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  🌍 Languages
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {languages.map((lang, index) => {
                    const display = typeof lang === 'string'
                      ? lang
                      : `${lang.name || ''}${lang.fluency ? ` - ${lang.fluency}` : ''}`;
                    return <DetailChip key={index}>{display}</DetailChip>;
                  })}
                </Stack>
              </Box>
            )}
            {certifications.length > 0 && (
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  🏆 Certifications
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {certifications.map((cert, index) => (
                    <DetailChip key={index}>{cert}</DetailChip>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>

          {/* Match reasons section */}
          {matchReasons.length > 0 && (
            <Collapse in={showReasons} timeout="auto" unmountOnExit>
              <Box sx={{ mb: 2, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.7), borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}` }}>
                <Typography variant="body1" color="primary.main" sx={{ mb: 2, fontWeight: 600 }}>
                  ⭐ Why This Match
                </Typography>
                {processedMatchReasons.map((reason, idx) => {
                  const isStrength = reason.startsWith('✓ Strength:');
                  const isGap = reason.startsWith('△ Gap:');
                  const isLongReasoning = reason.length > 100;
                  
                  if (isLongReasoning && idx === 0) {
                    // First long reasoning is likely from LLM
                    return (
                      <Box key={idx} sx={{ mb: 2, pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontStyle: 'italic', lineHeight: 1.5 }}
                        >
                          {reason}
                        </Typography>
                      </Box>
                    );
                  } else if (isStrength) {
                    // Display strengths with green check
                    return (
                      <ListItem 
                        key={idx} 
                        dense 
                        disableGutters 
                        disablePadding 
                        sx={{ mb: 0.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <Check sx={{ color: 'success.main' }} fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={reason.replace('✓ Strength: ', '')} 
                          primaryTypographyProps={{ 
                            variant: 'body2', 
                            color: 'success.dark',
                            fontWeight: 500
                          }} 
                        />
                      </ListItem>
                    );
                  } else if (isGap) {
                    // Display gaps with warning triangle
                    return (
                      <ListItem 
                        key={idx} 
                        dense 
                        disableGutters 
                        disablePadding 
                        sx={{ mb: 0.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <span style={{ color: '#ED6C02', fontSize: '18px' }}>△</span>
                        </ListItemIcon>
                        <ListItemText 
                          primary={reason.replace('△ Gap: ', '')} 
                          primaryTypographyProps={{ 
                            variant: 'body2', 
                            color: 'warning.dark' 
                          }} 
                        />
                      </ListItem>
                    );
                  } else {
                    // Regular match reason
                    return (
                      <ListItem 
                        key={idx} 
                        dense 
                        disableGutters 
                        disablePadding 
                        sx={{ mb: 0.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <Check color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={reason} 
                          primaryTypographyProps={{ 
                            variant: 'body2', 
                            color: 'text.secondary' 
                          }} 
                        />
                      </ListItem>
                    );
                  }
                })}
              </Box>
            </Collapse>
          )}
        </CardContent>
      </StyledCard>
    </motion.div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(ResumeCard);