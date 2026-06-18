import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AUTH_UNAUTHORIZED_EVENT } from '../api/axiosConfig';
import {
  clearStoredSession,
  getStoredSession,
  login as loginRequest,
  registerAgent as registerRequest,
} from '../services/authService';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredSession());

  useEffect(() => {

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const value = useMemo(() => {
    const isAuthenticated = Boolean(user?.token);

    const login = async (credentials) => {
      const result = await loginRequest(credentials);

      if (result?.kind === 'authenticated' && result.session) {
        setUser(result.session);
      }

      return result;
    };

    const register = async (payload) => registerRequest(payload);

    const logout = () => {
      clearStoredSession();
      setUser(null);
    };

    // Dans ton AuthContext.jsx
    const updateUser = (newUserData) => {
      setUser((prevUser) => {
        const updatedUser = {
          ...prevUser,
          ...newUserData,
        };

        localStorage.setItem(
          'e-presence.user',
          JSON.stringify(updatedUser)
        );

        return updatedUser;
      });
    };

    return {
      user,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser,
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
export default AuthContext;
