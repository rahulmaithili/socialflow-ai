import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Calendar, Trash2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeCampaigns, 
  createCampaign, 
  deleteCampaign, 
  type CampaignData 
} from '../lib/firestoreService';

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('Viral Entertainment');
  const [audience, setAudience] = useState('General Public');
  const [platform, setPlatform] = useState('facebook');
  const [tone, setTone] = useState('Viral');
  const [postsPerDay, setPostsPerDay] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeCampaigns(user.uid, (list) => {
      setCampaigns(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      await createCampaign({
        userId: user.uid,
        name: name.trim(),
        niche,
        audience,
        platform,
        tone,
        postsPerDay,
        status: 'active'
      });
      setShowModal(false);
      setName('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (camp: CampaignData) => {
    if (!camp.id) return;
    if (window.confirm(`Delete campaign "${camp.name}"?`)) {
      try {
        await deleteCampaign(camp.id);
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground text-sm">Organize your content strategy into targeted campaigns</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {loading && (
        <div className="p-12 text-center text-muted-foreground">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading campaigns...
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="bg-card border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">No Campaigns Created</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Create a campaign to automatically group and plan regular posts for your brand.
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs"
          >
            + Create First Campaign
          </button>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map(camp => (
            <div key={camp.id} className="bg-card border rounded-xl overflow-hidden shadow-xs hover:border-brand-300 transition-colors flex flex-col justify-between">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <button 
                    onClick={() => handleDelete(camp)} 
                    className="text-muted-foreground hover:text-red-600 p-1 transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="font-bold text-base mb-1 text-foreground">{camp.name}</h3>
                <p className="text-xs text-muted-foreground mb-4 capitalize">{camp.niche} • {camp.platform}</p>
                
                <div className="space-y-1.5 mb-4 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frequency</span>
                    <span className="font-semibold text-foreground">{camp.postsPerDay} posts/day</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tone</span>
                    <span className="font-medium text-foreground">{camp.tone}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-[11px] font-medium">
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                    Active
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <Calendar className="w-3 h-3" /> Auto-schedule
                  </span>
                </div>
              </div>

              <div className="p-3 bg-muted/20 border-t flex gap-2">
                <button 
                  onClick={() => navigate('/media')} 
                  className="flex-1 py-1.5 bg-background border rounded-lg text-xs font-medium hover:bg-accent transition-colors"
                >
                  Add Media
                </button>
                <button 
                  onClick={() => navigate(`/create?prompt=${encodeURIComponent(camp.name)}`)} 
                  className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Generate Content
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
                <Megaphone className="w-5 h-5 text-brand-600" /> Create Campaign
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Campaign Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Daily Facebook Growth, Summer Launch" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Niche / Topic</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Fitness Tips, Tech Reviews" 
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Platform</label>
                  <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Tone</label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Viral">Viral</option>
                    <option value="Casual">Casual</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Posts per Day: <strong>{postsPerDay}</strong></label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={postsPerDay}
                  onChange={(e) => setPostsPerDay(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
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
                  disabled={submitting || !name.trim()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
                >
                  {submitting ? 'Creating...' : 'Save Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
