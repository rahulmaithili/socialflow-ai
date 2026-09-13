import React, { useState, useEffect } from 'react';
import { Facebook, CheckCircle2, AlertTriangle, ShieldCheck, Plus, Trash2, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeDestinations, 
  addDestination, 
  deleteDestination, 
  toggleDestinationStatus, 
  type DestinationData 
} from '../lib/firestoreService';

export default function PagesPage() {
  const { user } = useAuth();
  
  const [pages, setPages] = useState<DestinationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Form state
  const [pageName, setPageName] = useState('');
  const [pageId, setPageId] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeDestinations(user.uid, 'facebook_page', (list) => {
      setPages(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleAddPage = async (e: React.FormEvent) => {
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

  const handleQuickAdd = async (name: string, cat: string) => {
    if (!user) return;
    setConnecting(true);
    try {
      await addDestination({
        userId: user.uid,
        name,
        pageId: `fb_page_${Date.now()}`,
        type: 'facebook_page',
        category: cat,
        status: 'active',
        followersCount: 2500
      });
      setShowModal(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleToggle = async (item: DestinationData) => {
    if (!item.id) return;
    try {
      await toggleDestinationStatus(item.id, item.status);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (item: DestinationData) => {
    if (!item.id) return;
    if (window.confirm(`Disconnect Facebook page "${item.name}"?`)) {
      try {
        await deleteDestination(item.id);
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facebook Pages</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your connected Meta Pages for auto-publishing</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1864D9] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Connect Facebook Page
        </button>
      </div>

      {loading && (
        <div className="p-12 text-center text-muted-foreground">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading connected pages...
        </div>
      )}

      {!loading && pages.length === 0 && (
        <div className="text-center p-12 bg-card border border-dashed rounded-xl space-y-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Facebook className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">No Facebook Pages Connected</h3>
            <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
              Connect your Facebook Page or add a test page to schedule and publish posts directly through SocialFlow AI.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm"
            >
              Add Page Manually
            </button>
            <button 
              onClick={() => handleQuickAdd('My Viral Page', 'Entertainment')} 
              className="border hover:bg-accent px-4 py-2 rounded-lg text-xs font-semibold"
            >
              + Quick Connect Test Page
            </button>
          </div>
        </div>
      )}

      {!loading && pages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pages.map(page => (
            <div key={page.id} className="bg-card border rounded-xl p-5 hover:border-brand-300 transition-colors shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3.5 items-center">
                    <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                      <Facebook className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{page.name}</h3>
                      <p className="text-xs text-muted-foreground">{page.category}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleToggle(page)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      page.status === 'active' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {page.status === 'active' ? 'Active' : 'Paused'}
                  </button>
                </div>
                
                <div className="space-y-2 pt-3 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-500" />
                    <span>Page ID: <strong className="text-foreground">{page.pageId}</strong></span>
                  </div>
                  {page.followersCount && (
                    <div className="text-[11px]">
                      Followers: <strong>{page.followersCount.toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <span className="text-[11px] text-muted-foreground">
                  Connected: {new Date(page.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggle(page)} 
                    className="text-xs font-medium text-brand-600 hover:underline px-1 py-0.5"
                  >
                    {page.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleDelete(page)} 
                    className="text-xs font-medium text-red-600 hover:underline px-1 py-0.5"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Page Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
                <Facebook className="w-5 h-5 text-blue-600" /> Connect Facebook Page
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPage} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Page Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. My Brand Page, Tech Insights"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Facebook Page ID (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 1092837465019"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Entertainment">Entertainment</option>
                  <option value="News & Media">News & Media</option>
                  <option value="Business & Brand">Business & Brand</option>
                  <option value="Education">Education</option>
                  <option value="Personal Blog">Personal Blog</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Page Access Token (Optional for Meta API)</label>
                <input 
                  type="password" 
                  placeholder="EAAB..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
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
                  {connecting ? 'Saving...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
