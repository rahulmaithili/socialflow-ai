import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  Zap, 
  Sliders, 
  ThumbsUp, 
  ArrowRight,
  RefreshCw,
  Search,
  MessageCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeEngagementRules, 
  addEngagementRule, 
  updateEngagementRule, 
  deleteEngagementRule, 
  matchCommentAgainstRule,
  type AutoEngagementRule 
} from '../lib/autoEngagementService';
import { subscribeDestinations, type DestinationData } from '../lib/firestoreService';
import { parseSpintax } from '../lib/spintaxService';

export default function AutoEngagementPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutoEngagementRule[]>([]);
  const [pages, setPages] = useState<DestinationData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [keywordsText, setKeywordsText] = useState('PRICE, INFO, EBOOK, SEND, LINK, DETAILS');
  const [matchType, setMatchType] = useState<'contains' | 'exact'>('contains');
  const [autoLikeComment, setAutoLikeComment] = useState(true);
  const [commentRepliesText, setCommentRepliesText] = useState(
    'Sent you the link in your DM! 📩\nCheck your Messenger inbox! 😊\nDetails sent directly to your messages! 🚀'
  );
  const [dmMessage, setDmMessage] = useState(
    'Hey {name}! 👋\n\nThanks for your interest! Here is the direct download link you requested:\n👉 https://example.com/download\n\nFeel free to ask if you need any help!'
  );
  const [status, setStatus] = useState<'active' | 'paused'>('active');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Simulator State
  const [simulatedComment, setSimulatedComment] = useState('Can you please send me the price and ebook?');
  const [simulatedName, setSimulatedName] = useState('Rahul');
  const [simResult, setSimResult] = useState<{
    matchedRule?: AutoEngagementRule;
    matchedKeyword?: string;
    likeTriggered: boolean;
    replyOutput: string;
    dmOutput: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubRules = subscribeEngagementRules(user.uid, (data) => {
      setRules(data);
      setLoading(false);
    });

    const unsubPages = subscribeDestinations(user.uid, (destList) => {
      const pageList = destList.filter(d => d.type === 'page' || d.type === 'group');
      setPages(pageList);
      if (pageList.length > 0 && !pageId) {
        setPageId(pageList[0].destinationId || pageList[0].id || 'default');
        setPageName(pageList[0].name);
      }
    });

    return () => {
      unsubRules();
      unsubPages();
    };
  }, [user]);

  const handleOpenNew = () => {
    setEditingRuleId(null);
    setName('Lead Magnet Auto-Responder');
    setKeywordsText('PRICE, INFO, EBOOK, SEND, LINK, DETAILS, FREE');
    setMatchType('contains');
    setAutoLikeComment(true);
    setCommentRepliesText('Sent you the link in your DM! 📩\nCheck your Messenger inbox! 😊\nDetails sent directly to your messages! 🚀');
    setDmMessage('Hey {name}! 👋\n\nHere is your requested access link:\n👉 https://example.com/download\n\nEnjoy!');
    setStatus('active');
    if (pages.length > 0) {
      setPageId(pages[0].destinationId || pages[0].id || 'all');
      setPageName(pages[0].name);
    } else {
      setPageId('all_pages');
      setPageName('All Connected Pages');
    }
    setShowModal(true);
  };

  const handleEditRule = (r: AutoEngagementRule) => {
    setEditingRuleId(r.id || null);
    setName(r.name);
    setPageId(r.pageId);
    setPageName(r.pageName);
    setKeywordsText(r.triggerKeywords.join(', '));
    setMatchType(r.matchType);
    setAutoLikeComment(r.autoLikeComment);
    setCommentRepliesText(r.commentReplies.join('\n'));
    setDmMessage(r.dmMessage);
    setStatus(r.status);
    setShowModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setFeedback({ type: 'error', text: 'Please enter a rule name.' });
      return;
    }

    const triggerKeywords = keywordsText
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    if (triggerKeywords.length === 0) {
      setFeedback({ type: 'error', text: 'Please provide at least one trigger keyword.' });
      return;
    }

    const commentReplies = commentRepliesText
      .split('\n')
      .map(c => c.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (editingRuleId) {
        await updateEngagementRule(editingRuleId, {
          name,
          pageId,
          pageName: pageName || 'Connected Page',
          triggerKeywords,
          matchType,
          autoLikeComment,
          commentReplies: commentReplies.length > 0 ? commentReplies : ['Check your DM! 📩'],
          dmMessage,
          status
        });
        setFeedback({ type: 'success', text: 'Automation Rule updated successfully!' });
      } else {
        await addEngagementRule({
          userId: user.uid,
          name,
          pageId: pageId || 'all_pages',
          pageName: pageName || 'All Connected Pages',
          triggerKeywords,
          matchType,
          autoLikeComment,
          commentReplies: commentReplies.length > 0 ? commentReplies : ['Check your DM! 📩'],
          dmMessage,
          status
        });
        setFeedback({ type: 'success', text: 'New Auto-Engagement Rule deployed!' });
      }
      setShowModal(false);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to save automation rule.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this auto-engagement rule?')) return;
    try {
      await deleteEngagementRule(id);
      setFeedback({ type: 'success', text: 'Rule deleted successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to delete rule.' });
    }
  };

  const handleToggleStatus = async (r: AutoEngagementRule) => {
    if (!r.id) return;
    try {
      const nextStatus = r.status === 'active' ? 'paused' : 'active';
      await updateEngagementRule(r.id, { status: nextStatus });
    } catch (err: any) {
      console.error(err);
    }
  };

  const runSimulation = () => {
    if (!simulatedComment.trim()) {
      setSimResult(null);
      return;
    }

    let foundMatch: { rule: AutoEngagementRule; keyword: string } | null = null;

    for (const r of rules) {
      const matched = matchCommentAgainstRule(r, simulatedComment);
      if (matched) {
        foundMatch = { rule: r, keyword: matched };
        break;
      }
    }

    if (!foundMatch) {
      setSimResult({
        likeTriggered: false,
        replyOutput: 'No active rule matched this comment text.',
        dmOutput: 'No Messenger DM sent.'
      });
      return;
    }

    const { rule, keyword } = foundMatch;
    // Pick random reply or parse Spintax
    const chosenReplyTemplate = rule.commentReplies[Math.floor(Math.random() * rule.commentReplies.length)] || 'Check your DM! 📩';
    const parsedReply = parseSpintax(chosenReplyTemplate).text.replace('{name}', simulatedName);
    const parsedDm = parseSpintax(rule.dmMessage).text.replace('{name}', simulatedName);

    setSimResult({
      matchedRule: rule,
      matchedKeyword: keyword,
      likeTriggered: rule.autoLikeComment,
      replyOutput: parsedReply,
      dmOutput: parsedDm
    });
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Auto-Comment & Messenger DM Bot
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Instant Lead Generation (ManyChat Alternative) — Auto-reply to comments and deliver links via private DM!
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Rule</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
          feedback.type === 'success' ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{rules.length}</div>
            <div className="text-xs text-slate-400">Total Active Rules</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {rules.reduce((acc, curr) => acc + (curr.totalTriggered || 0), 0)}
            </div>
            <div className="text-xs text-slate-400">Total Leads Generated</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">100%</div>
            <div className="text-xs text-slate-400">Instant Response Rate</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">Anti-Ban Safe</div>
            <div className="text-xs text-slate-400">Randomized Human Delays</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Rules Table + Interactive Simulator */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Rules List (2 Columns) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>Automation Trigger Rules</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                {rules.length} configured
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading automation rules...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No automation rules configured yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                Create your first rule to automatically like incoming comments, respond publicly, and send Messenger DMs instantly!
              </p>
              <button
                onClick={handleOpenNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition"
              >
                + Create Your First Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 bg-slate-900/60 backdrop-blur-md ${
                    r.status === 'active' 
                      ? 'border-slate-800/90 hover:border-blue-500/40 shadow-sm' 
                      : 'border-slate-800/40 opacity-70 bg-slate-950/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${r.status === 'active' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">{r.name}</h4>
                        <span className="text-xs text-slate-400">Target: {r.pageName || 'All Connected Pages'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(r)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition ${
                          r.status === 'active' 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' 
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                      >
                        {r.status === 'active' ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                        <span>{r.status === 'active' ? 'Running' : 'Paused'}</span>
                      </button>

                      <button
                        onClick={() => handleEditRule(r)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                        title="Edit Rule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Trigger keywords */}
                    <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-400" />
                        Triggers ({r.matchType}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {r.triggerKeywords.map((k, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-md border border-blue-500/20 font-mono">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Auto Actions */}
                    <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Actions Configured:
                      </span>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          {r.autoLikeComment ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-500" />}
                          <span>Auto-like Comment: {r.autoLikeComment ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Public Reply: {r.commentReplies.length} randomized variations</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Messenger DM: Enabled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Interactive Simulator Box */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Bot className="w-28 h-28 text-blue-500" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Live Rule Test Simulator</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Test how your bot responds to visitor comments. Enter sample text to verify trigger matches and preview DM payloads in real-time.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">User Name</label>
                <input
                  type="text"
                  value={simulatedName}
                  onChange={(e) => setSimulatedName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  placeholder="e.g. Rahul"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Incoming Comment Text</label>
                <textarea
                  rows={3}
                  value={simulatedComment}
                  onChange={(e) => setSimulatedComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition resize-none"
                  placeholder="e.g. Can you share the free ebook link?"
                />
              </div>

              <button
                type="button"
                onClick={runSimulation}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
              >
                <Zap className="w-4 h-4" />
                <span>Simulate Trigger</span>
              </button>
            </div>

            {/* Simulation Result */}
            {simResult && (
              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Matched Rule:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${simResult.matchedRule ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {simResult.matchedRule ? simResult.matchedRule.name : 'No Match'}
                  </span>
                </div>

                {simResult.matchedKeyword && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Trigger Keyword:</span>
                    <span className="font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
                      {simResult.matchedKeyword}
                    </span>
                  </div>
                )}

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Public Comment Reply:</span>
                    <p className="text-emerald-300 font-medium">"{simResult.replyOutput}"</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Private Messenger DM:</span>
                    <p className="text-slate-300 whitespace-pre-line bg-slate-900/80 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                      {simResult.dmOutput}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create / Edit Rule */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Bot className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">
                  {editingRuleId ? 'Edit Automation Rule' : 'Create Auto-Engagement Rule'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Free Course Giveaway DM Bot"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Page</label>
                <select
                  value={pageId}
                  onChange={(e) => {
                    setPageId(e.target.value);
                    const sel = pages.find(p => (p.destinationId || p.id) === e.target.value);
                    if (sel) setPageName(sel.name);
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all_pages">All Connected Pages & Groups</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.destinationId || p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Trigger Keywords (Comma separated)</label>
                  <input
                    type="text"
                    required
                    value={keywordsText}
                    onChange={(e) => setKeywordsText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                    placeholder="PRICE, INFO, EBOOK, SEND, LINK"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Bot triggers when comment contains any of these words.</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Match Condition</label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="contains">Contains Keyword (Recommended)</option>
                    <option value="exact">Exact Match Only</option>
                  </select>
                  <span className="text-[11px] text-slate-500 mt-1 block">Contains allows sentence matches like "Please send info".</span>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoLikeComment}
                    onChange={(e) => setAutoLikeComment(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs font-medium text-slate-200">
                    Auto-like the visitor's comment (Builds social proof 👍)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Public Comment Replies (1 per line or Spintax)
                </label>
                <textarea
                  rows={3}
                  value={commentRepliesText}
                  onChange={(e) => setCommentRepliesText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none font-mono text-xs"
                  placeholder="Sent you the link in DM! 📩&#10;Check your inbox messages! 😊"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">The bot randomly rotates between these variations to prevent spam detection.</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Private Messenger Direct Message (DM)
                </label>
                <textarea
                  rows={4}
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none font-mono text-xs"
                  placeholder="Hey {name}! Here is your link: https://..."
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Use <code className="text-blue-400">{'{name}'}</code> to dynamically greet the commenter.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2 transition"
                >
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingRuleId ? 'Update Rule' : 'Save & Launch Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
