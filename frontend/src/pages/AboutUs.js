import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  Paper,
  Divider,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import { alpha, useTheme } from '@mui/material/styles';
import PageHero from '../components/PageHero';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
};

// Values data
const values = [
  {
    title: "Innovation",
    icon: "💡",
    description: "Pushing boundaries in AI-driven recruitment and user-centered design.",
    color: "#b69ac1"
  },
  {
    title: "Fairness",
    icon: "⚖️",
    description: "Building technology that promotes unbiased and inclusive hiring decisions.",
    color: "#c7dde7"
  },
  {
    title: "Privacy",
    icon: "🔒",
    description: "Ensuring data protection and confidentiality at every stage of the recruitment process.",
    color: "#9ba2c2"
  },
  {
    title: "Excellence",
    icon: "🌟",
    description: "Delivering top-tier solutions that empower recruiters and job seekers alike.",
    color: "#553d8e"
  },
];

const AboutUs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      <PageHero 
        title="About Us"
        subtitle="The team behind QuirkHire – Innovating how hiring works"
        image="/AboutUs.jpg"
      />

      <Container maxWidth="lg">
        {/* Mission Statement with Gradient Text and Animation */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <Box sx={{ 
            py: 8, 
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              sx={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, rgba(255,255,255,0) 70%)`,
                zIndex: 0
              }}
            />
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              sx={{
                position: 'absolute',
                bottom: -50,
                left: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.2)} 0%, rgba(255,255,255,0) 70%)`,
                zIndex: 0
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h3" 
                component={motion.h3}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                sx={{
                  fontWeight: 800,
                  mb: 4,
                  background: 'linear-gradient(45deg, #553d8e 30%, #9ba2c2 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Our Mission
              </Typography>
              <Typography 
                variant="h6" 
                component={motion.p}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                color="text.secondary" 
                sx={{ 
                  mb: 4,
                  maxWidth: 800,
                  mx: 'auto',
                  lineHeight: 1.8
                }}
              >
                At QuirkHire, we're revolutionizing talent acquisition through advanced AI technology. Our mission is to create a 
                world where every candidate finds their ideal career path, and every employer discovers perfect-fit talent. 
                By combining natural language processing with innovative LLM technology, we've built a recommendation system that 
                understands the nuances of skills, experiences, and cultural fit beyond simple keyword matching.
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* "Who We Are" Section with Animated Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 4,
              p: { xs: 3, md: 6 },
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              mb: 8,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Decorative elements */}
            <Box
              component={motion.div}
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
              sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                opacity: 0.5,
                zIndex: 0
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ textAlign: 'center', mb: 5 }}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Typography 
                    variant="h4" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 700,
                      position: 'relative',
                      display: 'inline-block',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 80,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'primary.main'
                      }
                    }}
                  >
                    Who We Are
                  </Typography>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mt: 4,
                      mb: 5,
                      color: 'text.secondary',
                      maxWidth: 700,
                      mx: 'auto'
                    }}
                  >
                    We're a passionate team of computer science students from ESPRIT Monastir in Tunisia, 
                    bringing fresh perspectives and innovative ideas to the recruitment technology space.
                  </Typography>
                </motion.div>
              </Box>

              {/* Team Characteristics */}
              <Grid 
                container 
                spacing={4} 
                component={motion.div}
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <Grid item xs={12} md={6} component={motion.div} variants={item}>
                  <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 400 }}>
                    <Card sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          mr: 2
                        }}>
                          🎓
                        </Box>
                        <Typography variant="h6" fontWeight={600}>Academic Excellence</Typography>
                      </Box>
                      <Typography>Combining our classroom knowledge with real-world applications, bringing theoretical concepts to life through practical implementation.</Typography>
                    </Card>
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={6} component={motion.div} variants={item}>
                  <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 400 }}>
                    <Card sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.15)}`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          color: 'secondary.dark',
                          mr: 2
                        }}>
                          💡
                        </Box>
                        <Typography variant="h6" fontWeight={600}>Innovative Mindset</Typography>
                      </Box>
                      <Typography>Challenging traditional recruitment approaches with AI-driven solutions that rethink how talent and opportunity connect.</Typography>
                    </Card>
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={6} component={motion.div} variants={item}>
                  <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 400 }}>
                    <Card sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.dark, 0.15)}`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                          backgroundColor: alpha(theme.palette.primary.dark, 0.1),
                          color: 'primary.dark',
                          mr: 2
                        }}>
                          🌍
                        </Box>
                        <Typography variant="h6" fontWeight={600}>Tunisian Talent</Typography>
                      </Box>
                      <Typography>Proud to represent the growing tech ecosystem in Tunisia, showcasing the incredible talent and innovation coming from North Africa.</Typography>
                    </Card>
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={6} component={motion.div} variants={item}>
                  <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 400 }}>
                    <Card sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.dark, 0.15)}`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                          backgroundColor: alpha(theme.palette.secondary.dark, 0.1),
                          color: 'secondary.dark',
                          mr: 2
                        }}>
                          🚀
                        </Box>
                        <Typography variant="h6" fontWeight={600}>Future Visionaries</Typography>
                      </Box>
                      <Typography>Driven by a passion to transform how companies discover talent globally, making hiring more efficient, fair, and human-centered.</Typography>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
              
              <Box sx={{ textAlign: 'center', mt: 5 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Typography variant="h6" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    QuirkHire represents not just a project, but our vision for the future of recruitment technology developed by tomorrow's tech leaders.
                  </Typography>
                </motion.div>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Our Values with Animated Cards */}
        <Box sx={{ mb: 10 }}>
          <Typography 
            variant="h4" 
            align="center" 
            component={motion.h4}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            sx={{ 
              fontWeight: 700, 
              mb: 6,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -15,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 80,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'primary.main'
              }
            }}
          >
            Our Values
          </Typography>
          
          <Grid 
            container 
            spacing={4}
            component={motion.div}
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
              <Grid item xs={12} sm={6} md={3} key={value.title} component={motion.div} variants={item}>
                <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      p: 4,
                      textAlign: 'center',
                      borderRadius: 4,
                      border: `1px solid ${alpha(value.color, 0.2)}`,
                      boxShadow: `0 10px 30px -10px ${alpha(value.color, 0.15)}`,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Typography variant="h2" sx={{ mb: 2, color: value.color }}>
                      {value.icon}
                    </Typography>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {value.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutUs;
