import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Typography, TextField, IconButton, Paper, CircularProgress, 
  Avatar, Button, MenuItem, Select, FormControl, InputLabel, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Divider, useMediaQuery
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LanguageIcon from '@mui/icons-material/Language';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import FeedbackIcon from '@mui/icons-material/Feedback';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

// Custom theme with light blue and light purple
const theme = createTheme({
  palette: {
    primary: {
      main: '#6096FA', // light blue
      light: '#E6EFFF',
      dark: '#3D7AF0',
    },
    secondary: {
      main: '#9C84FF', // light purple
      light: '#F2EEFF',
      dark: '#7D5DFF',
    },
    background: {
      default: '#FBFBFE',
      paper: '#FFFFFF',
    },
    success: {
      main: '#38D9A9',
    },
    error: {
      main: '#FF6B8F',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 50,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #6096FA 0%, #7C8FFF 100%)',
        },
        containedSecondary: {
          background: 'linear-gradient(90deg, #9C84FF 0%, #B192FF 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
  },
});

function InterviewTrainer() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [debugMode, setDebugMode] = useState(process.env.REACT_APP_CHATBOT_DEBUG === 'true');
  const [resume, setResume] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [language, setLanguage] = useState('English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showTips, setShowTips] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const DEFAULT_RESUME = {
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: [
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        start_date: '2020-01-01',
        end_date: '2022-12-31',
        description: 'Developed web applications using modern JavaScript frameworks'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'State University',
        year: 2019
      }
    ]
  };

  // Fetch user's resume when component mounts
  useEffect(() => {
    let isMounted = true;

    const fetchResume = async () => {
      try {
        console.log('Fetching resume for user:', user.id);
        
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!isMounted) return;

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error('Resume not found');
        }

        console.log('Resume data:', data);
        setResume(data);
      } catch (error) {
        console.error('Error fetching resume:', error);
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: 'Failed to load resume. Using default interview questions.' 
        }]);
        setResume(DEFAULT_RESUME);
      }
    };

    if (user?.id) {
      fetchResume();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!process.env.REACT_APP_OPENROUTER_API_KEY) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: 'OpenRouter API key is not configured. Please contact support.' 
      }]);
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const systemMessage = {
        role: "system",
        content: `You are an AI interview trainer named HireBot. You will be conducting a technical interview. ${resume && Object.keys(resume).length > 0 
          ? `The user's resume information is: ${JSON.stringify(resume, null, 2)}`
          : 'No resume information available. Ask general interview questions.'
        }
        You will ask one question at a time.
        Your task is to:
        1. Start with a friendly introduction and ask the candidate to introduce themselves.
        2. After their introduction, ask **one question at a time** based on their experience and skills.
        3. Wait for the user's response before asking the next question.
        4. If the user types "/feedback" then provide detailed feedback on their answers and Offer specific tips for improvement, Provide constructive criticism and actionable advice.
        5. Simulate a realistic interview experience.
        6. Focus on their technical skills and project experience.
        7. When giving feedback, only focus on the user's answers to the question you asked.
        
        **Important**: Conduct the interview in ${language}. Start with a warm and professional tone.`
      };

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
          messages: [
            systemMessage,
            ...messages,
            userMessage
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data?.choices?.[0]?.message?.content || data.choices[0].message.content.trim() === '') {
        throw new Error('Received empty response from the interview bot');
      }
      
      const botMessage = data.choices[0].message;
      setMessages(prev => [...prev, botMessage]);

      if (!interviewStarted) {
        setInterviewStarted(true);
      }
      
      // Set feedback if the user requested it
      if (input.toLowerCase().includes('/feedback')) {
        setFeedback(botMessage.content);
      } else {
        setCurrentQuestion(botMessage.content);
      }
      
    } catch (error) {
      console.error('Error in chat completion:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error.message.includes('429') 
          ? 'You are sending too many requests. Please wait a moment and try again.' 
          : error.message.includes('empty response')
            ? 'Sorry, I couldn\'t generate a proper response. Please try asking again.'
            : 'Sorry, something went wrong. Please try again.' 
      }]);
    } finally {
      setLoading(false);
      setUsageCount(prev => prev + 1);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const systemMessage = {
        role: "system",
        content: `You are an AI interview trainer named HireBot. You will be conducting a technical interview. ${resume && Object.keys(resume).length > 0 
          ? `The user's resume information is: ${JSON.stringify(resume, null, 2)}`
          : 'No resume information available. Ask general interview questions.'
        }
        You will ask one question at a time.
        Your task is to:
        1. Start with a friendly introduction and ask the candidate to introduce themselves.
        2. After their introduction, ask **one question at a time** based on their experience and skills.
        3. Wait for the user's response before asking the next question.
        4. If the user types "/feedback" then provide detailed feedback on their answers and Offer specific tips for improvement, Provide constructive criticism and actionable advice.
        5. Simulate a realistic interview experience.
        6. Focus on their technical skills and project experience.
        7. When giving feedback, only focus on the user's answers to the question you asked.
        
        **Important**: Conduct the interview in ${language}. Start with a warm and professional tone.`
      };

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
          messages: [systemMessage],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data?.choices?.[0]?.message?.content || data.choices[0].message.content.trim() === '') {
        throw new Error('Received empty response from the interview bot');
      }
      
      const botMessage = data.choices[0].message;
      setMessages(prev => [...prev, botMessage]);
      setInterviewStarted(true);
      setCurrentQuestion(botMessage.content);
    } catch (error) {
      console.error('Error starting interview:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error.message.includes('empty response')
          ? 'Sorry, I couldn\'t generate a proper response. Please retry the interview.'
          : 'Sorry, something went wrong. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const resetInterview = () => {
    setMessages([]);
    setInterviewStarted(false);
    setCurrentQuestion(null);
    setFeedback(null);
  };

  const handleFeedback = () => {
    setInput('/feedback');
    handleSend();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const interviewTips = [
    "Use the STAR method: Situation, Task, Action, Result",
    "Research the company beforehand to personalize answers",
    "Type '/feedback' anytime for detailed feedback",
    "Be concise but thorough in your responses",
    "Prepare examples that highlight your technical skills"
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        maxWidth: '1000px', 
        margin: 'auto', 
        padding: { xs: 2, md: 3 },
        height: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
        borderRadius: 4,
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography 
            variant="h4" 
            component={motion.div}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ 
              background: 'linear-gradient(90deg, #6096FA 0%, #9C84FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <SmartToyIcon sx={{ color: '#6096FA' }} /> Interview Coach
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {interviewStarted && (
              <>
                <Chip
                  icon={<LanguageIcon />}
                  label={language}
                  color="primary"
                  variant="outlined"
                  onClick={() => setShowLanguageModal(true)}
                  sx={{ fontWeight: 500 }}
                />
                <IconButton 
                  size="small" 
                  color="secondary"
                  onClick={resetInterview}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'secondary.light'
                  }}
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Main Chat Area */}
        <Paper 
          elevation={0} 
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ 
            flex: 1, 
            padding: 2, 
            marginBottom: 2,
            overflowY: 'auto',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'rgba(0,0,0,0.06)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.03)',
            borderRadius: 3,
            position: 'relative',
          }}
        >
          {/* Empty State - Simplified */}
          {messages.length === 0 && !interviewStarted && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%',
              textAlign: 'center',
              gap: 4,
              padding: { xs: 2, md: 4 }
            }}>
              <Typography 
                variant="h5" 
                component={motion.p} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(90deg, #6096FA 0%, #9C84FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ready to ace your next interview?
              </Typography>
              
              <Typography 
                variant="body1" 
                component={motion.p}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                sx={{ color: 'text.secondary', maxWidth: '550px' }}
              >
                Practice with our AI-powered interview coach. Get real-time feedback and improve your interview skills for technical roles.
              </Typography>
            </Box>
          )}

          {/* Chat Messages */}
          <AnimatePresence>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {messages.map((msg, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    marginBottom: 2,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap: 1.5
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: msg.role === 'user' 
                          ? 'linear-gradient(90deg, #6096FA 0%, #7C8FFF 100%)' 
                          : 'linear-gradient(90deg, #9C84FF 0%, #B192FF 100%)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
                        padding: 0.5
                      }}
                    >
                      {msg.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                    </Avatar>
                    <Paper elevation={0} sx={{ 
                      padding: 2,
                      maxWidth: '80%',
                      backgroundColor: msg.role === 'user' ? 'primary.light' : 'secondary.light',
                      borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      border: '1px solid',
                      borderColor: msg.role === 'user' ? 'rgba(96, 150, 250, 0.2)' : 'rgba(156, 132, 255, 0.2)',
                    }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>
                    </Paper>
                  </Box>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          
          {/* Loading Indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress 
                size={28} 
                sx={{ 
                  color: 'secondary.main',
                }}
              />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Paper>

        {/* Interview Start Section */}
        {!interviewStarted && (
          <Box 
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center', 
              gap: 2,
              mb: 3
            }}
          >
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowTips(!showTips)}
              startIcon={<LightbulbIcon />}
              sx={{ 
                borderRadius: 50,
                border: '1px solid',
                borderColor: 'secondary.light',
                px: 3,
              }}
            >
              {showTips ? 'Hide Tips' : 'View Tips'}
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowLanguageModal(true)}
              disabled={loading}
              sx={{ 
                px: 4,
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)',
                  animation: 'shimmer 2s infinite',
                },
                '@keyframes shimmer': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' }
                }
              }}
            >
              Start Interview
            </Button>
          </Box>
        )}

        {/* Tips Section */}
        <AnimatePresence>
          {showTips && !interviewStarted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
              transition={{ duration: 0.3 }}
            >
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  mb: 2,
                  borderRadius: 3,
                  background: 'linear-gradient(145deg, rgba(156, 132, 255, 0.05) 0%, rgba(96, 150, 250, 0.05) 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(156, 132, 255, 0.2)',
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'secondary.dark',
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontWeight: 600
                  }}
                >
                  <LightbulbIcon sx={{ color: 'secondary.main' }} /> Pro Interview Tips
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  {interviewTips.map((tip, index) => (
                    <motion.div key={index} variants={itemVariants} custom={index}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1.5, 
                        gap: 2 
                      }}>
                        <Box sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: 'linear-gradient(90deg, #6096FA 0%, #9C84FF 100%)',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '12px',
                        }}>
                          {index + 1}
                        </Box>
                        <Typography variant="body1">{tip}</Typography>
                      </Box>
                    </motion.div>
                  ))}
                </motion.div>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        {interviewStarted && (
          <Box 
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                display: 'flex',
                gap: 1,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'rgba(0,0,0,0.06)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.03)'
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type your response here..."
                disabled={loading}
                multiline
                rows={isMobile ? 1 : 2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: 'transparent',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'transparent',
                    },
                  },
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton 
                  color="secondary" 
                  onClick={handleFeedback}
                  disabled={loading}
                  sx={{ 
                    p: 2,
                    bgcolor: 'secondary.light',
                  }}
                >
                  <FeedbackIcon />
                </IconButton>
                
                <IconButton 
                  color="primary" 
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  sx={{ 
                    p: 2, 
                    background: 'linear-gradient(90deg, #6096FA 0%, #7C8FFF 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #4D85F6 0%, #6A7BFF 100%)',
                    },
                    '&.Mui-disabled': {
                      background: '#E0E0E0',
                      color: '#A0A0A0',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </IconButton>
              </Box>
            </Paper>
            
            {/* Interview Progress Indicator */}
            {interviewStarted && (
              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'center',
                gap: 1
              }}>
                <Chip
                  size="small"
                  icon={<SmartToyIcon fontSize="small" />}
                  label="Interview in progress"
                  sx={{
                    background: 'linear-gradient(90deg, rgba(96, 150, 250, 0.1) 0%, rgba(156, 132, 255, 0.1) 100%)',
                    color: 'primary.dark',
                    fontWeight: 500
                  }}
                />
                
                {feedback && (
                  <Chip
                    size="small"
                    icon={<LightbulbIcon fontSize="small" />}
                    label="Feedback available"
                    color="secondary"
                    sx={{
                      background: 'linear-gradient(90deg, rgba(156, 132, 255, 0.1) 0%, rgba(177, 146, 255, 0.1) 100%)',
                      color: 'secondary.dark',
                      fontWeight: 500
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Language Selection Modal */}
        <Dialog 
          open={showLanguageModal} 
          onClose={() => setShowLanguageModal(false)}
          PaperProps={{
            sx: {
              borderRadius: 4,
              p: 1,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              maxWidth: 400,
              width: '100%'
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DialogTitle sx={{ 
              fontWeight: 600, 
              textAlign: 'center',
              pb: 1
            }}>
              Select Interview Language
            </DialogTitle>
            <DialogContent>
              <FormControl fullWidth>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Spanish">Spanish</MenuItem>
                  <MenuItem value="French">French</MenuItem>
                  <MenuItem value="German">German</MenuItem>
                  <MenuItem value="Chinese">Chinese</MenuItem>
                  <MenuItem value="Japanese">Japanese</MenuItem>
                  <MenuItem value="Arabic">Arabic</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
              <Button 
                onClick={() => setShowLanguageModal(false)} 
                color="secondary"
                variant="outlined"
                sx={{ width: '45%' }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowLanguageModal(false);
                  if (!interviewStarted) {
                    startInterview();
                  }
                }} 
                color="primary"
                variant="contained"
                sx={{ width: '45%' }}
              >
                {interviewStarted ? 'Apply' : 'Start Interview'}
              </Button>
            </DialogActions>
          </motion.div>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default InterviewTrainer;