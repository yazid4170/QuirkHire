import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Container, 
  Typography, 
  CircularProgress, 
  Alert, 
  Snackbar, 
  Grid, 
  Box,
  Fab,
  useScrollTrigger,
  Zoom,
  Fade,
  Paper,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { KeyboardArrowUp, ExpandMore, FilterList, Check } from '@mui/icons-material';
import SearchForm from '../components/SearchForm';
import ResumeCard from '../components/ResumeCard.jsx';
import PageHero from '../components/PageHero';
import { alpha } from '@mui/material/styles';

// Use environment variable for API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Debounce function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Scroll-to-top component
function ScrollTop(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

function ResumeRecommender() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [topN, setTopN] = useState(5);
  const [recommendationType, setRecommendationType] = useState('traditional');
  const [llmModel, setLlmModel] = useState('llama4');
  const [showLlmDetails, setShowLlmDetails] = useState(false);
  
  const debouncedJobDesc = useDebounce(jobDesc, 300);  // 300ms delay

  // Get recommendations based on selected type and parameters
  const getRecommendations = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setRecommendations([]);
    setShowLlmDetails(params.recommendationType !== 'traditional');
    
    try {
      // Determine which API endpoint to use based on recommendation type
      let endpoint = `${API_BASE_URL}/recommend/`;
      const apiParams = {
        job_description: params.jobDesc,
        top_n: params.topN
      };
      
      if (params.recommendationType === 'hybrid' || params.recommendationType === 'llm_only') {
        endpoint = `${API_BASE_URL}/recommend/llm/`;
        apiParams.model = params.llmModel;
        apiParams.recommendation_type = params.recommendationType === 'hybrid' ? 'hybrid' : 'llm_only';
      }
      
      console.log(`Fetching ${params.recommendationType} recommendations using endpoint:`, endpoint);
      const response = await axios.post(endpoint, apiParams);
      
      console.log("API Response:", response.data);
      
      // Log the structure of the first resume for debugging
      if (response.data && response.data.length > 0) {
        console.log("Example resume structure:", JSON.stringify(response.data[0], null, 2));
      }
      
      setRecommendations(response.data);
    } catch (error) {
      console.error("API Error:", error);
      setError("An error occurred while fetching recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handle form submission
  const handleSearch = useCallback((params) => {
    setJobDesc(params.jobDesc);
    setTopN(params.topN);
    setRecommendationType(params.recommendationType);
    setLlmModel(params.llmModel);
    
    getRecommendations(params);
  }, [getRecommendations]);
  
  // For backward compatibility with the debounced effect
  useEffect(() => {
    if (debouncedJobDesc && recommendationType === 'traditional') {
      console.log("Using debounced recommendations for:", debouncedJobDesc);
      setLoading(true);
      setError(null);
      
      axios.post(`${API_BASE_URL}/recommend/`, {
        job_description: debouncedJobDesc,
        top_n: topN
      })
        .then((response) => {
          console.log("API Response:", response.data);
          setRecommendations(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("API Error:", error);
          setError("An error occurred while fetching recommendations.");
          setLoading(false);
        });
    }
  }, [debouncedJobDesc, topN, recommendationType]);

  // Close error alert
  const handleCloseError = () => {
    setError(null);
  };
  
  // Format recommendations for consistent display - memoized to prevent unnecessary recalculations
  const formatRecommendations = useMemo(() => {
    console.log("Formatting recommendations:", recommendations);
    
    return recommendations.map(rec => {
      // In the traditional API response, resume data is directly in the recommendation object
      // NOT nested inside a 'resume' property
      const formattedResume = {
        ...rec,  // Take all properties from recommendation
        score: rec.score || 0.5  // Ensure score exists
      };
      
      // Make sure the resume has all required fields
      if (!formattedResume.education) formattedResume.education = [];
      if (!formattedResume.experience) formattedResume.experience = [];
      if (!formattedResume.skills) formattedResume.skills = [];
      if (!formattedResume.certifications) formattedResume.certifications = [];
      if (!formattedResume.languages) formattedResume.languages = [];
      
      // Add match reasons for LLM errors
      if (!formattedResume.match_reasons) {
        formattedResume.match_reasons = [];
      }
      
      // Check for API auth error in the reasoning
      if (formattedResume.reasoning && formattedResume.reasoning.includes('auth credentials') || 
          formattedResume.reasoning && formattedResume.reasoning.includes('API key is missing')) {
        formattedResume.match_reasons = [
          "LLM recommendation requires an OpenRouter API key. Please add your API key to the .env file.",
          "✓ Strength: Using traditional NLP matching as fallback",
          "△ Gap: Missing LLM enhanced matching capabilities"
        ];
      }
      
      // Log the resume object structure for debugging
      console.log("Resume data structure:", formattedResume);
      
      // Make sure profile data is included (name, email, etc)
      // This is normally joined from the profiles table
      if (!formattedResume.name && formattedResume.user_id) {
        formattedResume.name = `Candidate ${formattedResume.user_id}`;
      }
      
      // Add LLM reasoning as match reasons if available
      if (showLlmDetails) {
        const matchReasons = formattedResume.match_reasons || [];
        
        // Add main reasoning
        if (rec.reasoning || rec.llm_reasoning) {
          matchReasons.push(rec.reasoning || rec.llm_reasoning);
        }
        
        // Add strengths
        if (rec.strengths) {
          rec.strengths.forEach(strength => {
            matchReasons.push(`✓ Strength: ${strength}`);
          });
        }
        
        // Add weaknesses
        if (rec.weaknesses) {
          rec.weaknesses.forEach(weakness => {
            matchReasons.push(`△ Gap: ${weakness}`);
          });
        }
        
        if (matchReasons.length > 0) {
          formattedResume.match_reasons = matchReasons;
        }
      }
      
      // Format education if needed
      if (formattedResume.education.length > 0 && typeof formattedResume.education[0] === 'string') {
        // Convert string education to object format if needed
        formattedResume.education = formattedResume.education.map(edu => {
          if (typeof edu === 'string') {
            return { degree: edu, institution: '' };
          }
          return edu;
        });
      }
      
      // Format experience if needed
      if (formattedResume.experience.length > 0 && typeof formattedResume.experience[0] === 'string') {
        // Convert string experience to object format if needed
        formattedResume.experience = formattedResume.experience.map(exp => {
          if (typeof exp === 'string') {
            return { position: exp, company: '' };
          }
          return exp;
        });
      }
      
      return formattedResume;
    });
  }, [recommendations, showLlmDetails]); // Only recalculate when these change

  return (
    <Box>
      {/* Hero Section */}
      <PageHero 
        title="Resume Recommender" 
        subtitle="Find the best resumes that match your job description" 
      />
      <div id="back-to-top-anchor" />
      
      <Fade in={true} timeout={1000}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <SearchForm 
                onSubmit={handleSearch}
                loading={loading}
              />
            </Grid>
            
            {/* Error alert */}
            {error && (
              <Grid item xs={12}>
                <Alert 
                  severity="error" 
                  onClose={handleCloseError}
                  sx={{ width: '100%' }}
                >
                  {error}
                </Alert>
              </Grid>
            )}
            
            {/* Loading indicator */}
            {loading && (
              <Grid item xs={12} sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                  {recommendationType !== 'traditional' 
                    ? "AI is analyzing resumes, this might take a moment..."
                    : "Finding matches..."}
                </Typography>
              </Grid>
            )}
            
            {/* Recommendations */}
            {!loading && recommendations.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3, mt: 2 }}>
                  Found {recommendations.length} matching candidates
                </Typography>
                <Grid container spacing={3}>
                  {formatRecommendations.map((resume, index) => (
                    <Grid item key={index} xs={12} md={6} lg={4}>
                      <ResumeCard resume={resume} />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
            
            {/* No results */}
            {!loading && recommendations.length === 0 && jobDesc && (
              <Grid item xs={12} sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No matching candidates found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your job description or search criteria
                </Typography>
              </Grid>
            )}
          </Grid>
        </Container>
      </Fade>

      {/* Scroll-to-top Button */}
      <ScrollTop>
        <Fab color="primary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUp />
        </Fab>
      </ScrollTop>
    </Box>
  );
}

export default ResumeRecommender;
