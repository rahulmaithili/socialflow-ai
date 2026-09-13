import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Facebook, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Key, 
  Layers, 
  Send, 
  Building2, 
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeDestinations, 
  addDestination, 
  deleteDestination, 
  toggleDestinationStatus, 
  type DestinationData 
} from '../lib/firestoreService';
import {
  subscribeFacebookAccounts,
  deleteFacebookAccount,
  connectAccountWithToken,
  connectPresetAccount,
  MULTI_ACCOUNT_PRESETS,
  type FacebookAccount
} from '../lib/facebookService';

export default function PagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [pages, setPages] = useState<DestinationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'token' | 'presets' | 'manual'>('token');
  const [connecting, setConnecting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [tokenInput, setTokenInput] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageId, setPageId] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [accessToken, setAccessToken] = useState('');

  // Subscriptions
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubAccounts = subscribeFacebookAccounts(user.uid, (accs) => {
      setAccounts(accs);
    });

    const unsubPages = subscribeDestinations(user.uid, 'facebook_page', (list) => {
      setPages(list);
      setLoading(false);
    });

    return () => {
      unsubAccounts();
      unsubPages();
    };
  }, [user]);

  // Connect via Meta User Token
  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tokenInput.trim()) return;
    setConnecting(true);
    setFeedback(null);
    try {
      const res = await connectAccountWithToken(user.uid, tokenInput.trim());
      setFeedback({
        type: 'success',
        text: `Connected "${res.account.name}" and imported ${res.pagesAdded} Facebook Pages successfully!`
      });
      setTokenInput('');
      setTimeout(() => {
        setShowModal(false);
        setFeedback(null);
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to connect Meta account. Please verify your Access Token.'
      });
    } finally {
      setConnecting(false);
    }
  };

  // Connect via Preset Multi-Account
  const handleConnectPreset = async (presetKey: 'personal' | 'business' | 'creator') => {
    if (!user) return;
    setConnecting(true);
    setFeedback(null);
    try {
      await connectPresetAccount(user.uid, presetKey);
      setFeedback({
        type: 'success',
        text: `Account "${MULTI_ACCOUNT_PRESETS[presetKey].name}" & pages connected successfully!`
      });
      setTimeout(() => {
        setShowModal(false);
        setFeedback(null);
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error connecting preset' });
    } finally {
      setConnecting(false);
    }
  };

  // Manual Page Add
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pageName.trim()) return;
    setConnecting(true);
    try {
      await addDestination({
        userId: user.uid,
        name: pageName.trim(),
        pageId: pageId.trim() || `fb_${Date.now()}`,
        type: 'facebook_page',
        category,
        accessToken: accessToken.trim() || undefined,
        status: 'active',
        followersCount: Math.floor(Math.random() * 5000) + 1200
      });
      setShowModal(false);
      setPageName('');
      setPageId('');
      setAccessToken('');
    } catch (err: any) {
      alert('Error adding page: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleToggleStatus = async (item: DestinationData) => {
    if (!item.id) return;
    try {
      await toggleDestinationStatus(item.id, item.status);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeletePage = async (item: DestinationData) => {
    if (!item.id) return;
    if (window.confirm(`Disconnect Facebook page "${item.name}"?`)) {
      try {
        await deleteDestination(item.id);
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  const handleDeleteAccount = async (account: FacebookAccount) => {
    if (!account.id || !user) return;
    if (window.confirm(`Disconnect Facebook Account "${account.name}" and all its linked pages?`)) {
      try {
        await deleteFacebookAccount(user.uid, account.id);
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  // Filter pages according to selected account
  const filteredPages = selectedAccountId === 'all'
    ? pages
    : pages.filter(p => p.accountId === selectedAccountId);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Facebook className="w-6 h-6 text-[#1877F2]" /> Facebook Multi-Account Studio
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Connect multiple Facebook accounts, manage pages, and publish to multiple destinations simultaneously.
          </p>
        </div>
        
        <div className="flex gap-2.5">
          <button 
            onClick={() => {
              setModalTab('token');
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1864D9] text-white px-4 py-2.5 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Connect Facebook Account
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Connected Accounts</div>
            <div className="text-xl font-bold text-foreground">{accounts.length} Accounts</div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Total Facebook Pages</div>
            <div className="text-xl font-bold text-foreground">{pages.length} Pages</div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Publishing Status</div>
            <div className="text-sm font-semibold text-emerald-600">Meta Graph API Ready</div>
          </div>
        </div>
      </div>

      {/* Connected Facebook Accounts Row */}
      {accounts.length > 0 && (
        <div className="bg-card border rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1877F2]" /> Connected Facebook Profiles ({accounts.length})
            </h2>
            <button 
              onClick={() => {
                setModalTab('presets');
                setShowModal(true);
              }}
              className="text-xs text-[#1877F2] hover:underline font-medium"
            >
              + Add Another Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {accounts.map(acc => (
              <div 
                key={acc.id} 
                className={`p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                  selectedAccountId === acc.id ? 'border-[#1877F2] bg-blue-50/20' : 'bg-background hover:border-border'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={acc.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=1877f2&color=fff`} 
                    alt={acc.name} 
                    className="w-10 h-10 rounded-full object-cover border shrink-0" 
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-foreground truncate">{acc.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">ID: {acc.fbUserId}</div>
                    <div className="text-[10px] text-emerald-600 font-medium">● Connected</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <button
                    onClick={() => handleDeleteAccount(acc)}
                    title="Disconnect this account"
                    className="p-1.5 text-muted-foreground hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Filter Pills */}
      <div className="flex items-center justify-between gap-3 border-b pb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Filter by Account:</span>
          <button
            onClick={() => setSelectedAccountId('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedAccountId === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Accounts ({pages.length})
          </button>

          {accounts.map(acc => {
            const count = pages.filter(p => p.accountId === acc.id).length;
            return (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id || '')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  selectedAccountId === acc.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{acc.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setModalTab('manual');
            setShowModal(true);
          }}
          className="text-xs text-brand-600 hover:underline font-medium"
        >
          + Add Single Page Manually
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center text-muted-foreground">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading connected accounts & pages...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredPages.length === 0 && (
        <div className="text-center p-12 bg-card border border-dashed rounded-xl space-y-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Facebook className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {selectedAccountId === 'all' ? 'No Facebook Accounts or Pages Connected' : 'No Pages in this Account'}
            </h3>
            <p className="text-muted-foreground text-xs mt-1 max-w-md mx-auto">
              Connect your Facebook account with a Meta token or select a preset account to begin auto-scheduling and multi-account publishing.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button 
              onClick={() => {
                setModalTab('presets');
                setShowModal(true);
              }} 
              className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Connect Demo Account
            </button>
            <button 
              onClick={() => {
                setModalTab('token');
                setShowModal(true);
              }} 
              className="border hover:bg-accent px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Connect Real Meta Token
            </button>
          </div>
        </div>
      )}

      {/* Pages Grid */}
      {!loading && filteredPages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPages.map(page => (
            <div 
              key={page.id} 
              className="bg-card border rounded-xl p-4.5 hover:border-brand-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-[#1877F2]">
                      <Facebook className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">{page.name}</h3>
                      <p className="text-[11px] text-muted-foreground truncate">{page.category}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleToggleStatus(page)}
                    className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      page.status === 'active' 
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> {page.status === 'active' ? 'Active' : 'Paused'}
                  </button>
                </div>
                
                {/* Account Owner & Stats */}
                <div className="space-y-1.5 py-2.5 border-t border-b text-xs text-muted-foreground">
                  {page.accountName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-brand-700 bg-brand-50/70 p-1.5 rounded-md">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Account: <strong>{page.accountName}</strong></span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Page ID:</span>
                    <strong className="text-foreground font-mono">{page.pageId}</strong>
                  </div>
                  {page.followersCount && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span>Followers:</span>
                      <strong className="text-foreground">{page.followersCount.toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Card Footer Actions */}
              <div className="flex justify-between items-center pt-3 mt-2">
                <button
                  onClick={() => navigate(`/create?destId=${page.id}`)}
                  className="px-2.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3 h-3" /> Create Post
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleStatus(page)} 
                    className="text-xs text-muted-foreground hover:text-foreground px-1 py-0.5"
                  >
                    {page.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleDeletePage(page)} 
                    className="text-xs text-red-600 hover:underline px-1 py-0.5"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Multi-Account Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
                <Facebook className="w-5 h-5 text-[#1877F2]" /> Connect Facebook Account / Page
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b text-xs">
              <button
                onClick={() => setModalTab('token')}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  modalTab === 'token' ? 'border-[#1877F2] text-[#1877F2] font-semibold' : 'border-transparent text-muted-foreground'
                }`}
              >
                Meta Token / Graph API
              </button>
              <button
                onClick={() => setModalTab('presets')}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  modalTab === 'presets' ? 'border-[#1877F2] text-[#1877F2] font-semibold' : 'border-transparent text-muted-foreground'
                }`}
              >
                ⚡ 1-Click Multi-Account Presets
              </button>
              <button
                onClick={() => setModalTab('manual')}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  modalTab === 'manual' ? 'border-[#1877F2] text-[#1877F2] font-semibold' : 'border-transparent text-muted-foreground'
                }`}
              >
                Single Page Manual
              </button>
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success' 
                  ? 'bg-green-500/10 text-green-700 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-700 border border-red-500/20'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* TAB 1: Meta Access Token */}
            {modalTab === 'token' && (
              <form onSubmit={handleConnectToken} className="space-y-3.5 text-xs">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" /> Connect Direct with Meta User Access Token
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Paste your Facebook User Access Token (with <code>pages_show_list</code> and <code>pages_manage_posts</code> permissions). The software will fetch your user profile and automatically import all pages you manage into this system!
                  </p>
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline pt-0.5"
                  >
                    Open Meta Graph API Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">User Access Token</label>
                  <input
                    type="password"
                    required
                    placeholder="EAABw..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-[#1877F2] font-mono text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 border rounded-lg hover:bg-accent font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={connecting || !tokenInput.trim()} 
                    className="px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {connecting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Fetching Pages...
                      </>
                    ) : (
                      'Connect & Import Pages'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Multi-Account Presets */}
            {modalTab === 'presets' && (
              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground text-[11px]">
                  Select an account preset to instantly simulate multi-account workflows, distinct pages, and scheduled posting:
                </p>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(MULTI_ACCOUNT_PRESETS).map(([key, p]) => (
                    <div key={key} className="p-3 border rounded-xl bg-card hover:border-brand-300 transition-colors flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-full object-cover shrink-0 border" />
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-foreground truncate">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground">{p.role} • {p.pages.length} Pages</div>
                          <div className="text-[10px] text-brand-600 truncate">Pages: {p.pages.map(x => x.name).join(', ')}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConnectPreset(key as any)}
                        disabled={connecting}
                        className="shrink-0 px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium text-xs transition-colors shadow-2xs disabled:opacity-50"
                      >
                        + Connect
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end border-t">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 border rounded-lg hover:bg-accent font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Manual Page Add */}
            {modalTab === 'manual' && (
              <form onSubmit={handleManualAdd} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Page Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul Official, Tech News India"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    className="w-full p-2 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Facebook Page ID (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1092837465019"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="w-full p-2 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Creator & Influencer">Creator & Influencer</option>
                    <option value="News & Media">News & Media</option>
                    <option value="Business & Brand">Business & Brand</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Page Access Token (Optional)</label>
                  <input 
                    type="password" 
                    placeholder="EAAB..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full p-2 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 border rounded-lg hover:bg-accent font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={connecting || !pageName.trim()} 
                    className="px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium transition-colors"
                  >
                    Save Page
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

