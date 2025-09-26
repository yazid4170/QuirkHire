import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, TextField, Button, Grid, Paper, 
  IconButton, Divider, useTheme, Autocomplete, Chip, Alert,
  Backdrop, CircularProgress, Snackbar, AlertTitle, LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  AddCircleOutline, DeleteOutline, WorkOutline, SchoolOutlined, 
  LanguageOutlined, CodeOutlined, CardMembershipOutlined,
  FileUploadOutlined, PictureAsPdfOutlined, UploadFileOutlined,
  AutoAwesomeOutlined
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import axios from 'axios';

const predefinedLanguages = [
  'English', 'Spanish', 'French', 'German', 'Mandarin',
  'Arabic', 'Hindi', 'Portuguese', 'Russian', 'Japanese'
];

const fluencyLevels = [
  'Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'
];

const CreateResumePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState({
    education: [{ institution: '', degree: '' }],
    skills: [],
    experience: [{
      company: '',
      position: '',
      start_date: '',
      end_date: '',
      description: ''
    }],
    languages: [], // Will store objects like {name: 'English', fluency: 'Native'}
    certifications: ['']
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // PDF processing states
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [parsingPdf, setParsingPdf] = useState(false);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingMessage, setParsingMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Use environment variable for API base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  
  // File upload reference
  const fileInputRef = React.useRef();

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: resume, error } = await supabase
            .from('resumes')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (resume) {
            // Convert the DB format to our local state format
            setResumeData({
              education: resume.education || [{ institution: '', degree: '' }],
              skills: resume.skills || [],
              experience: resume.experience || [{
                company: '',
                position: '',
                start_date: '',
                end_date: '',
                description: ''
              }],
              languages: resume.languages || [],
              certifications: resume.certifications || ['']
            });
          }
        }
      } catch (error) {
        console.error('Error fetching resume:', error);
      }
    };

    fetchResume();
  }, []);
  
  // Handle PDF file selection
  const handlePdfFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if file is a PDF
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      setPdfFile(file);
    }
  };
  
  // Handle extracting text from PDF using backend API
  const handleExtractPdfText = async () => {
    if (!pdfFile) {
      setError('Please select a PDF resume first');
      return;
    }
    
    setParsingPdf(true);
    setParsingProgress(10);
    setParsingMessage('Uploading PDF...');
    setError(null);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('pdf_file', pdfFile);
      
      // Upload PDF and extract text
      setParsingProgress(30);
      setParsingMessage('Processing PDF content...');
      const response = await axios.post(
        `${API_BASE_URL}/parse-resume/`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressEvent => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            if (percentCompleted <= 30) {
              setParsingProgress(percentCompleted);
            }
          }
        }
      );

      if (response.data && response.data.extracted_text) {
        setExtractedText(response.data.extracted_text);
        setParsingProgress(50);
        setParsingMessage('Processing your resume...');
        handleParsePdfWithDeepSeek(response.data.extracted_text);
      } else {
        throw new Error('Failed to extract text from PDF');
      }
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      setError(err.message || 'An error occurred while processing your resume');
      setParsingPdf(false);
    }
  };
  
  // Parse the extracted text with DeepSeek model through OpenRouter
  const handleParsePdfWithDeepSeek = async (extractedText) => {
    try {
      const systemMessage = {
        role: "system",
        content: `You are an expert resume parser that can extract structured information from resume text. 
        Parse the following resume text and return a JSON object with the following structure:
        {
          "education": [{ "institution": "University Name", "degree": "Degree Name" }],
          "skills": ["Skill 1", "Skill 2"],
          "experience": [{
            "company": "Company Name",
            "position": "Position Title",
            "start_date": "YYYY-MM-DD", 
            "end_date": "YYYY-MM-DD",
            "description": "Job description"
          }],
          "languages": ["Language 1", "Language 2"],
          "certifications": ["Certification 1", "Certification 2"]
        }
        
        Important instructions:
        1. Extract as many details as possible from the resume text.
        2. For dates, convert them to YYYY-MM-DD format if possible, or leave blank if not specified.
        3. For skills, include technical skills, soft skills, and tools/technologies mentioned.
        4. Only include the JSON in your response, no other text.
        5. If a section has no data, include it with empty arrays or appropriate defaults.
        6. Make sure the output is valid JSON that can be parsed with JSON.parse().`
      };

      const userMessage = { role: "user", content: extractedText };
      setParsingProgress(70);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.REACT_APP_SITE_URL,
          'X-Title': process.env.REACT_APP_SITE_NAME,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat:free",
          messages: [systemMessage, userMessage],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setParsingProgress(90);
      setParsingMessage('Updating resume form...');
      
      // Get the response content from DeepSeek
      const parsedContent = data.choices[0].message.content;
      
      // Extract the JSON part (in case there's any non-JSON text)
      const jsonMatch = parsedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          
          // Update the resume data with parsed content, keeping original structure
          setResumeData({
            education: parsedData.education?.length > 0 
              ? parsedData.education 
              : [{ institution: '', degree: '' }],
            experience: parsedData.experience?.length > 0 
              ? parsedData.experience.map(exp => ({
                  ...exp,
                  start_date: exp.start_date || '',
                  end_date: exp.end_date || '',
                  description: exp.description || ''
                }))
              : [{
                  company: '',
                  position: '',
                  start_date: '',
                  end_date: '',
                  description: ''
                }],
            skills: parsedData.skills || [],
            languages: parsedData.languages?.length > 0
              ? parsedData.languages.map(lang => {
                  // Handle both string format and object format
                  if (typeof lang === 'string') {
                    return { name: lang, fluency: 'Intermediate' };
                  } else if (typeof lang === 'object') {
                    return {
                      name: lang.name || lang.language || '',
                      fluency: lang.fluency || lang.level || 'Intermediate'
                    };
                  }
                  return { name: '', fluency: 'Intermediate' };
                })
              : [],
            certifications: parsedData.certifications?.length > 0 
              ? parsedData.certifications 
              : ['']
          });
          
          setParsingProgress(100);
          setSuccessMessage('Resume parsed successfully! Please review and edit the information as needed.');
        } catch (jsonError) {
          console.error('Error parsing JSON from LLM response:', jsonError);
          setError('Failed to parse the resume structure from AI response');
        }
      } else {
        setError('Invalid response format from AI model');
      }
    } catch (err) {
      console.error('Error parsing:', err);
      setError(err.message || 'An error occurred while parsing your resume with AI');
    } finally {
      setParsingPdf(false);
      setPdfFile(null);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle closing the success message
  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };

  const handleChange = (field, index, subField) => (e) => {
    if (index !== undefined && subField) {
      setResumeData(prev => ({
        ...prev,
        [field]: prev[field].map((item, i) => 
          i === index ? { ...item, [subField]: e.target.value } : item
        )
      }));
    } else if (index !== undefined) {
      setResumeData(prev => ({
        ...prev,
        [field]: prev[field].map((item, i) => 
          i === index ? e.target.value : item
        )
      }));
    } else {
      setResumeData(prev => ({
        ...prev,
        [field]: e.target.value
      }));
    }
  };

  const handleAddItem = (field) => (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      setResumeData(prev => ({
        ...prev,
        [field]: [...prev[field], e.target.value.trim()]
      }));
      e.target.value = '';
    }
  };

  const handleAddCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const handleAddExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        description: ''
      }]
    }));
  };

  const handleRemoveItem = (field, index) => {
    setResumeData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleAddEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '' }]
    }));
  };

  const handleAddSkill = () => {
    const input = document.getElementById('skill-input');
    if (input.value.trim()) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, input.value.trim()]
      }));
      input.value = '';
    }
  };

  const handleLanguageChange = (event, value, fieldName, index) => {
    if (fieldName === 'name') {
      // Adding a new language
      if (index === -1) {
        // Ensure value is treated as a string for the name
        const languageName = typeof value === 'string' ? value : '';
        
        setResumeData(prev => ({
          ...prev,
          languages: [...prev.languages, { name: languageName, fluency: 'Intermediate' }] // Default fluency
        }));
      } else {
        // Updating existing language name
        const languageName = typeof value === 'string' ? value : '';
        
        setResumeData(prev => ({
          ...prev,
          languages: prev.languages.map((lang, i) => 
            i === index ? { name: languageName, fluency: lang.fluency || 'Intermediate' } : lang
          )
        }));
      }
    } else if (fieldName === 'fluency') {
      // Updating fluency level of a language
      const fluencyLevel = typeof value === 'string' ? value : 'Intermediate';
      
      setResumeData(prev => ({
        ...prev,
        languages: prev.languages.map((lang, i) => 
          i === index ? { name: lang.name || '', fluency: fluencyLevel } : lang
        )
      }));
    }
  };
  
  const handleRemoveLanguage = (index) => {
    setResumeData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const generateEmbedding = async (resumeData) => {
    try {
      // Prepare data for embedding generation
      const embeddingData = {
        education: resumeData.education.map(edu => ({
          degree: edu.degree,
          institution: edu.institution
        })),
        skills: resumeData.skills,
        experience: resumeData.experience,
        languages: resumeData.languages, // Already in the correct format with name and fluency
        certifications: resumeData.certifications
      };

      const response = await axios.post(`${API_BASE_URL}/generate-embedding/`, {
        resume_data: embeddingData,
      });

      // Decode Base64 string to binary
      const embedding = atob(response.data.embedding);
      return new Uint8Array(embedding.split('').map(char => char.charCodeAt(0)));
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const embedding = await generateEmbedding(resumeData);
      await saveResumeToSupabase({ ...resumeData, embedding });
    } catch (error) {
      console.error("Error saving resume:", error);
      setError(error.message || 'Failed to save resume');
    } finally {
      setSubmitting(false);
    }
  };

  const saveResumeToSupabase = async (resumeData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Convert embedding to Base64 string
      const embeddingBase64 = btoa(String.fromCharCode(...new Uint8Array(resumeData.embedding)));

      // Prepare resume data for Supabase
      const supabaseResume = {
        user_id: user.id,
        ...resumeData,
        embedding: embeddingBase64,  // Store as Base64 string
        updated_at: new Date().toISOString()
      };

      // Upsert to Supabase (update if exists, insert if not)
      const { data, error } = await supabase
        .from('resumes')
        .upsert([supabaseResume], {
          onConflict: 'user_id',
          returning: 'representation'
        })
        .select('*')
        .single();

      if (error) throw error;

      // Handle success
      navigate('/profile');
    } catch (error) {
      console.error('Error saving resume:', error);
      setError(error.message || 'Failed to save resume');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{
        borderRadius: 4,
        bgcolor: 'background.paper',
        p: { xs: 2, md: 4 },
        boxShadow: '0 12px 32px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            mb: 1
          }}>
            Build Your Professional Resume
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Showcase your skills and experience with our modern resume builder
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          {/* PDF Upload Section */}
          <Box maxWidth="md" sx={{ mx: 'auto' }}>
            <Paper sx={{ mb: 4, p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PictureAsPdfOutlined sx={{ 
                  fontSize: 32, 
                  color: 'primary.main',
                  mr: 2 
                }}/>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Upload Resume PDF
                </Typography>
              </Box>
              
              <Box sx={{
                p: 3,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 2
              }}>
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="pdf-upload"
                  onChange={handlePdfFileChange}
                  ref={fileInputRef}
                />
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  mb: 2 
                }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
                    Already have a resume? Just upload your PDF and our AI will do the rest.
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    width: '100%',
                    ...(pdfFile ? {} : { flexDirection: 'column' })
                  }}>
                    {!pdfFile ? (
                      <>
                        <label htmlFor="pdf-upload" style={{ width: '100%' }}>
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<UploadFileOutlined />}
                            fullWidth
                          >
                            Select PDF Resume
                          </Button>
                        </label>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
                          Make sure to verify the information before submitting
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Box sx={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                          borderRadius: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          <PictureAsPdfOutlined sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography noWrap>
                            {pdfFile.name}
                          </Typography>
                        </Box>
                        
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleExtractPdfText}
                          disabled={parsingPdf}
                          startIcon={<AutoAwesomeOutlined />}
                        >
                          Parse with AI
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
            
            {/* Backdrop for parsing progress */}
            <Backdrop
              sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column' }}
              open={parsingPdf}
            >
              <CircularProgress color="inherit" sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>{parsingMessage}</Typography>
              <Box sx={{ width: '50%', maxWidth: '400px' }}>
                <LinearProgress variant="determinate" value={parsingProgress} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {parsingProgress}% Complete
                </Typography>
              </Box>
            </Backdrop>
            
            {/* Success message */}
            <Snackbar 
              open={!!successMessage} 
              autoHideDuration={6000} 
              onClose={handleCloseSuccess}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                <AlertTitle>Success</AlertTitle>
                {successMessage}
              </Alert>
            </Snackbar>

            {/* Error message */}
            {error && (
              <Alert severity="error" sx={{ mb: 4 }}>
                {error}
              </Alert>
            )}
          </Box>
          
          {/* Education Section */}
          <Paper sx={{ mb: 4, p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SchoolOutlined sx={{ 
                fontSize: 32, 
                color: 'primary.main',
                mr: 2 
              }}/>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Education
              </Typography>
            </Box>
            
            {resumeData.education.map((edu, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Institution Name"
                      variant="outlined"
                      value={edu.institution}
                      onChange={(e) => handleChange('education', index, 'institution')(e)}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Degree"
                      variant="outlined"
                      value={edu.degree}
                      onChange={(e) => handleChange('education', index, 'degree')(e)}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={12} sx={{ textAlign: 'right' }}>
                    <IconButton 
                      onClick={() => handleRemoveItem('education', index)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              startIcon={<AddCircleOutline />}
              onClick={handleAddEducation}
              sx={{
                mt: 1,
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              Add Education
            </Button>
          </Paper>

          {/* Experience Section */}
          <Paper sx={{ mb: 4, p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <WorkOutline sx={{ 
                fontSize: 32, 
                color: 'primary.main',
                mr: 2 
              }}/>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Work Experience
              </Typography>
            </Box>

            {resumeData.experience.map((exp, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      variant="outlined"
                      value={exp.company}
                      onChange={(e) => handleChange('experience', index, 'company')(e)}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Position"
                      variant="outlined"
                      value={exp.position}
                      onChange={(e) => handleChange('experience', index, 'position')(e)}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      variant="outlined"
                      value={exp.start_date}
                      onChange={(e) => handleChange('experience', index, 'start_date')(e)}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      variant="outlined"
                      value={exp.end_date}
                      onChange={(e) => handleChange('experience', index, 'end_date')(e)}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      variant="outlined"
                      multiline
                      rows={3}
                      value={exp.description}
                      onChange={(e) => handleChange('experience', index, 'description')(e)}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: 'right' }}>
                    <IconButton 
                      onClick={() => handleRemoveItem('experience', index)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              startIcon={<AddCircleOutline />}
              onClick={handleAddExperience}
              sx={{
                mt: 1,
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              Add Experience
            </Button>
          </Paper>

          {/* Skills & Languages Section */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CodeOutlined sx={{ 
                    fontSize: 32, 
                    color: 'primary.main',
                    mr: 2 
                  }}/>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Technical Skills
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  {resumeData.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      onDelete={() => handleRemoveItem('skills', index)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    id="skill-input"
                    variant="outlined"
                    label="Add Skill"
                    InputProps={{
                      sx: { borderRadius: 2 },
                      endAdornment: (
                        <IconButton onClick={handleAddSkill}>
                          <AddCircleOutline sx={{ color: 'text.secondary' }} />
                        </IconButton>
                      )
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LanguageOutlined sx={{ 
                    fontSize: 32, 
                    color: 'primary.main',
                    mr: 2 
                  }}/>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Languages
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  {resumeData.languages.map((lang, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Autocomplete
                            options={predefinedLanguages}
                            value={lang.name || ''}
                            onChange={(e, newValue) => handleLanguageChange(e, newValue, 'name', index)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                variant="outlined"
                                label="Language"
                                placeholder="Select language"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <Autocomplete
                            options={fluencyLevels}
                            value={lang.fluency || 'Intermediate'}
                            onChange={(e, newValue) => handleLanguageChange(e, newValue, 'fluency', index)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                variant="outlined"
                                label="Fluency Level"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconButton 
                            onClick={() => handleRemoveLanguage(index)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteOutline />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Box>
                
                <Button
                  startIcon={<AddCircleOutline />}
                  onClick={() => handleLanguageChange(null, '', 'name', -1)}
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  Add Language
                </Button>
              </Paper>
            </Grid>
          </Grid>

          {/* Certifications Section */}
          <Paper sx={{ mb: 4, p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CardMembershipOutlined sx={{ 
                fontSize: 32, 
                color: 'primary.main',
                mr: 2 
              }}/>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Certifications
              </Typography>
            </Box>
            
            {resumeData.certifications.map((cert, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={10}>
                    <TextField
                      fullWidth
                      label={`Certification ${index + 1}`}
                      variant="outlined"
                      value={cert}
                      onChange={handleChange('certifications', index)}
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <IconButton 
                      onClick={() => handleRemoveItem('certifications', index)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              startIcon={<AddCircleOutline />}
              onClick={handleAddCertification}
              sx={{
                mt: 1,
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              Add Certification
            </Button>
          </Paper>

          {/* Form Actions */}
          <Box sx={{ 
            mt: 6, 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            pt: 4
          }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/profile')}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {submitting
                ? <CircularProgress size={24} color="inherit" />
                : 'Save & Preview'
              }
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateResumePage;