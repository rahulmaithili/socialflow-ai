import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUIStore } from '../stores/uiStore';
import { Save, Key, Sparkles, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { 
  getGeminiApiKey, 
  saveGeminiApiKey, 
  getGeminiModel, 
  saveGeminiModel, 
  AVAILABLE_GEMINI_MODELS, 
  generateContentWithGemini 
} from '../lib/geminiService';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useUIStore();
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'integrations'>('ai');

  // Gemini API Key & Model state
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [testingAi, setTestingAi] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setGeminiKey(getGeminiApiKey());
    setGeminiModel(getGeminiModel());
  }, []);

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeminiApiKey(geminiKey);
    saveGeminiModel(geminiModel);
    setSavedNotice(true);
    setTestSuccess(null);
    setTestError(null);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleTestGemini = async () => {
    if (!geminiKey.trim()) {
      setTestError('Please enter an API Key first.');
      return;
    }
    setTestingAi(true);
    setTestSuccess(null);
    setTestError(null);

    // Temporarily save to test
    saveGeminiApiKey(geminiKey);

    try {
      const res = await generateContentWithGemini('Social Media Growth', 'Viral', 'English', 'facebook');
      if (res && res.hooks.length > 0) {
        setTestSuccess(`Connection Successful! Real AI research returned ${res.hooks.length} hooks and ${res.captions.length} captions.`);
      } else {
        setTestSuccess('Connected successfully to Google Gemini API!');
      }
    } catch (err: any) {
      setTestError(err.message || 'Connection failed');
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Integrations</h1>
        <p className="text-muted-foreground text-sm">Configure your Google Gemini AI engine and account preferences</p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row">
          {/* Settings Nav */}
          <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r bg-muted/20 p-3 space-y-1 text-xs">
            <button 
              onClick={() => setActiveTab('ai')}
              className={`w-full text-left px-3 py-2 font-semibold rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'ai' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Sparkles className="w-4 h-4" /> AI Engine (Gemini)
            </button>
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-3 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'general' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              General & Profile
            </button>
            <button 
              onClick={() => setActiveTab('integrations')}
              className={`w-full text-left px-3 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'integrations' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              Meta / Facebook API
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6 space-y-6">
            
            {/* AI CONFIGURATION TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-5">
                <div className="border-b pb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Sparkles className="w-5 h-5 text-brand-600" /> Google Gemini AI Integration
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connect Google Gemini to generate real viral hooks, smart researched captions, and niche hashtags.
                  </p>
                </div>

                <div className="bg-brand-50/70 border border-brand-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-brand-900 font-semibold">
                    <Key className="w-4 h-4 text-brand-600" /> Free Gemini API Key
                  </div>
                  <p className="text-brand-800 leading-relaxed">
                    Google Gemini API is <strong>100% free</strong> for personal & commercial development. You can generate a free key in 30 seconds from Google AI Studio.
                  </p>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800 underline"
                  >
                    Get Free Gemini API Key from Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <form onSubmit={handleSaveGeminiKey} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Gemini API Key</label>
                    <input 
                      type="password" 
                      placeholder="AIzaSy..." 
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Your key is stored securely in your browser's private storage.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Gemini Model Version</label>
                    <select
                      value={geminiModel}
                      onChange={(e) => setGeminiModel(e.target.value)}
                      className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-xs font-medium"
                    >
                      {AVAILABLE_GEMINI_MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Choose between Gemini 3 / 2.5 series or 1.5 Pro. Auto-fallback kicks in automatically if any model is rate-limited.
                    </p>
                  </div>

                  {savedNotice && (
                    <div className="p-2.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> API Key saved successfully!
                    </div>
                  )}

                  {testSuccess && (
                    <div className="p-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-lg text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{testSuccess}</span>
                    </div>
                  )}

                  {testError && (
                    <div className="p-3 bg-red-500/10 text-red-700 border border-red-500/20 rounded-lg text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{testError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" /> Save API Key
                    </button>
                    <button 
                      type="button"
                      onClick={handleTestGemini}
                      disabled={testingAi}
                      className="px-4 py-2 bg-background border hover:bg-accent rounded-lg font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {testingAi ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          Testing with Gemini...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Test AI Connection
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6 text-xs">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold border-b pb-2 text-foreground">User Profile</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-medium text-foreground">Display Name</label>
                      <input 
                        type="text" 
                        defaultValue={user?.displayName || 'Rahul Scripts Admin'} 
                        className="w-full p-2 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-foreground">Email Address</label>
                      <input 
                        type="email" 
                        defaultValue={user?.email || 'life.rahulg@gmail.com'} 
                        disabled 
                        className="w-full p-2 bg-muted/50 border rounded-lg cursor-not-allowed opacity-70 text-sm" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold border-b pb-2 text-foreground">Preferences</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-medium text-foreground">Theme</label>
                      <select 
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as any)}
                        className="w-full p-2 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-foreground">Timezone</label>
                      <select className="w-full p-2 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
                        <option>Asia/Kolkata (IST)</option>
                        <option>America/New_York (EST)</option>
                        <option>Europe/London (GMT)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INTEGRATIONS TAB */}
            {activeTab === 'integrations' && (
              <div className="space-y-4 text-xs">
                <div className="border-b pb-3">
                  <h3 className="text-base font-semibold text-foreground">Meta / Facebook Graph API</h3>
                  <p className="text-muted-foreground mt-0.5">Manage credentials for posting to Facebook Pages and Groups</p>
                </div>

                <div className="p-4 border rounded-xl bg-card space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        f
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Facebook App Integration</h4>
                        <p className="text-muted-foreground">Permissions: pages_manage_posts, pages_read_engagement</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full font-semibold">
                      Connected
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
