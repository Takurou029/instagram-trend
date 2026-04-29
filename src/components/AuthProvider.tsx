'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const authStatus = localStorage.getItem('insta_trend_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (inputPassword: string) => {
    if (inputPassword === 'tcb0000') {
      setIsAuthenticated(true);
      localStorage.setItem('insta_trend_auth', 'true');
      return true;
    } else {
      setLoginError('パスワードが違います');
      return false;
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(password);
  };

  if (isLoading) {
    return null; // またはローディングスピナー
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F7FAFC', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', border: '1px solid #F1F5F9' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#0F172A', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <Lock size={32} color="white" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', textAlign: 'center', color: '#0F172A', marginBottom: '8px' }}>InstaTrend 限定アクセス</h2>
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: '14px', marginBottom: '32px' }}>管理者パスワードを入力してください</p>
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <input 
              type="password" 
              placeholder="パスワード" 
              style={{ width: '100%', padding: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', outline: 'none', fontSize: '16px' }} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            {loginError && <p style={{ color: '#EF4444', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>{loginError}</p>}
            <button type="submit" style={{ width: '100%', background: 'linear-gradient(to right, #EC4899, #8B5CF6)', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              認証してログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
