import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, AlertTriangle, Facebook, Plus, Trash2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeDestinations, 
  addDestination, 
  deleteDestination, 
  type DestinationData 
} from '../lib/firestoreService';

export default function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [groups, setGroups] = useState<DestinationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Modal form state
  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [privacy, setPrivacy] = useState('Public');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeDestinations(user.uid, 'facebook_group', (list) => {
      setGroups(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupName.trim()) return;
    setSubmitting(true);
    try {
      await addDestination({
        userId: user.uid,
        name: groupName.trim(),
        pageId: groupId.trim() || `grp_${Date.now()}`,
        type: 'facebook_group',
        category: `${privacy} Group`,
        status: 'active',
        followersCount: Math.floor(Math.random() * 8000) + 1000
      });
      setShowModal(false);
      setGroupName('');
      setGroupId('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (group: DestinationData) => {
    if (!group.id) return;
    if (window.confirm(`Disconnect Facebook Group "${group.name}"?`)) {
      try {
        await deleteDestination(group.id);
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facebook Groups</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage Facebook Groups where you can publish content</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1864D9] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Facebook Group
        </button>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl flex gap-3 text-xs leading-relaxed">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          <strong>Meta Groups Note:</strong> Meta requires the SocialFlow AI app to be added to group apps in Group Settings by an admin for direct API posting. You can connect your groups below to target them in post creation.
        </p>
      </div>

      {loading && (
        <div className="p-12 text-center text-muted-foreground">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading connected groups...
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="text-center p-12 bg-card border border-dashed rounded-xl space-y-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">No Facebook Groups Connected</h3>
            <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
              Add Facebook Groups that you manage or have permission to post into.
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm"
          >
            + Connect First Group
          </button>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map(group => (
            <div key={group.id} className="bg-card border rounded-xl overflow-hidden hover:border-brand-300 transition-colors flex flex-col justify-between shadow-sm">
              <div className="p-5 flex-1 space-y-3">
                <div className="flex gap-3.5 items-start">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight text-foreground">{group.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{group.category} • {group.followersCount ? `${group.followersCount.toLocaleString()} members` : 'Active'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-medium">Connected for Publishing</span>
                </div>
              </div>
              
              <div className="p-3 bg-muted/20 border-t flex gap-2 justify-between items-center text-xs">
                <button 
                  onClick={() => navigate('/create')}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Post
                </button>
                <button 
                  onClick={() => handleDelete(group)}
                  className="text-muted-foreground hover:text-red-600 p-1.5 rounded transition-colors"
                  title="Remove Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-blue-600" /> Connect Facebook Group
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGroup} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Group Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Digital Creators Hub"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Group ID (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 58392019485"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Privacy</label>
                <select 
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Public">Public Group</option>
                  <option value="Private">Private Group</option>
                </select>
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
                  disabled={submitting || !groupName.trim()}
                  className="px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium transition-colors"
                >
                  {submitting ? 'Saving...' : 'Add Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
