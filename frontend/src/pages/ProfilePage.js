import React from 'react';
import { useParams } from 'react-router-dom';
import CandidateProfilePage from './CandidateProfilePage';
import RecruiterProfilePage from './RecruiterProfilePage';
import PublicProfilePage from './PublicProfilePage';
import { useAuth } from '../contexts/AuthContext';

// Simple loading component to avoid re-renders
const LoadingComponent = () => <div className="loading-container">Loading profile...</div>;
const LoginMessage = () => <div className="login-message">Please log in to view profiles</div>;

function ProfilePage() {
  // Get params and auth state
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  
  // Handle loading state
  if (authLoading) return <LoadingComponent />;
  
  // Handle unauthenticated state
  if (!user || !user.id) return <LoginMessage />;
  
  // Determine which profile to show
  if (!id || user.id === id) {
    // Viewing own profile - show based on role
    const role = user.user_metadata?.role || 'candidate';
    
    if (role === 'recruiter') {
      return <RecruiterProfilePage />;
    } else {
      return <CandidateProfilePage />;
    }
  } else {
    // Viewing someone else's profile
    return <PublicProfilePage user_id={id} />;
  }
}

export default ProfilePage;