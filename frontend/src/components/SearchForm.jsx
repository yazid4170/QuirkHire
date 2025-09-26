// components/SearchForm.jsx
import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Paper, 
  Typography,
  styled,
  useTheme,
  CircularProgress,
  InputAdornment,
  Slider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import { alpha } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 4,
  padding: theme.spacing(4),
  background: theme.palette.background.paper,
  boxShadow: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: alpha(theme.palette.background.default, 0.8),
    transition: 'all 0.3s ease',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.default, 0.95),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    '&.Mui-focused': {
      backgroundColor: alpha(theme.palette.background.default, 1),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  }
}));

const AndMoreChip = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.text.secondary,
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '0.7rem',
  fontStyle: 'italic',
  border: `1px solid ${theme.palette.grey[300]}`,
}));

const SearchForm = ({ onSubmit, loading }) => {
  const theme = useTheme();
  const [jobDesc, setJobDesc] = useState('');
  const [topN, setTopN] = useState(5);
  const [recommendationType, setRecommendationType] = useState('hybrid');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ 
      jobDesc, 
      topN: Number(topN),
      recommendationType
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StyledPaper>
        <Box component="form" onSubmit={handleSubmit}>
          <StyledTextField
            fullWidth
            multiline
            rows={4}
            label="Put job desciption here:"
            placeholder="Example: We're looking for a Full Stack Developer with 3+ years experience in React and Node.js. The ideal candidate should have strong skills in JavaScript, TypeScript, and REST API development. Experience with cloud platforms like AWS or Azure is a plus. Responsibilities will include designing and implementing scalable web applications, collaborating with cross-functional teams, and maintaining code quality through testing and code reviews."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', ml: 1 }} />
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ 
            mt: 4, 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <PeopleAltOutlinedIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 180 }}>
              Number of candidates: {topN}
            </Typography>
            <Slider
              value={topN}
              onChange={(_, value) => setTopN(value)}
              min={1}
              max={20}
              sx={{
                color: theme.palette.primary.main,
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                },
                '& .MuiSlider-rail': {
                  opacity: 0.2
                }
              }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                color: 'text.primary',
                fontWeight: 500
              }}>
                <ManageSearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                Recommendation Engine
              </FormLabel>
              
              <RadioGroup
                row
                name="recommendation-type"
                value={recommendationType}
                onChange={(e) => setRecommendationType(e.target.value)}
              >
                <Tooltip title="Combines NLP and LLM for more comprehensive recommendations">
                  <FormControlLabel 
                    value="hybrid" 
                    control={<Radio />} 
                    label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SmartToyIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                      <Typography variant="body2">Hybrid (Recommended)</Typography>
                    </Box>} 
                  />
                </Tooltip>
                <Tooltip title="Traditional NLP-based recommendation using sentence embeddings">
                  <FormControlLabel 
                    value="traditional" 
                    control={<Radio />} 
                    label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PsychologyAltIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                      <Typography variant="body2">Quick Match</Typography>
                    </Box>} 
                  />
                </Tooltip>
                
      
                
                <Tooltip title="Pure LLM-based recommendation with deep reasoning">
                  <FormControlLabel 
                    value="llm_only" 
                    control={<Radio />} 
                    label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SmartToyIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                      <Typography variant="body2">Deep Match</Typography>
                    </Box>} 
                  />
                </Tooltip>
              </RadioGroup>
            </FormControl>
          </Box>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: theme.shape.borderRadius * 2,
              background: theme.palette.primary.main,
              color: '#fff',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: theme.palette.primary.dark,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&.Mui-disabled': {
                background: theme.palette.action.disabledBackground
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Find Matches'
            )}
          </Button>
        </Box>
      </StyledPaper>
    </motion.div>
  );
};

export default SearchForm;