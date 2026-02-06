import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmail, signUpWithEmail, signOutUser, registerUsername } from './supabaseUtils';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged((user) => {
      setCurrentUser(user ? user.id : null);
    });
    return () => unsub && unsub();
  }, []);

  const login = async (email: string, pass: string) => {
    setAuthLoading(true);
    setLoginError("");
    try {
      await signInWithEmail(email, pass);
      return true;
    } catch (err: any) {
      console.error("❌ Login Error Full:", err);
      setLoginError(err.message || "Error al entrar");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email: string, pass: string) => {
    setAuthLoading(true);
    setLoginError("");
    try {
      await signUpWithEmail(email, pass);
      return true;
    } catch (err: any) {
      console.error("❌ Signup Error Full:", err);
      setLoginError(err.message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  return { currentUser, authLoading, loginError, login, signup, logout, setLoginError };
}