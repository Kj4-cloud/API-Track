import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiRequest, getAuthToken, setAuthToken } from '../services/api-client';
import type { Profile } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthSession {
  access_token: string;
  user?: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest<{ user: AuthUser; profile: Profile }>('/auth/me');
        setUser(data.user);
        setProfile(data.profile);
        setSession({ access_token: token, user: data.user });
      } catch {
        // Token is invalid or expired
        setAuthToken(null);
        setUser(null);
        setProfile(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiRequest<{ token: string; user: AuthUser; profile: Profile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuthToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setSession({ access_token: data.token, user: data.user });
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to sign in') };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const data = await apiRequest<{ token: string; user: AuthUser; profile: Profile }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      setAuthToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setSession({ access_token: data.token, user: data.user });
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to register account') };
    }
  };

  const signOut = async () => {
    setAuthToken(null);
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    try {
      const updated = await apiRequest<Profile>('/auth/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setProfile(updated);
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
