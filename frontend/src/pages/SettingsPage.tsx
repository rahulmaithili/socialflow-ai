import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUIStore } from '../stores/uiStore';
import { Save, Key, Sparkles, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, RefreshCw, Download, Copy, Check, Laptop, Shield, Zap } from 'lucide-react';
import { 
  getGeminiApiKey, 
  saveGeminiApiKey, 
  getGeminiModel, 
  saveGeminiModel, 
  AVAILABLE_GEMINI_MODELS, 
  generateContentWithGemini 
} from '../lib/geminiService';
import { 
  getMachineHWID, 
  verifyLicenseKey, 
  getActiveLicense, 
  generateNewLicense, 
  type LicenseData 
} from '../lib/licenseService';

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useUIStore();
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'integrations' | 'updates' | 'license'>('ai');

  // Auto-updater state
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatusText, setUpdateStatusText] = useState<string | null>(null);
  const [updateInfo, setUpdateInfo] = useState<any | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  // Gemini API Key & Model state
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [testingAi, setTestingAi] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // Licensing & HWID state
  const [hwid, setHwid] = useState('Detecting...');
  const [activeLicense, setActiveLicense] = useState<LicenseData | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [licenseFeedback, setLicenseFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedHwid, setCopiedHwid] = useState(false);

  // Admin Key Generator
  const [clientName, setClientName] = useState('');
  const [licensePlan, setLicensePlan] = useState<'monthly' | 'yearly' | 'lifetime'>('lifetime');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedGeneratedKey, setCopiedGeneratedKey] = useState(false);

  useEffect(() => {
    setGeminiKey(getGeminiApiKey());
    setGeminiModel(getGeminiModel());
    getMachineHWID().then(id => setHwid(id));
    setActiveLicense(getActiveLicense());
  }, []);

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then(v => setAppVersion(v));
    }

    const unsubAvail = window.electronAPI?.onUpdateAvailable?.((info) => {
      setCheckingUpdate(false);
      setUpdateInfo(info);
      setUpdateStatusText(`⚡ New Version v${info.version} available!`);
    });

    const unsubNotAvail = window.electronAPI?.onUpdateNotAvailable?.(() => {
      setCheckingUpdate(false);
      setUpdateStatusText('✅ You are on the latest version!');
    });

    const unsubProg = window.electronAPI?.onUpdateProgress?.((prog) => {
      setDownloading(true);
      setDownloadProgress(Math.round(prog.percent));
    });

    const unsubDown = window.electronAPI?.onUpdateDownloaded?.(() => {
      setDownloading(false);
      setDownloadProgress(100);
      setUpdateDownloaded(true);
      setUpdateStatusText('🎉 Update downloaded! Ready to install.');
    });

    const unsubErr = window.electronAPI?.onUpdateError?.((err) => {
      setCheckingUpdate(false);
      setDownloading(false);
      setUpdateStatusText(`⚠️ Update Notice: ${err}`);
    });

    return () => {
      unsubAvail?.();
      unsubNotAvail?.();
      unsubProg?.();
      unsubDown?.();
      unsubErr?.();
    };
  }, []);

  const handleManualCheckUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateStatusText('Checking GitHub releases for new updates...');
    setUpdateInfo(null);

    if (window.electronAPI?.checkForUpdates) {
      try {
        const res = await window.electronAPI.checkForUpdates();
        if (res.status === 'dev_mode') {
          setTimeout(() => {
            setCheckingUpdate(false);
            setUpdateStatusText('ℹ️ Running in Local Dev Mode. In packaged .exe, this connects live to GitHub Releases (rahulmaithili/socialflow-ai).');
          }, 1000);
        }
      } catch (err: any) {
        setCheckingUpdate(false);
        setUpdateStatusText('Error checking updates: ' + (err.message || err));
      }
    } else {
      setTimeout(() => {
        setCheckingUpdate(false);
        setUpdateStatusText('🌐 You are running in Web Browser Mode. Automatic binary updates apply to the Windows Desktop .EXE.');
      }, 1000);
    }
  };

  const handleDownloadUpdate = async () => {
    if (window.electronAPI?.startDownloadUpdate) {
      setDownloading(true);
      await window.electronAPI.startDownloadUpdate();
    }
  };

  const handleApplyUpdate = () => {
    if (window.electronAPI?.installUpdateNow) {
      window.electronAPI.installUpdateNow();
    }
  };

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

  const handleVerifyLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    setVerifyingKey(true);
    setLicenseFeedback(null);
    try {
      const res = await verifyLicenseKey(inputKey, hwid);
      if (res.success && res.license) {
        setActiveLicense(res.license);
        setLicenseFeedback({ type: 'success', text: `🎉 ${res.message}` });
        setInputKey('');
      } else {
        setLicenseFeedback({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setLicenseFeedback({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setVerifyingKey(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setGeneratingKey(true);
    try {
      const generated = await generateNewLicense(clientName.trim(), licensePlan);
      setNewlyCreatedKey(generated.key);
      setClientName('');
    } catch (err: any) {
      alert('Error generating key: ' + err.message);
    } finally {
      setGeneratingKey(false);
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
            <button 
              onClick={() => setActiveTab('updates')}
              className={`w-full text-left px-3 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'updates' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <RefreshCw className="w-4 h-4" /> Software Updates
            </button>
            <button 
              onClick={() => setActiveTab('license')}
              className={`w-full text-left px-3 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'license' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" /> SaaS License & HWID
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
              <div className="space-y-5 text-xs">
                <div className="border-b pb-3">
                  <h3 className="text-base font-semibold text-foreground">Meta / Facebook Graph API & Multi-Account</h3>
                  <p className="text-muted-foreground mt-0.5">Manage credentials, multiple accounts, and auto-publishing permissions</p>
                </div>

                <div className="p-4 border rounded-xl bg-card space-y-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center font-bold shadow-xs">
                        f
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Facebook Multi-Account Studio</h4>
                        <p className="text-muted-foreground text-xs">Manage multiple Facebook accounts & pages from one place</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full font-semibold">
                      Active
                    </span>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">
                      Required Permissions: <code>pages_show_list</code>, <code>pages_manage_posts</code>, <code>pages_read_engagement</code>
                    </span>
                    <button
                      onClick={() => navigate('/pages')}
                      className="px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium text-xs transition-colors flex items-center gap-1 shadow-xs"
                    >
                      Open Multi-Account Hub <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-4 border rounded-xl bg-muted/20 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-brand-600" /> Meta Developer Setup Guide
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To connect your real Facebook pages with Graph API:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1 leading-relaxed">
                    <li>Create an app on <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-brand-600 underline">developers.facebook.com</a> with <strong>Business</strong> type.</li>
                    <li>Generate a User Token in <strong>Graph API Explorer</strong> with <code>pages_show_list</code> & <code>pages_manage_posts</code>.</li>
                    <li>Paste the token into the <strong>Facebook Multi-Account Studio</strong> to auto-import all your pages!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* SOFTWARE UPDATES TAB */}
            {activeTab === 'updates' && (
              <div className="space-y-6 text-xs">
                <div className="border-b pb-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-brand-600" /> Automatic Updates & Releases
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Stay up to date with the latest features, security patches, and platform optimizations.
                  </p>
                </div>

                {/* Current Version Card */}
                <div className="p-5 border rounded-2xl bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg border border-brand-100">
                      ⚡
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">SocialFlow AI Studio</h4>
                        <span className="px-2 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded font-mono text-[11px] font-semibold">
                          v{appVersion}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Release Channel: <strong>GitHub Releases (Stable)</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleManualCheckUpdates}
                    disabled={checkingUpdate || downloading}
                    className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                    {checkingUpdate ? 'Checking GitHub...' : '⚡ Check for Updates'}
                  </button>
                </div>

                {/* Status Notice */}
                {updateStatusText && (
                  <div className="p-3.5 rounded-xl border bg-muted/30 text-foreground flex items-center justify-between gap-2">
                    <span className="font-medium text-xs">{updateStatusText}</span>
                    {downloading && (
                      <span className="text-xs font-mono font-bold text-brand-600">
                        {downloadProgress || 0}%
                      </span>
                    )}
                  </div>
                )}

                {/* Downloading Progress Bar */}
                {downloading && (
                  <div className="space-y-1.5 p-4 border rounded-xl bg-card shadow-xs">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Downloading release package...</span>
                      <span className="font-mono font-bold text-foreground">{downloadProgress || 0}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-brand-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${downloadProgress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action when Update is Available or Downloaded */}
                {updateInfo && !updateDownloaded && !downloading && (
                  <div className="p-4 border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950 dark:text-blue-200">
                        New Version: v{updateInfo.version}
                      </span>
                      <button
                        onClick={handleDownloadUpdate}
                        className="px-3.5 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-semibold text-xs shadow-xs flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Now
                      </button>
                    </div>
                    {updateInfo.releaseNotes && (
                      <div className="text-[11px] text-blue-900 dark:text-blue-300 bg-white/70 dark:bg-black/20 p-2.5 rounded-lg">
                        <strong>Release Notes:</strong>
                        <div className="mt-1 whitespace-pre-line font-mono text-[10px]">
                          {typeof updateInfo.releaseNotes === 'string' 
                            ? updateInfo.releaseNotes 
                            : JSON.stringify(updateInfo.releaseNotes)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {updateDownloaded && (
                  <div className="p-4 border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-emerald-900 dark:text-emerald-200">🎉 Update Ready to Install!</h5>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                        The update has been downloaded. Restart the application now to apply the new update.
                      </p>
                    </div>
                    <button
                      onClick={handleApplyUpdate}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Restart & Install Now
                    </button>
                  </div>
                )}

                {/* GitHub Releases Integration Info */}
                <div className="p-4 border rounded-xl bg-muted/20 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-brand-600" /> How Developers Release New Updates
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Whenever you add new functions or fix code on your PC:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1 leading-relaxed">
                    <li>Bump <code>version</code> in <code>package.json</code> (e.g. from <code>1.0.0</code> to <code>1.0.1</code>).</li>
                    <li>Build with <code>npm run dist:win</code> (or <code>npm run dist:publish</code>) and attach the installer + <code>latest.yml</code> to your GitHub Release.</li>
                    <li>Every user running SocialFlow AI Studio will automatically see the update prompt and can update with 1 click!</li>
                  </ol>
                  <div className="pt-1">
                    <a
                      href="https://github.com/rahulmaithili/socialflow-ai/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      View GitHub Releases Page <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* SAAS LICENSE & HWID MACHINE LOCK TAB */}
            {activeTab === 'license' && (
              <div className="space-y-6 text-xs">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    HWID Machine Lock & Commercial Licensing
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Hardware-bound licensing system for SocialFlow AI Content Studio. Prevents unauthorized software sharing and manages commercial access.
                  </p>
                </div>

                {/* Machine HWID Card */}
                <div className="p-4 bg-muted/30 border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Laptop className="w-4 h-4 text-brand-600" />
                      <span>This Machine's Unique Hardware ID (HWID):</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                      Hardware Bound
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={hwid}
                      className="flex-1 px-3 py-2 bg-background border rounded-lg font-mono text-xs font-bold text-brand-600 outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(hwid);
                        setCopiedHwid(true);
                        setTimeout(() => setCopiedHwid(false), 2000);
                      }}
                      className="px-3.5 py-2 border bg-card hover:bg-accent rounded-lg font-semibold flex items-center gap-1.5 transition text-foreground"
                    >
                      {copiedHwid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHwid ? 'Copied!' : 'Copy HWID'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Share this HWID when requesting or assigning a dedicated license key.
                  </p>
                </div>

                {/* Active License Status Banner */}
                <div className={`p-4 border rounded-xl space-y-2 ${
                  activeLicense?.status === 'active'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span className="font-bold text-sm">
                        Current Status: {activeLicense?.status === 'active' ? 'Licensed & Active 🟢' : 'Unactivated / Free Trial ⚠️'}
                      </span>
                    </div>
                    {activeLicense && (
                      <span className="px-2.5 py-0.5 rounded-full bg-background border font-mono font-bold uppercase text-[10px]">
                        {activeLicense.plan} Plan
                      </span>
                    )}
                  </div>

                  {activeLicense ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block">Licensed To:</span>
                        <strong className="text-foreground">{activeLicense.clientName}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Key Format:</span>
                        <strong className="font-mono text-foreground">{activeLicense.key}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Max Devices:</span>
                        <strong className="text-foreground">{activeLicense.maxDevices} PC(s)</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] leading-relaxed">
                      Enter a commercial license key below to unlock lifetime access, bulk Spintax engine, multi-account warm-up chamber, and automated DM bots.
                    </p>
                  )}
                </div>

                {/* Enter License Key Form */}
                <div className="bg-card border rounded-xl p-5 space-y-4 shadow-xs">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Activate Commercial License Key
                  </h4>

                  <form onSubmit={handleVerifyLicense} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">License Key</label>
                      <input
                        type="text"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="e.g. SF-XXXX-XXXX-XXXX or SF-ADMIN-LIFETIME-PRO"
                        className="w-full px-3 py-2.5 bg-background border rounded-lg font-mono text-xs outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                        required
                      />
                    </div>

                    {licenseFeedback && (
                      <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                        licenseFeedback.type === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600'
                          : 'bg-red-500/10 border border-red-500/30 text-red-600'
                      }`}>
                        {licenseFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{licenseFeedback.text}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">
                        Admin Master Key: <code className="text-amber-500 font-bold">SF-ADMIN-LIFETIME-PRO</code>
                      </span>
                      <button
                        type="submit"
                        disabled={verifyingKey}
                        className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        {verifyingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        <span>Verify & Bind Key</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Developer / Admin Key Generator Tool */}
                <div className="bg-card border-2 border-dashed border-amber-500/40 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                        Admin License Generator (Commercial SaaS Monetization)
                      </h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                      Admin Portal
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Generate authentic license keys to sell SocialFlow AI Content Studio to your clients. Generated keys are securely saved into your Cloud Firestore database.
                  </p>

                  <form onSubmit={handleGenerateKey} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Client / Buyer Name</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. John Doe / Digital Agency"
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Plan Duration</label>
                      <select
                        value={licensePlan}
                        onChange={(e) => setLicensePlan(e.target.value as any)}
                        className="w-full px-3 py-2 bg-background border rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="monthly">Monthly Access (30 Days)</option>
                        <option value="yearly">Annual Access (365 Days)</option>
                        <option value="lifetime">Lifetime Unlimited Access</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={generatingKey}
                      className="w-full py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      {generatingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                      <span>Generate Key</span>
                    </button>
                  </form>

                  {newlyCreatedKey && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                        🎉 New License Key Generated & Saved to Firestore:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={newlyCreatedKey}
                          className="flex-1 px-3 py-1.5 bg-background border rounded font-mono text-xs font-bold text-emerald-600 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(newlyCreatedKey);
                            setCopiedGeneratedKey(true);
                            setTimeout(() => setCopiedGeneratedKey(false), 2000);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold flex items-center gap-1"
                        >
                          {copiedGeneratedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedGeneratedKey ? 'Copied' : 'Copy Key'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
