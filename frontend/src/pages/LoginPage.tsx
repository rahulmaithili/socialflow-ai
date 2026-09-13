import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-sidebar text-sidebar-foreground flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-sidebar-background z-0" />
        
        <div className="relative z-10 space-y-12 max-w-lg">
          <div className="flex items-center gap-3">
            <img src="/logo-header.png" alt="Rahul Scripts" className="h-12 object-contain" />
          </div>

          <div className="space-y-6 text-lg text-sidebar-foreground/80">
            <h2 className="text-4xl font-bold text-white mb-8 leading-tight">
              Universal AI Content Studio & Publisher
            </h2>
            
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-6 h-6 text-brand-400" />
              <span>Analyze media & generate viral-ready hooks</span>
            </div>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-6 h-6 text-brand-400" />
              <span>Auto-generate optimized captions & hashtags</span>
            </div>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-6 h-6 text-brand-400" />
              <span>Schedule and publish directly to Meta APIs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <img src="/logo-icon.png" alt="Rahul Scripts" className="w-12 h-12 rounded-xl mb-4 mx-auto lg:mx-0 shadow-xs" />
            <h1 className="text-3xl font-bold tracking-tight">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSignUp 
                ? 'Enter your details to get started with Rahul Scripts SocialFlow' 
                : 'Enter your credentials to access your account'}
            </p>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-brand-600 hover:underline">
                    Forgot password?
                  </a>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-card hover:bg-accent border rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-brand-600 hover:underline font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
