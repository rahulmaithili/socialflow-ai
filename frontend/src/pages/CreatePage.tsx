import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Facebook, 
  Instagram, 
  Youtube, 
  Twitter, 
  CalendarDays,
  Send, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  ChevronDown, 
  Plus, 
  Clock,
  Film,
  CheckSquare,
  Square,
  TrendingUp,
  Flame,
  Check,
  Zap,
  Upload,
  Heart,
  MessageCircle,
  Share2,
  PenSquare,
  Users,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeMedia, 
  subscribeDestinations, 
  createPublishJob, 
  generateSmartContent, 
  uploadMediaFile,
  type MediaItemData, 
  type DestinationData,
  type GeneratedAIContent
} from '../lib/firestoreService';
import { getGeminiApiKey, generateContentWithGemini, predictViralScore } from '../lib/geminiService';

export default function CreatePage() {
  const [searchParams] = useSearchParams();
  const mediaIdParam = searchParams.get('mediaId');
  const mediaUrlParam = searchParams.get('mediaUrl');
  const nameParam = searchParams.get('name');
  const destIdParam = searchParams.get('destId');
  const promptParam = searchParams.get('prompt');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Post Format: Standard Post vs Facebook Reel
  const [postType, setPostType] = useState<'post' | 'reel'>('post');

  // State
  const [mediaList, setMediaList] = useState<MediaItemData[]>([]);
  const [destinations, setDestinations] = useState<DestinationData[]>([]);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>(mediaUrlParam || '');
  const [selectedMediaName, setSelectedMediaName] = useState<string>(nameParam || '');
  
  // Multi-Page Destination Selection
  const [selectedDestIds, setSelectedDestIds] = useState<string[]>(destIdParam ? [destIdParam] : []);
  
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'x'>('facebook');
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('Viral');
  const [promptTopic, setPromptTopic] = useState(promptParam || '');

  // Destination Type Filter: all | page | group | instagram
  const [destFilter, setDestFilter] = useState<'all' | 'page' | 'group' | 'instagram'>('all');

  // Anti-Spam Drip-Feed Queue state
  const [dripFeed, setDripFeed] = useState(true);
  const [dripInterval, setDripInterval] = useState<number>(45);

  // AI Generated output
  const [analyzing, setAnalyzing] = useState(false);
  const [aiContent, setAiContent] = useState<GeneratedAIContent | null>(null);
  
  // Final Editor
  const [finalText, setFinalText] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  // Scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDirectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingMedia(true);
    setUploadProgress(15);
    try {
      const mediaItem = await uploadMediaFile(user.uid, file, (p) => {
        setUploadProgress(p);
      });
      setSelectedMediaUrl(mediaItem.url);
      setSelectedMediaName(mediaItem.name);
      setPromptTopic(mediaItem.name.replace(/\.[^/.]+$/, ''));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  // Live Viral Score Calculation
  const viralScore = useMemo(() => {
    return predictViralScore(finalText, platform, !!selectedMediaUrl);
  }, [finalText, platform, selectedMediaUrl]);

  // Set default schedule date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Subscribe to media and destinations
  useEffect(() => {
    if (!user) return;
    const unsubMedia = subscribeMedia(user.uid, (items) => {
      setMediaList(items);
      if (mediaIdParam && !selectedMediaUrl) {
        const found = items.find(m => m.id === mediaIdParam);
        if (found) {
          setSelectedMediaUrl(found.url);
          setSelectedMediaName(found.name);
          setPromptTopic(found.name.replace(/\.[^/.]+$/, ''));
        }
      }
    });

    const unsubDest = subscribeDestinations(user.uid, 'all', (dests) => {
      setDestinations(dests);
      if (dests.length > 0 && selectedDestIds.length === 0) {
        if (destIdParam && dests.some(d => d.id === destIdParam)) {
          setSelectedDestIds([destIdParam]);
        } else {
          // Select all active pages by default for maximum reach
          setSelectedDestIds(dests.map(d => d.id || '').filter(Boolean));
        }
      }
    });

    return () => {
      unsubMedia();
      unsubDest();
    };
  }, [user, mediaIdParam, destIdParam]);

  const [aiSource, setAiSource] = useState<'gemini' | 'engine'>('engine');

  // Toggle single page
  const toggleDestination = (id: string) => {
    setSelectedDestIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Select/Deselect all pages
  const toggleSelectAllDestinations = () => {
    if (selectedDestIds.length === destinations.length) {
      setSelectedDestIds([]);
    } else {
      setSelectedDestIds(destinations.map(d => d.id || '').filter(Boolean));
    }
  };

  // Handle AI generation with Real Gemini AI
  const handleGenerateAI = async () => {
    setAnalyzing(true);
    const baseTopic = promptTopic || selectedMediaName || 'Viral Content';
    const topic = postType === 'reel' ? `Facebook Reel: ${baseTopic}` : baseTopic;

    try {
      if (getGeminiApiKey()) {
        const geminiResult = await generateContentWithGemini(topic, tone, language, platform);
        setAiContent(geminiResult);
        setHashtags(geminiResult.hashtags);
        setAiSource('gemini');
        if (geminiResult.captions.length > 0) {
          setFinalText(geminiResult.captions[0].text + '\n\n' + geminiResult.hashtags.slice(0, 6).join(' '));
        }
      } else {
        const result = generateSmartContent(topic, tone, language, platform);
        setAiContent(result);
        setHashtags(result.hashtags);
        setAiSource('engine');
        if (result.captions.length > 0) {
          setFinalText(result.captions[0].text + '\n\n' + result.hashtags.slice(0, 5).join(' '));
        }
      }
    } catch (err: any) {
      console.warn('Gemini call error, falling back to smart engine:', err.message);
      const fallbackResult = generateSmartContent(topic, tone, language, platform);
      setAiContent(fallbackResult);
      setHashtags(fallbackResult.hashtags);
      setAiSource('engine');
      if (fallbackResult.captions.length > 0) {
        setFinalText(fallbackResult.captions[0].text + '\n\n' + fallbackResult.hashtags.slice(0, 5).join(' '));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Get selected destination summary
  const getDestinationSummary = () => {
    if (selectedDestIds.length === 0) return 'No Page Selected';
    if (selectedDestIds.length === 1) {
      const d = destinations.find(x => x.id === selectedDestIds[0]);
      return d ? d.name : '1 Facebook Page';
    }
    return `${selectedDestIds.length} Facebook Pages Selected`;
  };

  // Action: Publish Now (Supports Multi-Page Publishing & Anti-Spam Drip-Feed)
  const handlePublishNow = async () => {
    if (!user) return;
    if (!finalText.trim()) {
      alert('Please enter post content or generate a caption first.');
      return;
    }
    if (destinations.length > 0 && selectedDestIds.length === 0) {
      alert('Please select at least one destination.');
      return;
    }

    setSubmitting(true);
    try {
      const targetDestinations = destinations.filter(d => selectedDestIds.includes(d.id || ''));
      const targets = targetDestinations.length > 0 ? targetDestinations : [{ id: 'default_page', name: 'Facebook Page' }];

      if (dripFeed && targets.length > 1) {
        let accumulatedDelay = 0;
        for (let i = 0; i < targets.length; i++) {
          const target = targets[i];
          const isFirst = i === 0;
          if (!isFirst) {
            const variance = Math.floor(Math.random() * 16) - 8; // +/- 8s variance
            accumulatedDelay += Math.max(15, dripInterval + variance);
          }

          const scheduledTime = isFirst 
            ? undefined 
            : new Date(Date.now() + accumulatedDelay * 1000).toISOString();

          await createPublishJob({
            userId: user.uid,
            caption: finalText,
            hashtags,
            mediaUrl: selectedMediaUrl,
            mediaName: selectedMediaName,
            destinationId: target.id || 'default_page',
            destinationName: target.name,
            platform,
            postType: postType,
            status: isFirst ? 'published' : 'scheduled',
            publishedAt: isFirst ? new Date().toISOString() : undefined,
            scheduledAt: scheduledTime
          });
        }

        alert(`🛡️ Anti-Spam Drip-Feed Active: 1st post published immediately! Remaining ${targets.length - 1} destinations scheduled with ${dripInterval}s humanized delays to prevent account flags.`);
        navigate('/queue');
        return;
      }

      for (const target of targets) {
        await createPublishJob({
          userId: user.uid,
          caption: finalText,
          hashtags,
          mediaUrl: selectedMediaUrl,
          mediaName: selectedMediaName,
          destinationId: target.id || 'default_page',
          destinationName: target.name,
          platform,
          postType: postType,
          status: 'published',
          publishedAt: new Date().toISOString()
        });
      }

      alert(`🎉 Successfully published across ${targets.length} destination(s)!`);
      navigate('/published');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Schedule Post (Supports Multi-Page Scheduling)
  const handleSchedulePost = async () => {
    if (!user) return;
    if (!finalText.trim()) {
      alert('Please enter post content first.');
      return;
    }
    if (!scheduleDate) {
      alert('Please select a date to schedule.');
      return;
    }
    if (destinations.length > 0 && selectedDestIds.length === 0) {
      alert('Please select at least one Facebook Page destination.');
      return;
    }

    setSubmitting(true);
    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
      const targetDestinations = destinations.filter(d => selectedDestIds.includes(d.id || ''));
      const targets = targetDestinations.length > 0 ? targetDestinations : [{ id: 'default_page', name: 'Facebook Page' }];

      for (const target of targets) {
        await createPublishJob({
          userId: user.uid,
          caption: finalText,
          hashtags,
          mediaUrl: selectedMediaUrl,
          mediaName: selectedMediaName,
          destinationId: target.id || 'default_page',
          destinationName: target.name,
          platform,
          postType: postType,
          status: 'scheduled',
          scheduledAt: scheduledDateTime
        });
      }

      setShowScheduleModal(false);
      alert(`⏰ Successfully scheduled across ${targets.length} Facebook destination(s)!`);
      navigate('/queue');
    } catch (err: any) {
      alert('Error scheduling: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Save Draft
  const handleSaveDraft = async () => {
    if (!user) return;
    if (!finalText.trim()) {
      alert('Please enter some text to save as draft.');
      return;
    }
    setSubmitting(true);
    try {
      await createPublishJob({
        userId: user.uid,
        caption: finalText,
        hashtags,
        mediaUrl: selectedMediaUrl,
        mediaName: selectedMediaName,
        destinationId: selectedDestId || 'default_page',
        destinationName: getDestinationName(),
        platform,
        status: 'draft'
      });
      alert('Draft saved!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-8">
      
      {/* LEFT PANEL: Setup & Controls */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col gap-4 overflow-y-auto pr-1">
        
        {/* Post Type Selector: Standard Post vs Facebook Reel */}
        <div className="bg-card border rounded-xl p-1.5 flex gap-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setPostType('post')}
            className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
              postType === 'post' 
                ? 'bg-brand-600 text-white shadow-xs' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <PenSquare className="w-3.5 h-3.5" /> 📝 Standard Post
          </button>
          <button
            type="button"
            onClick={() => {
              setPostType('reel');
              if (!promptTopic) setPromptTopic('Viral Facebook Reel Hook');
            }}
            className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
              postType === 'reel' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> 🎬 Facebook Reel / Video
          </button>
        </div>

        {/* Media Selector */}
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              1. {postType === 'reel' ? '🎬 Reel Video (9:16 Vertical)' : '🖼️ Post Media'}
            </h2>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input 
                  type="file" 
                  accept={postType === 'reel' ? 'video/*' : 'image/*,video/*'} 
                  onChange={handleDirectFileChange} 
                  className="hidden" 
                />
              </label>
              {selectedMediaUrl && (
                <button 
                  onClick={() => { setSelectedMediaUrl(''); setSelectedMediaName(''); }} 
                  className="text-xs text-muted-foreground hover:text-red-500"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploadingMedia && (
            <div className="space-y-1 bg-brand-50/50 p-2.5 rounded-lg border border-brand-200">
              <div className="flex justify-between text-[11px] text-brand-800 font-medium">
                <span>Uploading {postType === 'reel' ? 'Reel Video' : 'Media'}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-brand-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-600 transition-all duration-200" 
                  style={{ width: `${uploadProgress}%` }} 
                />
              </div>
            </div>
          )}
          
          {selectedMediaUrl ? (
            postType === 'reel' ? (
              /* Dedicated 9:16 Smartphone Mockup Preview */
              <div className="relative w-48 mx-auto aspect-[9/16] bg-black rounded-2xl border-4 border-slate-800 shadow-xl overflow-hidden group">
                {selectedMediaUrl.match(/\.(mp4|mov|webm)($|\?)/i) ? (
                  <video src={selectedMediaUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={selectedMediaUrl} alt="Reel Preview" className="w-full h-full object-cover" />
                )}

                {/* Reels Interface Overlay Mockup */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2.5 bg-gradient-to-b from-black/20 via-transparent to-black/80 text-white">
                  {/* Top Bar */}
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                      <Film className="w-2.5 h-2.5 text-purple-400" /> Reels
                    </span>
                    <span className="bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">9:16 HD</span>
                  </div>

                  {/* Right Action Icons Column */}
                  <div className="self-end flex flex-col items-center gap-2.5 text-center text-[9px] font-semibold mb-6">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center">
                        <Heart className="w-3.5 h-3.5 text-white fill-white/80" />
                      </div>
                      <span className="mt-0.5">14.8K</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center">
                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="mt-0.5">342</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center">
                        <Share2 className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="mt-0.5">95</span>
                    </div>

                    <div className="w-6 h-6 rounded-full border border-white/40 bg-zinc-900 animate-spin flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                    </div>
                  </div>

                  {/* Bottom Caption & Audio Ticker */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <span>@your_page</span>
                      <CheckCircle2 className="w-2.5 h-2.5 text-blue-400 fill-blue-400" />
                    </div>
                    <p className="text-[9px] text-white/90 line-clamp-2 leading-tight">
                      {finalText || promptTopic || 'Viral Reel Caption preview...'}
                    </p>
                    <p className="text-[8px] text-white/70 flex items-center gap-1 truncate">
                      <span>🎵 Original Audio - SocialFlow Viral Mix</span>
                    </p>
                  </div>
                </div>

                {/* Change Button on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                  <button onClick={() => navigate('/media')} className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-semibold shadow">
                    Choose from Library
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Post Image/Video Preview */
              <div className="aspect-video bg-black rounded-lg border overflow-hidden relative group">
                {selectedMediaUrl.match(/\.(mp4|mov|webm)($|\?)/i) ? (
                  <video src={selectedMediaUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={selectedMediaUrl} alt="Selected" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                  <button onClick={() => navigate('/media')} className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-semibold">
                    Change From Library
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <div 
                onClick={() => navigate('/media')} 
                className={`${postType === 'reel' ? 'aspect-[16/9]' : 'aspect-video'} bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center flex-col gap-2 hover:border-brand-500 hover:bg-accent cursor-pointer transition-colors p-4 text-center`}
              >
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-xs">
                  {postType === 'reel' ? <Film className="w-5 h-5 text-purple-600" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div>
                  <span className="font-semibold text-xs text-foreground block">
                    {postType === 'reel' ? 'Select Reel Clip from Library' : 'Choose Photo/Video from Library'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {postType === 'reel' ? 'Supports MP4, MOV, WebM' : 'Supports JPG, PNG, MP4'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Prompt / Topic input for AI */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-muted-foreground">
              {postType === 'reel' ? 'Reel Topic or Video Description' : 'Topic or Subject'}
            </label>
            <input 
              type="text" 
              placeholder={postType === 'reel' ? "e.g. 3 psychology tricks to get rich, hilarious comedy skit..." : "e.g. 5 tips to grow on Facebook, funny cat video..."}
              value={promptTopic}
              onChange={(e) => setPromptTopic(e.target.value)}
              className="w-full p-2.5 bg-background border rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-card border rounded-xl p-4 space-y-4 flex-1">
          <h2 className="font-semibold text-xs uppercase text-muted-foreground tracking-wider">2. Configuration</h2>
          
          {/* Platform */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Target Platform</label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setPlatform('facebook')} 
                className={`p-2 rounded-lg border flex-1 flex justify-center items-center gap-1.5 text-xs font-medium transition-colors ${
                  platform === 'facebook' ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'hover:bg-accent'
                }`}
              >
                <Facebook className="w-4 h-4" /> Facebook
              </button>
              <button 
                type="button"
                onClick={() => setPlatform('instagram')} 
                className={`p-2 rounded-lg border flex-1 flex justify-center items-center gap-1.5 text-xs font-medium transition-colors ${
                  platform === 'instagram' ? 'bg-gradient-to-tr from-[#FD1D1D] to-[#405DE6] text-white border-transparent' : 'hover:bg-accent'
                }`}
              >
                <Instagram className="w-4 h-4" /> Instagram
              </button>
              <button 
                type="button"
                onClick={() => setPlatform('youtube')} 
                className={`p-2 rounded-lg border flex-1 flex justify-center items-center gap-1.5 text-xs font-medium transition-colors ${
                  platform === 'youtube' ? 'bg-[#FF0000] text-white border-[#FF0000]' : 'hover:bg-accent'
                }`}
              >
                <Youtube className="w-4 h-4" /> YouTube
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 rounded-lg border bg-background text-xs outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tone</label>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-2 rounded-lg border bg-background text-xs outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Viral">Viral / High Energy</option>
                <option value="Casual">Casual</option>
                <option value="Professional">Professional</option>
                <option value="Storytelling">Storytelling</option>
                <option value="Humorous">Humorous</option>
              </select>
            </div>
          </div>

          {/* Multi-Page Destinations Selection */}
          <div className="space-y-2.5 pt-1 border-t">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-[#1877F2]" /> Destinations ({selectedDestIds.length}/{destinations.length})
              </label>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={toggleSelectAllDestinations}
                  className="text-[11px] text-brand-600 hover:underline font-medium"
                >
                  {selectedDestIds.length === destinations.length ? 'Deselect All' : 'Select All'}
                </button>
                <button onClick={() => navigate('/pages')} className="text-[11px] text-muted-foreground hover:underline">
                  + Add
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setDestFilter('all')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors shrink-0 ${
                  destFilter === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({destinations.length})
              </button>
              <button
                type="button"
                onClick={() => setDestFilter('page')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                  destFilter === 'page' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Facebook className="w-2.5 h-2.5" /> Pages ({destinations.filter(d => d.type === 'facebook_page').length})
              </button>
              <button
                type="button"
                onClick={() => setDestFilter('group')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                  destFilter === 'group' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-2.5 h-2.5" /> Groups ({destinations.filter(d => d.type === 'facebook_group').length})
              </button>
              <button
                type="button"
                onClick={() => setDestFilter('instagram')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                  destFilter === 'instagram' ? 'bg-pink-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Instagram className="w-2.5 h-2.5" /> IG ({destinations.filter(d => d.type?.includes('instagram')).length})
              </button>
            </div>
            
            {destinations.length > 0 ? (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 border rounded-lg p-2 bg-background/50">
                {destinations
                  .filter(d => {
                    if (destFilter === 'page') return d.type === 'facebook_page';
                    if (destFilter === 'group') return d.type === 'facebook_group';
                    if (destFilter === 'instagram') return d.type?.includes('instagram');
                    return true;
                  })
                  .map(d => {
                    const isSelected = selectedDestIds.includes(d.id || '');
                    const isGroup = d.type === 'facebook_group';
                    const isIg = d.type?.includes('instagram');
                    return (
                      <div
                        key={d.id}
                        onClick={() => toggleDestination(d.id || '')}
                        className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected 
                            ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-medium' 
                            : 'hover:bg-accent border-transparent text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="truncate min-w-0">
                            <span className="font-semibold text-foreground flex items-center gap-1 truncate">
                              {isIg ? <Instagram className="w-3 h-3 text-pink-500 shrink-0" /> : isGroup ? <Users className="w-3 h-3 text-emerald-600 shrink-0" /> : <Facebook className="w-3 h-3 text-blue-600 shrink-0" />}
                              <span className="truncate">{d.name}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {d.accountName ? `${d.accountName} • ` : ''}{isGroup ? 'Facebook Group' : isIg ? 'Instagram' : 'Facebook Page'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-white/80 border px-1.5 py-0.5 rounded font-mono shrink-0">
                          {d.followersCount ? `${d.followersCount.toLocaleString()} fans` : 'Active'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="p-3 bg-muted/40 border border-dashed rounded-lg text-xs flex justify-between items-center">
                <span className="text-muted-foreground">No Destinations Connected</span>
                <button onClick={() => navigate('/pages')} className="text-brand-600 font-medium hover:underline">
                  Connect via Browser
                </button>
              </div>
            )}

            {/* Anti-Spam Drip-Feed Controls */}
            {selectedDestIds.length > 1 && (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-950">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>🛡️ Anti-Spam Drip-Feed Shield</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={dripFeed} 
                    onChange={(e) => setDripFeed(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Post automatically spaces out targets with human-like delays ({dripInterval}s) to bypass automated Meta spam triggers.
                </p>
                {dripFeed && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-200/50">
                    <span className="text-[11px] text-purple-900 font-medium">Delay Between Targets:</span>
                    <select
                      value={dripInterval}
                      onChange={(e) => setDripInterval(Number(e.target.value))}
                      className="px-2 py-1 bg-white border border-purple-300 rounded text-xs text-purple-900 font-semibold outline-none"
                    >
                      <option value={25}>⚡ Fast (20-30s)</option>
                      <option value={45}>🛡️ Recommended Safe (35-55s)</option>
                      <option value={90}>🔒 Ultra Safe (1-2 mins)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            type="button"
            onClick={handleGenerateAI}
            disabled={analyzing}
            className="w-full py-2.5 bg-gradient-brand text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI Analyzing & Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Captions & Hooks with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: AI Generated Results & Final Editor */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        
        {/* If AI Generated content exists */}
        {aiContent && (
          <div className="space-y-4">
            {/* Viral Hooks */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-600" /> Viral Hooks (Click to add)
                  </h3>
                  {aiSource === 'gemini' ? (
                    <span className="text-[10px] bg-purple-500/10 text-purple-600 font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
                      ⚡ Google Gemini Real Research
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Smart Engine • <button onClick={() => navigate('/settings')} className="text-brand-600 underline">Add Gemini Key</button>
                    </span>
                  )}
                </div>
                <span className="text-xs bg-green-500/10 text-green-600 font-semibold px-2 py-0.5 rounded-full border border-green-500/20">
                  Engagement: {aiContent.engagementScore}%
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {aiContent.hooks.map((hook, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setFinalText(prev => `${hook}\n\n${prev}`)}
                    className="p-2.5 text-left text-xs bg-muted/40 hover:bg-brand-50 hover:border-brand-300 border rounded-lg transition-colors leading-relaxed"
                  >
                    {hook}
                  </button>
                ))}
              </div>
            </div>

            {/* Captions Options */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-xs uppercase text-muted-foreground">Generated Captions (Click to use)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiContent.captions.map((cap, i) => (
                  <div 
                    key={i} 
                    onClick={() => setFinalText(cap.text + '\n\n' + hashtags.slice(0, 6).join(' '))}
                    className="p-3 border rounded-lg hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer bg-background flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-2 py-0.5 rounded uppercase">
                        {cap.type}
                      </span>
                      <p className="text-xs whitespace-pre-wrap mt-2 leading-relaxed">{cap.text}</p>
                    </div>
                    <span className="text-[11px] text-brand-600 font-medium mt-2">Click to insert →</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags */}
            <div className="bg-card border rounded-xl p-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground mr-1">Hashtags:</span>
              {hashtags.map((tag) => (
                <span 
                  key={tag} 
                  onClick={() => setFinalText(prev => prev.includes(tag) ? prev : `${prev} ${tag}`)}
                  className="px-2 py-0.5 bg-accent hover:bg-brand-100 hover:text-brand-700 text-foreground rounded text-xs font-medium cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Live Viral Engagement Predictor */}
        {finalText.trim().length > 10 && (
          <div className="bg-card border rounded-xl p-3.5 shadow-xs space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="font-semibold text-xs text-foreground">AI Viral Probability Predictor:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  viralScore.grade === 'A+' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                  viralScore.grade === 'A' ? 'bg-green-100 text-green-700 border border-green-300' :
                  'bg-yellow-100 text-yellow-700 border border-yellow-300'
                }`}>
                  Grade {viralScore.grade} • {viralScore.score}/100
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {viralScore.verdict}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-muted/40 p-2 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground font-medium">Hook Strength</div>
                <div className="text-xs font-bold text-foreground">{viralScore.dimensions.hookStrength}%</div>
              </div>
              <div className="bg-muted/40 p-2 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground font-medium">Emotion / FOMO</div>
                <div className="text-xs font-bold text-foreground">{viralScore.dimensions.emotionalResonance}%</div>
              </div>
              <div className="bg-muted/40 p-2 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground font-medium">Readability</div>
                <div className="text-xs font-bold text-foreground">{viralScore.dimensions.readability}%</div>
              </div>
              <div className="bg-muted/40 p-2 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground font-medium">Virality / CTA</div>
                <div className="text-xs font-bold text-foreground">{viralScore.dimensions.viralityPotential}%</div>
              </div>
            </div>

            {viralScore.suggestions.length > 0 && viralScore.score < 85 && (
              <div className="text-[11px] text-muted-foreground bg-orange-50/60 border border-orange-200/60 p-2 rounded-lg flex items-start gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                <span><strong>Pro Tip:</strong> {viralScore.suggestions[0]}</span>
              </div>
            )}
          </div>
        )}

        {/* Final Post Editor */}
        <div className="bg-card border-2 border-brand-500/20 rounded-xl overflow-hidden flex flex-col flex-1 min-h-[340px] shadow-sm">
          <div className="p-3 bg-brand-50/50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-xs text-brand-900 uppercase tracking-wider">Final Post Content</h3>
            <span className="text-xs text-muted-foreground">{finalText.length} characters</span>
          </div>
          
          <textarea 
            className="w-full flex-1 p-4 resize-none outline-none bg-background text-sm leading-relaxed"
            value={finalText}
            onChange={(e) => setFinalText(e.target.value)}
            placeholder="Write your post here or generate using AI on the left panel..."
          />
          
          {/* Action Bar */}
          <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Targets: <strong>{getDestinationSummary()}</strong></span>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button 
                type="button"
                onClick={handleSaveDraft}
                disabled={submitting}
                className="px-3.5 py-2 bg-background border hover:bg-accent rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
              <button 
                type="button"
                onClick={() => setShowScheduleModal(true)}
                disabled={submitting}
                className="px-3.5 py-2 bg-background border hover:bg-accent rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 text-orange-600"
              >
                <CalendarDays className="w-4 h-4" /> Schedule
              </button>
              <button 
                type="button"
                onClick={handlePublishNow}
                disabled={submitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" /> Publish Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Post Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" /> Schedule Publication
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* AI Peak Slot Quick Button */}
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  setScheduleDate(`${yyyy}-${mm}-${dd}`);
                  setScheduleTime('19:45');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>⚡ Auto AI Peak Traffic Slot (Tomorrow 07:45 PM)</span>
              </button>

              <div className="space-y-1">
                <label className="text-xs font-medium">Select Date</label>
                <input 
                  type="date" 
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Select Time</label>
                <input 
                  type="time" 
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="p-3 bg-brand-50/60 rounded-lg text-xs text-brand-800">
                💡 Post will be queued and published automatically across <strong>{getDestinationSummary()}</strong>.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button 
                onClick={handleSchedulePost}
                disabled={submitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {submitting ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
