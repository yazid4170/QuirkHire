import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

// Define public routes outside component to prevent recreating on each render
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/signup/candidate',
  '/signup/recruiter',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/',
  '/logo-preview',
];

const isPublicRoute = (pathname) =>
  PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // Memoize visibility change handler to prevent recreating it on each render
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && user) {
      // Let Supabase handle normal token refresh - no state changes needed
    }
  }, [user]); // Only depends on user existence

  // Reset loading state on location changes to prevent stuck loading state
  useEffect(() => {
    const hasUser = !!user;
    if (hasUser && loading) {
      setLoading(false);
    }
  }, [user, loading, setLoading]); // Added user and setLoading to dependencies

  // Auth state initialization and subscription
  useEffect(() => {
    let authSubscription = null;
    let isMounted = true;
    
    // Get the initial session
    const getInitialSession = async () => {
      // Skip fetching session if we already have user data
      if (user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setUser(session?.user || null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    getInitialSession();
    
    // Subscribe to auth changes - keep reference to unsubscribe
    const setupAuthSubscription = async () => {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;

        // Set the user when auth state changes
        setUser(session?.user || null);
        
        // Handle sign out event
        if (event === 'SIGNED_OUT' && !isPublicRoute(window.location.pathname)) {
          setSessionExpired(true);
          navigate('/login', { replace: true, state: { sessionExpired: true } });
        }
      });
      
      authSubscription = data.subscription;
    };
    
    setupAuthSubscription();
    
    // Clean up subscription and listeners
    return () => {
      isMounted = false;
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, [navigate, user]); // Only depends on navigate

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange, user]); // Added user dependency

  const handleAuth = useCallback(async (authFunction) => {
    try {
      setLoading(true);
      setAuthError(null);
      await authFunction();
    } catch (error) {
      setAuthError(error.message);
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (credentials) => {
    return handleAuth(async () => {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      setUser(data.user);
    });
  }, [handleAuth, setUser]);

  const signOut = useCallback(async () => {
    return handleAuth(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    });
  }, [handleAuth, setUser]);

  // Memoize context value to prevent unnecessary renders of consuming components
  const contextValue = useMemo(() => ({
    user,
    loading,
    sessionExpired,
    authError,
    setAuthError,
    signIn,
    signOut
  }), [user, loading, sessionExpired, authError, signIn, signOut]); // Added signIn/signOut

  // Only render children when not in loading state
  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}