import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  MoreVertical,
  PlayCircle,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Sparkles,
  PenSquare
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function MediaPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const mockMedia = [
    { id: '1', name: 'cute_puppy.jpg', type: 'image', status: 'analyzed', score: 92, date: '2023-10-25' },
    { id: '2', name: 'product_demo.mp4', type: 'video', status: 'ready', score: null, date: '2023-10-24' },
    { id: '3', name: 'beach_sunset.png', type: 'image', status: 'published', score: 85, date: '2023-10-23' },
    { id: '4', name: 'funny_meme.jpg', type: 'image', status: 'scheduled', score: 88, date: '2023-10-22' },
  ];

  const onDrop = (acceptedFiles: File[]) => {
    // In a real app, we'd upload these to Firebase Storage here
    console.log('Files dropped:', acceptedFiles);
    setShowUploadModal(false);
    // Show toast success
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search media..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-accent text-sm font-medium">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
        <div className="flex items-center bg-background border rounded-lg p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mockMedia.map((media) => (
            <div key={media.id} className="group relative bg-card border rounded-xl overflow-hidden aspect-square flex flex-col">
              <div className="flex-1 bg-muted relative flex items-center justify-center">
                {media.type === 'video' ? (
                  <PlayCircle className="w-12 h-12 text-muted-foreground/50" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                  <button onClick={() => navigate(`/create?mediaId=${media.id}`)} className="bg-brand-600 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-brand-700">
                    <PenSquare className="w-4 h-4" /> Create
                  </button>
                  <button onClick={() => navigate(`/ai-studio?mediaId=${media.id}`)} className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-purple-700">
                    <Sparkles className="w-4 h-4" /> Analyze
                  </button>
                </div>

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {media.score && (
                    <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-brand-400" /> {media.score}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    media.status === 'published' ? 'bg-green-500/90 text-white' :
                    media.status === 'scheduled' ? 'bg-blue-500/90 text-white' :
                    media.status === 'analyzed' ? 'bg-purple-500/90 text-white' :
                    'bg-gray-500/90 text-white'
                  }`}>
                    {media.status}
                  </span>
                </div>
              </div>
              <div className="p-3 border-t bg-card flex justify-between items-center">
                <span className="text-sm font-medium truncate pr-2">{media.name}</span>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media List View */}
      {viewMode === 'list' && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">File</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">AI Score</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockMedia.map((media) => (
                <tr key={media.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      {media.type === 'video' ? <PlayCircle className="w-5 h-5 text-muted-foreground" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <span className="font-medium">{media.name}</span>
                  </td>
                  <td className="p-4 capitalize">{media.type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      media.status === 'published' ? 'bg-green-500/10 text-green-500' :
                      media.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                      media.status === 'analyzed' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {media.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {media.score ? (
                      <span className="flex items-center gap-1 font-medium text-brand-600">
                        <Sparkles className="w-4 h-4" /> {media.score}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{media.date}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/create?mediaId=${media.id}`)} className="p-1.5 text-muted-foreground hover:text-brand-600 rounded-md hover:bg-brand-50" title="Create Post">
                        <PenSquare className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-red-600 rounded-md hover:bg-red-50" title="Delete">
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

      {/* Upload Modal (simplified for now) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-xl flex flex-col overflow-hidden animate-fade-in">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Upload Media</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-brand-500 hover:bg-accent'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-medium mb-1">Drag & drop files here</h4>
                <p className="text-sm text-muted-foreground mb-4">or click to browse from your computer</p>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP, MP4, MOV up to 100MB</p>
              </div>
            </div>
            
            <div className="p-4 border-t bg-muted/30 flex justify-end gap-3">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded-lg font-medium hover:bg-accent">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
