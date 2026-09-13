import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  PlayCircle,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  PenSquare,
  XCircle,
  Plus,
  Link as LinkIcon
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeMedia, 
  uploadMediaFile, 
  addMediaByUrl, 
  deleteMediaItem, 
  type MediaItemData 
} from '../lib/firestoreService';

export default function MediaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  
  const [mediaList, setMediaList] = useState<MediaItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // URL input tab state
  const [uploadTab, setUploadTab] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');

  // Subscribe to user's real Firestore media
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeMedia(user.uid, (items) => {
      setMediaList(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      for (const file of acceptedFiles) {
        await uploadMediaFile(user.uid, file, (progress) => {
          setUploadProgress(progress);
        });
      }
      setShowUploadModal(false);
    } catch (err: any) {
      console.error('File upload error:', err);
      alert('Upload failed: ' + (err.message || 'Error occurred'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !urlInput.trim()) return;
    setUploading(true);
    try {
      const name = urlName.trim() || `Image_${Date.now()}.jpg`;
      const isVideo = urlInput.includes('.mp4') || urlInput.includes('video');
      await addMediaByUrl(user.uid, name, urlInput.trim(), isVideo ? 'video' : 'image');
      setUrlInput('');
      setUrlName('');
      setShowUploadModal(false);
    } catch (err: any) {
      alert('Failed to add media link: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id?: string, name: string = 'media') => {
    if (!user || !id) return;
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteMediaItem(user.uid, id, name);
      } catch (err: any) {
        alert('Delete failed: ' + err.message);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
      'video/*': ['.mp4', '.mov', '.webm']
    }
  });

  const filteredMedia = mediaList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Manage your photos and videos</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Upload className="w-5 h-5" />
          Upload Media
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-card p-4 rounded-xl border">
        <div className="flex flex-1 gap-4 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search media by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
            />
          </div>
          
          <div className="flex items-center gap-1 bg-background border rounded-lg p-1 text-xs">
            <button 
              onClick={() => setFilterType('all')} 
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${filterType === 'all' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All ({mediaList.length})
            </button>
            <button 
              onClick={() => setFilterType('image')} 
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${filterType === 'image' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Images
            </button>
            <button 
              onClick={() => setFilterType('video')} 
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${filterType === 'video' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Videos
            </button>
          </div>
        </div>

        <div className="flex items-center bg-background border rounded-lg p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            title="List View"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredMedia.length === 0 && (
        <div className="bg-card border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No media found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {searchQuery ? 'No media matches your search query.' : 'Upload photos or videos to get started with AI analysis and scheduling.'}
            </p>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Upload First Media
          </button>
        </div>
      )}

      {/* Media Grid View */}
      {!loading && viewMode === 'grid' && filteredMedia.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((media) => (
            <div key={media.id} className="group relative bg-card border rounded-xl overflow-hidden aspect-square flex flex-col shadow-sm">
              <div className="flex-1 bg-muted relative flex items-center justify-center overflow-hidden">
                {media.url ? (
                  media.type === 'video' ? (
                    <video src={media.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                  )
                ) : (
                  media.type === 'video' ? (
                    <PlayCircle className="w-12 h-12 text-muted-foreground/50" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                  )
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 backdrop-blur-xs">
                  <button 
                    onClick={() => navigate(`/create?mediaId=${media.id}&mediaUrl=${encodeURIComponent(media.url)}&name=${encodeURIComponent(media.name)}`)} 
                    className="w-full max-w-[130px] bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-brand-700 transition-colors"
                  >
                    <PenSquare className="w-3.5 h-3.5" /> Create Post
                  </button>
                  <button 
                    onClick={() => navigate(`/ai-studio?topic=${encodeURIComponent(media.name)}`)} 
                    className="w-full max-w-[130px] bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-purple-700 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Studio
                  </button>
                </div>

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                  {media.score && (
                    <span className="bg-black/75 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold backdrop-blur-xs">
                      <Sparkles className="w-3 h-3 text-brand-400" /> {media.score}%
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    media.status === 'published' ? 'bg-green-600 text-white' :
                    media.status === 'scheduled' ? 'bg-blue-600 text-white' :
                    media.status === 'analyzed' ? 'bg-purple-600 text-white' :
                    'bg-gray-700 text-white'
                  }`}>
                    {media.status}
                  </span>
                </div>
              </div>
              
              <div className="p-2.5 border-t bg-card flex justify-between items-center">
                <span className="text-xs font-medium truncate pr-2 text-foreground" title={media.name}>
                  {media.name}
                </span>
                <button 
                  onClick={() => handleDelete(media.id, media.name)}
                  className="text-muted-foreground hover:text-red-600 p-1 rounded transition-colors" 
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media List View */}
      {!loading && viewMode === 'list' && filteredMedia.length > 0 && (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">File</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">AI Score</th>
                <th className="p-4 font-medium">Created Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMedia.map((media) => (
                <tr key={media.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border">
                      {media.url ? (
                        <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                      ) : (
                        media.type === 'video' ? <PlayCircle className="w-5 h-5 text-muted-foreground" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium truncate max-w-xs">{media.name}</span>
                  </td>
                  <td className="p-4 capitalize text-muted-foreground">{media.type}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      media.status === 'published' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                      media.status === 'scheduled' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                      media.status === 'analyzed' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {media.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {media.score ? (
                      <span className="flex items-center gap-1 font-semibold text-brand-600">
                        <Sparkles className="w-4 h-4" /> {media.score}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {new Date(media.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/create?mediaId=${media.id}&mediaUrl=${encodeURIComponent(media.url)}&name=${encodeURIComponent(media.name)}`)} 
                        className="p-1.5 text-muted-foreground hover:text-brand-600 rounded-md hover:bg-brand-50 transition-colors" 
                        title="Create Post"
                      >
                        <PenSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(media.id, media.name)} 
                        className="p-1.5 text-muted-foreground hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Add New Media</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch: File upload vs URL input */}
            <div className="flex border-b bg-muted/20">
              <button 
                onClick={() => setUploadTab('file')}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 flex items-center justify-center gap-2 transition-colors ${
                  uploadTab === 'file' ? 'border-brand-600 text-brand-600 bg-background' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
              <button 
                onClick={() => setUploadTab('url')}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 flex items-center justify-center gap-2 transition-colors ${
                  uploadTab === 'url' ? 'border-brand-600 text-brand-600 bg-background' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <LinkIcon className="w-4 h-4" /> Image / Video URL
              </button>
            </div>
            
            <div className="p-6">
              {uploadTab === 'file' ? (
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-brand-500 hover:bg-accent'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-semibold mb-1">Drag & drop files here</h4>
                  <p className="text-sm text-muted-foreground mb-3">or click to browse from your computer</p>
                  <p className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP, MP4, MOV</p>
                  
                  {uploading && (
                    <div className="w-full mt-4 space-y-2">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-brand-600 h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <p className="text-xs text-brand-600 font-medium">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAddUrl} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Media Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sunset Beach or Product Launch" 
                      value={urlName}
                      onChange={(e) => setUrlName(e.target.value)}
                      className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Image or Video URL</label>
                    <input 
                      type="url" 
                      required
                      placeholder="https://images.unsplash.com/photo-..." 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={uploading || !urlInput.trim()}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Adding...' : 'Add to Media Library'}
                  </button>
                </form>
              )}
            </div>
            
            <div className="p-4 border-t bg-muted/30 flex justify-end gap-3">
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="px-4 py-2 rounded-lg font-medium text-sm hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
