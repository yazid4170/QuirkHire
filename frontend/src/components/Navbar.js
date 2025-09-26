import React, { useState, useEffect, useMemo } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Slide,
  Toolbar,
  Typography,
  useScrollTrigger,
  Avatar,
  alpha
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

// Hide AppBar on scroll
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Use the Auth context
  const { user: authUser } = useAuth();

  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Primary navigation links - visible for all roles.
  const navLinks = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
  ];

  // Memoize navigation links to prevent re-renders
  const allLinks = useMemo(() => {
    // Compute role-specific links - These will be empty if not authenticated
    // or if the role doesn't match
    const isAuthenticated = !!user;
  
    // Basic links visible to all users
    const basicLinks = [...navLinks];

    // Only add role-specific links for authenticated users
    if (isAuthenticated) {
      // Recruiter and admin links
      if (userRole === 'recruiter' || userRole === 'admin') {
        basicLinks.push({ label: "Find Candidates", path: "/recommend" });
      }
  
      // Candidate specific links
      if (userRole === 'candidate') {
        basicLinks.push({ label: "Interview Trainer", path: "/interview-trainer" });
      }
      
      // Admin-only links
      if (userRole === 'admin') {
        basicLinks.push(
          { label: "Admin Dashboard",  path: "/admin-dashboard"  },
          { label: "Resume Dashboard", path: "/admin-resume" },
          { label: "Reviews",         path: "/reviews" }
        );
      }
    }
  
    return basicLinks;
  }, [navLinks, user, userRole]); // Only recalculate when these dependencies change

  // Use a ref to prevent multiple fetches for the same user
  const fetchedUserIdRef = React.useRef(null);

  useEffect(() => {
    // Skip if no auth user
    if (!authUser) return;
    
    // Skip if we've already fetched for this specific user ID
    if (fetchedUserIdRef.current === authUser.id) return;

    console.log('[Navbar] Auth user detected:', authUser?.id);
    setUser(authUser);
    fetchedUserIdRef.current = authUser.id;

    // Fetch user role only once per session
    const fetchUserRole = async () => {
      try {
        // Try candidate profile first
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profile) {
          console.log('[Navbar] Found candidate role:', profile.role);
          setUserRole(profile.role);
          return;
        }

        // If no candidate profile, try recruiter profile
        const { data: recruiterProfile, error: recruiterError } = await supabase
          .from('recruiter_profiles')
          .select('role')
          .eq('id', authUser.id)
          .maybeSingle();

        if (recruiterProfile) {
          console.log('[Navbar] Found recruiter role:', recruiterProfile.role);
          setUserRole(recruiterProfile.role);
          return;
        }

        // No profile found
        console.warn('[Navbar] No profile found for user:', authUser.id);
        setUserRole(null);
      } catch (error) {
        console.error('[Navbar] Error fetching user role:', error);
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [authUser]);

  // Reset when auth user is null
  useEffect(() => {
    if (!authUser) {
      setUser(null);
      setUserRole(null);
      fetchedUserIdRef.current = null;
    }
  }, [authUser]);


  // Handle logout.
  const { signOut } = useAuth();
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      setProfileMenuAnchor(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Menu handlers.
  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  // Common button styling.
  const buttonStyle = {
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '0.95rem',
    borderRadius: 2,
    px: 2,
    py: 0.8,
    transition: 'all 0.2s ease'
  };

  // Mobile Menu rendering.
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchor}
      open={Boolean(mobileMenuAnchor)}
      onClose={handleMobileMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: 1.5,
          minWidth: 200,
          borderRadius: 2,
          overflow: 'visible',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.95))',
          backdropFilter: 'blur(10px)',
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 20,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {allLinks.map((link) => (
        <MenuItem
          key={link.path}
          component={Link}
          to={link.path}
          onClick={handleMobileMenuClose}
          sx={{
            color: location.pathname === link.path ? 'primary.main' : 'text.primary',
            fontWeight: location.pathname === link.path ? 600 : 500,
            py: 1.2,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha('#553d8e', 0.04),
              transform: 'translateX(5px)'
            }
          }}
        >
          {link.label}
        </MenuItem>
      ))}

      <Divider sx={{ my: 1.5 }} />

      <Box sx={{ px: 2, py: 1.5 }}>
        {user ? (
          <>
            <Button
              fullWidth
              variant="contained"
              component={Link}
              to="/profile"
              onClick={handleMobileMenuClose}
              sx={{
                mb: 1.5,
                background: 'linear-gradient(45deg, #553d8e 10%, #9575cd 90%)',
                color: 'white',
                fontWeight: 600,
                py: 1.2,
                borderRadius: 2,
                boxShadow: '0 2px 10px rgba(149, 117, 205, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 15px rgba(149, 117, 205, 0.4)'
                }
              }}
            >
              My Profile
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                handleMobileMenuClose();
                handleLogout();
              }}
              sx={{
                fontWeight: 600,
                py: 1.2,
                borderRadius: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: alpha('#553d8e', 0.04),
                  borderColor: 'primary.dark',
                }
              }}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                handleMobileMenuClose();
                navigate('/login');
              }}
              sx={{
                mb: 1.5,
                fontWeight: 600,
                color: 'primary.main',
                borderColor: 'primary.main',
                py: 1.2,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha('#553d8e', 0.04),
                  borderColor: 'primary.dark',
                }
              }}
            >
              Login
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                handleMobileMenuClose();
                navigate('/signup');
              }}
              sx={{
                background: 'linear-gradient(45deg, #553d8e 10%, #9575cd 90%)',
                color: 'white',
                fontWeight: 600,
                py: 1.2,
                borderRadius: 2,
                boxShadow: '0 2px 10px rgba(149, 117, 205, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 15px rgba(149, 117, 205, 0.4)'
                }
              }}
            >
              Sign Up
            </Button>
          </>
        )}
      </Box>
    </Menu>
  );

  // Desktop Profile Menu.
  const renderProfileMenu = (
    <Menu
      anchorEl={profileMenuAnchor}
      open={Boolean(profileMenuAnchor)}
      onClose={handleProfileMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: 1.5,
          minWidth: 180,
          borderRadius: 2,
          overflow: 'visible',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.95))',
          backdropFilter: 'blur(10px)',
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 20,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem
        onClick={() => {
          navigate('/profile');
          handleProfileMenuClose();
        }}
        sx={{ py: 1.2 }}
      >
        My Profile
      </MenuItem>
      <MenuItem
        onClick={() => {
          navigate('/settings');
          handleProfileMenuClose();
        }}
        sx={{ py: 1.2 }}
      >
        Account Settings
      </MenuItem>
      <Divider sx={{ my: 1 }} />
      <MenuItem
        onClick={handleLogout}
        sx={{
          py: 1.2,
          color: 'error.main',
          '&:hover': {
            backgroundColor: alpha('#f44336', 0.04),
          },
        }}
      >
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <HideOnScroll>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ py: { xs: 1.2, md: 1 } }}>
            {/* Logo */}
            <Box component={Link} to="/" sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none'
            }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.5rem', md: '1.8rem' },
                    background: 'linear-gradient(45deg, #553d8e 20%, #b69ac1 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    '&::before': {
                      content: '""',
                      display: 'inline-block',
                      width: { xs: 16, md: 20 },
                      height: { xs: 16, md: 20 },
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #553d8e 20%, #b69ac1 90%)',
                      marginRight: 1.5,
                      boxShadow: '0 2px 10px rgba(182, 154, 193, 0.4)'
                    }
                  }}
                >
                  QuirkHire
                </Typography>
              </motion.div>
            </Box>

            {/* Desktop Navigation Links */}
            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 3,
              alignItems: 'center',
              ml: 6
            }}>
              {allLinks.map((link) => (
                <motion.div
                  key={link.path}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 500, damping: 17 }}
                >
                  <Button
                    component={Link}
                    to={link.path}
                    sx={{
                      color: location.pathname === link.path ? 'primary.dark' : 'text.secondary',
                      fontWeight: location.pathname === link.path ? 600 : 500,
                      textTransform: 'none',
                      fontSize: '1rem',
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'primary.main',
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -2,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: location.pathname === link.path ? '70%' : '0',
                        height: '3px',
                        borderRadius: '10px',
                        background: 'linear-gradient(45deg, #553d8e 20%, #b69ac1 90%)',
                        transition: 'width 0.3s ease'
                      },
                      '&:hover::after': {
                        width: '70%'
                      }
                    }}
                  >
                    {link.label}
                  </Button>
                </motion.div>
              ))}
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Auth Section */}
            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 2,
              alignItems: 'center'
            }}>
              {user ? (
                <>
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{
                      ml: 2,
                      p: 0.5,
                      borderRadius: '50%',
                      background: alpha('#f5f5f5', 0.7),
                      border: '2px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: alpha('#f0f0f0', 1),
                        borderColor: alpha('#553d8e', 0.3),
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <Avatar
                      alt={user.email}
                      src="/avatar-placeholder.jpg"
                      sx={{
                        width: 38,
                        height: 38,
                        border: '2px solid white',
                        background: 'linear-gradient(45deg, #553d8e 20%, #b69ac1 90%)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {user.email?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      color="primary"
                      variant="outlined"
                      onClick={() => navigate('/login')}
                      sx={{
                        ...buttonStyle,
                        borderWidth: 2,
                        borderColor: alpha('#553d8e', 0.6),
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: alpha('#553d8e', 0.04),
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Login
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      color="primary"
                      variant="contained"
                      onClick={() => navigate('/signup')}
                      sx={{
                        ...buttonStyle,
                        background: 'linear-gradient(45deg, #553d8e 20%, #b69ac1 90%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(149, 117, 205, 0.3)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(149, 117, 205, 0.5)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Sign Up
                    </Button>
                  </motion.div>
                </>
              )}
            </Box>

            {/* Mobile Menu Toggle */}
            <IconButton
              size="large"
              edge="end"
              onClick={handleMobileMenuOpen}
              sx={{
                display: { md: 'none' },
                ml: 1,
                color: 'primary.main',
                background: alpha('#f5f5f5', 0.6),
                borderRadius: '12px',
                padding: '8px',
                '&:hover': {
                  background: alpha('#f0f0f0', 0.9),
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>

        {/* Render Mobile and Profile Menus */}
        {renderMobileMenu}
        {renderProfileMenu}
      </AppBar>
    </HideOnScroll>
  );
};

export default Navbar;
