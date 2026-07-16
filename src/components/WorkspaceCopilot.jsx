import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, Sparkles, Cpu, FileText, 
  Milestone, Activity, X, Shield, CornerDownLeft, 
  AlertCircle, MessageSquare, Terminal, RefreshCw,
  Layers, HelpCircle
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function WorkspaceCopilot({ projectId, project }) {
  const [queryText, setQueryText] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your Workspace Intelligence Copilot. Ask me about blockers, sprint progress, documents, or team workloads in this project.",
      thoughts: '',
      sources: []
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeThoughts, setActiveThoughts] = useState('');
  const [activeAnswer, setActiveAnswer] = useState('');
  const [activeSources, setActiveSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  
  const messagesEndRef = useRef(null);

  const fetchChats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/copilot/chats?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('flowpilot_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (e) {
      console.error("Error fetching chats:", e);
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([
      {
        sender: 'bot',
        text: "Hello! I am your Workspace Intelligence Copilot. Ask me about blockers, sprint progress, documents, or team workloads in this project.",
        thoughts: '',
        sources: []
      }
    ]);
  };

  const loadChatSession = async (chatId) => {
    setIsLoading(true);
    setActiveChatId(chatId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/copilot/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('flowpilot_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([]);
        }
      }
    } catch (e) {
      console.error("Error loading chat session:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    startNewChat();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeAnswer, activeThoughts]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!queryText.trim() || isLoading) return;

    const userMessage = {
      sender: 'user',
      text: queryText
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = queryText;
    setQueryText('');
    setIsLoading(true);
    setActiveThoughts('');
    setActiveAnswer('');
    setActiveSources([]);

    let currentChatId = activeChatId;

    try {
      // If no active session, create a new session document first
      if (!currentChatId) {
        const title = currentQuery.length > 35 ? currentQuery.slice(0, 35) + '...' : currentQuery;
        const createResp = await fetch(`${API_BASE_URL}/api/v1/copilot/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('flowpilot_token')}`
          },
          body: JSON.stringify({
            project_id: projectId,
            title: title
          })
        });
        if (createResp.ok) {
          const newChat = await createResp.json();
          currentChatId = newChat._id;
          setActiveChatId(currentChatId);
          fetchChats();
        } else {
          throw new Error('Failed to create new chat session');
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/copilot/chats/${currentChatId}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('flowpilot_token')}`
        },
        body: JSON.stringify({
          prompt: currentQuery
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to streaming engine');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      // Local accumulators — avoid stale closure over React state snapshots.
      // React useState values captured inside async functions reflect the
      // value at the time the function started, not after subsequent setState calls.
      let localThoughts = '';
      let localAnswer = '';
      let localSources = [];
      let streamDone = false;

      while (!streamDone) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') {
              streamDone = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.thought) {
                localThoughts += parsed.thought;
                setActiveThoughts(localThoughts);
              } else if (parsed.chunk) {
                localAnswer += parsed.chunk;
                setActiveAnswer(localAnswer);
              } else if (parsed.sources) {
                localSources = parsed.sources;
                setActiveSources(localSources);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Commit completed response using local vars (not stale React state)
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: localAnswer,
        thoughts: localThoughts,
        sources: localSources
      }]);
      setActiveThoughts('');
      setActiveAnswer('');
      setActiveSources([]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `Error: ${err.message}. Please check if the server is running.`,
        thoughts: '',
        sources: []
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSourceByHash = (hash) => {
    // Search current message sources or activeSources
    let found = activeSources.find(s => s.metadata?.citation_hash === hash);
    if (!found) {
      // search backwards in messages
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sources) {
          const match = messages[i].sources.find(s => s.metadata?.citation_hash === hash);
          if (match) {
            found = match;
            break;
          }
        }
      }
    }
    if (found) {
      setSelectedSource(found);
    }
  };

  const renderMessageTextWithCitations = (text, messageSources) => {
    if (!text) return null;
    
    // Pattern to match citation footnotes: [cit_xxxx]
    const regex = /\[(cit_[a-f0-9]{5})\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const citationId = match[1];

      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      parts.push(
        <button
          key={matchIndex}
          onClick={() => selectSourceByHash(citationId)}
          className="mx-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all duration-150 hover:scale-105"
          style={{
            background: 'rgba(59,130,246,0.15)',
            color: '#3b82f6',
            border: '1px solid rgba(59,130,246,0.3)',
          }}
        >
          {citationId}
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // A simple parser to extract thinking logs if they are not in SSE thought packets but in the raw text block
    let parsedParts = parts;
    const rawText = parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : '';
    if (rawText && rawText.includes('<think>')) {
      const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        const think = thinkMatch[1].strip ? thinkMatch[1].strip() : thinkMatch[1];
        const rest = rawText.replace(/<think>[\s\S]*?<\/think>/, '').trim();
        return (
          <div>
            <details className="mb-3 rounded-lg border text-xs" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.02)' }}>
              <summary className="cursor-pointer p-2 font-mono flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Terminal size={12} />
                Thought Process Chain
              </summary>
              <div className="p-3 font-mono leading-relaxed border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {think}
              </div>
            </details>
            <div className="whitespace-pre-wrap leading-relaxed">{rest}</div>
          </div>
        );
      }
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{parsedParts}</div>;
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'TASK':
        return <Milestone size={13} className="text-amber-500" />;
      case 'DOCUMENT':
        return <FileText size={13} className="text-blue-500" />;
      case 'METRIC':
        return <Activity size={13} className="text-emerald-500" />;
      default:
        return <Shield size={13} className="text-purple-500" />;
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-230px)] min-h-[500px]">
      
      {/* Sidebar: Chat History */}
      <div className="w-56 shrink-0 flex flex-col rounded-2xl border"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={startNewChat}
            className="w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold hover:bg-black/5 active:scale-95 transition-all"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text)'
            }}
          >
            <span>+</span> Start New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Recent Chats
          </div>
          {chats.map(c => (
            <button
              key={c.id}
              onClick={() => loadChatSession(c.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs truncate transition-all ${
                activeChatId === c.id 
                  ? 'font-bold border bg-blue-500/10 text-blue-500' 
                  : 'hover:bg-black/5 text-slate-500'
              }`}
              style={{
                borderColor: activeChatId === c.id ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                color: activeChatId === c.id ? '#3b82f6' : 'var(--text-muted)'
              }}
            >
              💬 {c.title}
            </button>
          ))}
          {chats.length === 0 && (
            <div className="p-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              No previous chats
            </div>
          )}
        </div>
      </div>

      {/* Left Area: Chat Console */}
      <div className={`flex flex-col flex-1 min-w-0 rounded-2xl border transition-all duration-300`}
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <h3 className="font-bold text-sm tracking-wide" style={{ color: 'var(--text)' }}>
              Workspace Intelligence Copilot
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.18)',
              color: '#d97706'
            }}
          >
            <Layers size={10} />
            Target Project Scope
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {/* Bot icon avatar */}
              {m.sender === 'bot' && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: '#fff',
                    borderColor: 'rgba(59,130,246,0.3)'
                  }}
                >
                  <Bot size={16} />
                </div>
              )}

              {/* Message Bubble wrapper */}
              <div className="flex flex-col max-w-[85%]">
                {/* Optional Thought display */}
                {m.thoughts && (
                  <details className="mb-2 rounded-lg border text-xs" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                    <summary className="cursor-pointer p-2 font-mono flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Terminal size={12} />
                      Thought Process Chain
                    </summary>
                    <div className="p-3 font-mono leading-relaxed border-t whitespace-pre-wrap" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {m.thoughts}
                    </div>
                  </details>
                )}

                {/* Main bubble */}
                <div className={`p-4 rounded-2xl text-sm border`}
                  style={{
                    background: m.sender === 'user' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--surface-solid)',
                    color: m.sender === 'user' ? '#0f172a' : 'var(--text)',
                    borderColor: m.sender === 'user' ? 'rgba(245,158,11,0.3)' : 'var(--border)',
                    boxShadow: m.sender === 'user' ? '0 4px 12px rgba(245,158,11,0.15)' : 'none',
                    borderRadius: m.sender === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px'
                  }}
                >
                  {m.sender === 'user' ? (
                    <div className="whitespace-pre-wrap leading-relaxed font-medium">{m.text}</div>
                  ) : (
                    renderMessageTextWithCitations(m.text, m.sources)
                  )}
                </div>

                {/* Inline Source Chips (Reference Cards) */}
                {m.sender === 'bot' && m.sources && m.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {m.sources.map((src, sidx) => {
                      const hash = src.metadata?.citation_hash || `cit_${sidx}`;
                      const title = src.metadata?.title || src.metadata?.filename || 'Untitled Source';
                      const status = src.metadata?.status;
                      const type = src.entity_type;
                      
                      return (
                        <div key={sidx}
                          onClick={() => setSelectedSource(src)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                          style={{
                            background: 'var(--surface-solid)',
                            borderColor: 'var(--border)',
                            color: 'var(--text)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          {getSourceIcon(type)}
                          <span className="truncate max-w-[120px]">{title}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>
                            {hash}
                          </span>
                          {status && (
                            <span className="text-[9px] font-bold px-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 uppercase">
                              {status}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Active response stream builder */}
          {(activeThoughts || activeAnswer) && (
            <div className="flex gap-3 justify-start animate-pulse">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  borderColor: 'rgba(59,130,246,0.3)'
                }}
              >
                <Bot size={16} />
              </div>
              <div className="flex flex-col max-w-[85%] w-full">
                {activeThoughts && (
                  <div className="mb-2 rounded-lg border text-xs" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                    <div className="p-2 font-mono flex items-center gap-1.5 border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      <RefreshCw size={12} className="animate-spin" />
                      Analyzing Workspace Context Telemetry...
                    </div>
                    <div className="p-3 font-mono leading-relaxed whitespace-pre-wrap max-h-[150px] overflow-y-auto" style={{ color: 'var(--text-muted)' }}>
                      {activeThoughts}
                    </div>
                  </div>
                )}
                {activeAnswer && (
                  <div className="p-4 rounded-2xl text-sm border"
                    style={{
                      background: 'var(--surface-solid)',
                      color: 'var(--text)',
                      borderColor: 'var(--border)',
                      borderRadius: '4px 20px 20px 20px'
                    }}
                  >
                    {renderMessageTextWithCitations(activeAnswer, activeSources)}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion tags */}
        {!isLoading && messages.length <= 1 && (
          <div className="px-4 py-2 flex flex-wrap gap-2 border-t" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.01)' }}>
            {[
              "What is currently blocking our Sprint 8 velocity?",
              "Show me the overall workload metrics for our team",
              "Read the project requirements document scope"
            ].map((sug, sidx) => (
              <button
                key={sidx}
                onClick={() => {
                  setQueryText(sug);
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-150"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)'
                }}
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t flex gap-2 items-center" style={{ borderColor: 'var(--border)' }}>
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs">🔍</span>
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Ask workspace questions, look up deadlines, or generate updates..."
              className="w-full text-xs py-3 pl-9 pr-4 rounded-xl border focus:outline-none focus:border-blue-500 transition-all"
              style={{
                background: 'var(--surface-solid)',
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !queryText.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105"
            style={{
              background: isLoading || !queryText.trim() ? 'var(--border)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#0f172a',
              boxShadow: isLoading || !queryText.trim() ? 'none' : '0 2px 8px rgba(245,158,11,0.25)'
            }}
          >
            <Send size={15} />
          </button>
        </form>

      </div>

      {/* Right Area: Split-Screen Source Grounding Preview */}
      {selectedSource && (
        <div className="w-[350px] shrink-0 flex flex-col rounded-2xl border animate-slide-in-right"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5">
              {getSourceIcon(selectedSource.entity_type)}
              <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                Source Grounding Preview
              </h4>
            </div>
            <button
              onClick={() => setSelectedSource(null)}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 transition-all text-xs"
            >
              <X size={13} />
            </button>
          </div>

          {/* Details Scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Meta Table */}
            <div className="rounded-xl border p-3 space-y-2.5" style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Citation ID</span>
                <span className="font-mono font-bold" style={{ color: 'var(--blue)' }}>
                  {selectedSource.metadata?.citation_hash}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Type</span>
                <span className="font-semibold">{selectedSource.entity_type}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Source ID</span>
                <span className="font-mono truncate max-w-[150px]">{selectedSource.source_id}</span>
              </div>
              {selectedSource.metadata?.status && (
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-muted)' }}>Status</span>
                  <span className="font-bold px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 uppercase">
                    {selectedSource.metadata.status}
                  </span>
                </div>
              )}
              {selectedSource.metadata?.sprint && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Sprint</span>
                  <span className="font-medium">{selectedSource.metadata.sprint}</span>
                </div>
              )}
            </div>

            {/* Content Segment */}
            <div className="space-y-1.5">
              <h5 className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Exact Content Snippet
              </h5>
              <div className="p-3.5 rounded-xl border font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[250px] overflow-y-auto"
                style={{
                  background: 'var(--surface-solid)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
              >
                {selectedSource.content_snippet}
              </div>
            </div>

            {/* Metadata dumps */}
            {selectedSource.metadata && Object.keys(selectedSource.metadata).filter(k => !['citation_hash', 'status', 'sprint'].includes(k)).length > 0 && (
              <div className="space-y-1.5">
                <h5 className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Extended Source Attributes
                </h5>
                <div className="p-3 rounded-xl border font-mono text-[10px] leading-relaxed max-h-[150px] overflow-y-auto"
                  style={{
                    background: 'var(--surface-solid)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {Object.entries(selectedSource.metadata)
                    .filter(([k]) => !['citation_hash', 'status', 'sprint'].includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="py-0.5 truncate">
                        <span className="font-semibold text-blue-500">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
