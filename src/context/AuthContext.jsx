import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Supabase session error:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for deep link redirects from OAuth (Native only)
    if (Capacitor.isNativePlatform()) {
      const handleAppUrlOpen = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        console.log('Deep link received:', url);
        // Check if URL contains auth tokens
        if (url.includes('access_token') || url.includes('refresh_token') || url.includes('code=')) {
          // Extract hash or query parameters
          const hashParams = new URLSearchParams(url.split('#')[1] || '');
          
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set session from tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error('Error setting session from deep link:', error);
            }
          }
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      if (Capacitor.isNativePlatform()) {
        CapacitorApp.removeAllListeners();
      }
    };
  }, []);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signInWithOtp: (data) => supabase.auth.signInWithOtp(data),
    signInWithOAuth: (provider) => {
        const redirectTo = Capacitor.isNativePlatform() 
            ? 'com.dailydriver.app://login' 
            : window.location.origin;
            
        return supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo,
            },
        });
    },
    signOut: () => supabase.auth.signOut(),
    user,
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1625',
        color: '#a855f7',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }}></div>
          <p>Initializing Daily Driver...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
