import React, { useState, useEffect } from 'react';
import { XCircle, RefreshCw, AlertTriangle, Edit2, Play, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeJobsByStatus, 
  retryFailedJob, 
  deletePublishJob, 
  type PublishJobData 
} from '../lib/firestoreService';

export default function FailedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [failedList, setFailedList] = useState<PublishJobData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeJobsByStatus(user.uid, 'failed', (items) => {
      setFailedList(items);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleRetry = async (item: PublishJobData) => {
    if (!item.id || !user) return;
    try {
      await retryFailedJob(item.id, user.uid, item.destinationName);
      alert('Post successfully retried and published!');
    } catch (err: any) {
      alert('Retry error: ' + err.message);
    }
  };

  const handleCancel = async (item: PublishJobData) => {
    if (!item.id) return;
    if (window.confirm('Delete this failed job?')) {
      try {
        await deletePublishJob(item.id);
      } catch (err: any) {
        alert('Delete error: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-red-600">Failed Posts</h1>
          <p className="text-muted-foreground">Review and retry posts that failed to publish</p>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-muted-foreground">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Checking failed posts...
        </div>
      )}

      {!loading && failedList.length === 0 && (
        <div className="bg-card border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">All Clear! No Failed Posts</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              None of your scheduled or published posts have encountered errors.
            </p>
          </div>
        </div>
      )}

      {!loading && failedList.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {failedList.map(item => (
            <div key={item.id} className="bg-card border border-red-500/20 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-red-500/5 border-b border-red-500/10 flex justify-between items-center">
                <div className="flex items-center gap-2 text-red-600 font-semibold text-xs">
                  <XCircle className="w-4 h-4" />
                  Publishing Failed
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {item.attempts ? `${item.attempts} attempts` : '1 attempt'}
                </span>
              </div>
              
              <div className="p-5 flex flex-col md:flex-row gap-6">
                {/* Media Preview */}
                <div className="w-full md:w-48 aspect-video bg-muted rounded-lg flex-shrink-0 border flex items-center justify-center relative overflow-hidden">
                  {item.mediaUrl ? (
                    <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">Text Only</span>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1 space-y-3 text-xs">
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-0.5">Destination</h4>
                    <p className="font-semibold text-foreground">{item.destinationName}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-muted-foreground mb-0.5">Post Content</h4>
                    <p className="text-foreground line-clamp-2">{item.caption}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-0.5">Error Reason</h4>
                    <div className="bg-red-500/10 text-red-700 p-2.5 rounded-lg border border-red-500/20 flex gap-2 items-start">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{item.errorMessage || 'Meta API Timeout or Page Permission Expired.'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleRetry(item)}
                      className="bg-brand-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Now
                    </button>
                    <button 
                      onClick={() => handleCancel(item)}
                      className="text-red-600 hover:bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ml-auto flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Job
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
