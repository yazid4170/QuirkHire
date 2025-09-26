import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ResumeRecommender from './pages/ResumeRecommender';
import Footer from './components/Footer';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RoleSelection from './pages/RoleSelection';
import CandidateSignup from './pages/CandidateSignup';
import RecruiterSignup from './pages/RecruiterSignup';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import CompleteProfilePage from './pages/CompleteProfilePage';
import CreateResumePage from './pages/CreateResumePage';
import EditProfilePage from './pages/EditProfilePage';
import RecruiterEditProfilePage from './pages/RecruiterEditProfilePage';
import RecruiterProfilePage from './pages/RecruiterProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import InterviewTrainer from './pages/InterviewTrainer';
import { supabase } from './supabaseClient';
import { AuthProvider } from './contexts/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import LogoPreviewPage from './pages/LogoPreviewPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import SettingsPage from './pages/SettingsPage';
import AdminResumeDashboard from './pages/AdminResumeDashboard';
import ReviewsPage from './pages/ReviewsPage';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && location.hash.includes('type=signup')) {
        navigate('/complete-profile');
      }
    };
    handleAuthRedirect();
  }, [location, navigate]);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/logo-preview" element={<LogoPreviewPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/*" element={<ResetPassword />} />
          
          {/* The /recommend route is available for recruiters and admin */}
          <Route 
  path="/recommend" 
  element={
    <ProtectedRoute requiredRole="recruiter">
      <ResumeRecommender />
    </ProtectedRoute>
  }
/>

          
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/signup" element={<RoleSelection />} />
          <Route path="/signup/candidate" element={<CandidateSignup />} />
          <Route path="/signup/recruiter" element={<RecruiterSignup />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/edit" 
            element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/recruiter" 
            element={
              <ProtectedRoute>
                <RecruiterProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/recruiter/edit" 
            element={
              <ProtectedRoute>
                <RecruiterEditProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/complete-profile" 
            element={
              <ProtectedRoute>
                <CompleteProfilePage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/resume/create" 
            element={
              <ProtectedRoute>
                <CreateResumePage />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route 
            path="/interview-trainer" 
            element={
              <ProtectedRoute requiredRole="candidate">
                <InterviewTrainer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
          path="/admin-resume"
          element={
            <ProtectedRoute>
              <AdminResumeDashboard />
            </ProtectedRoute>
          }
        />
          <Route
            path="/settings"
            element={
              <SettingsPage />
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute requiredRole="admin">
                <ReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
