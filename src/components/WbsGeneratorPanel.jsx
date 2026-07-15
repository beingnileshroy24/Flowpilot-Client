import React, { useState, useRef, useEffect } from 'react';
import { wbsApi } from '../api/wbs';
import { BrainCircuit, UploadCloud, Terminal, CheckCircle2, Play, Trash2, Edit3, Save, X, Cpu } from 'lucide-react';

export default function WbsGeneratorPanel({ projectId, onCompleteCommit }) {
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  // Streaming states
  const [rawStream, setRawStream] = useState('');
  const [thinkLog, setThinkLog] = useState('');
  const [parsedTasks, setParsedTasks] = useState(null);
  
  // UI states
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const consoleEndRef = useRef(null);
  
  // Scroll console to bottom automatically
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thinkLog]);
  
  // Parse raw stream whenever it updates
  useEffect(() => {
    if (rawStream.includes('<think>')) {
      const thinkStart = rawStream.indexOf('<think>') + 7;
      const thinkEnd = rawStream.indexOf('</think>');
      
      if (thinkEnd !== -1) {
        setThinkLog(rawStream.substring(thinkStart, thinkEnd).trim());
      } else {
        setThinkLog(rawStream.substring(thinkStart).trim());
      }
    }
  }, [rawStream]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please select a requirements file first.');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setRawStream('');
    setThinkLog('');
    setParsedTasks(null);
    setStatusMsg('Initializing Engine...');
    
    let accumulatedStream = '';
    
    await wbsApi.generateWbsStream({
      projectId,
      file,
      onStatus: (msg) => setStatusMsg(msg),
      onChunk: (chunk) => {
        accumulatedStream += chunk;
        setRawStream(accumulatedStream);
      },
      onError: (err) => {
        setError(err.message || 'Generation failed.');
        setIsGenerating(false);
      },
      onComplete: () => {
        setIsGenerating(false);
        setStatusMsg('Generation Complete!');
        
        // Final parsing
        let jsonStr = accumulatedStream;
        if (accumulatedStream.includes('</think>')) {
          jsonStr = accumulatedStream.substring(accumulatedStream.indexOf('</think>') + 8);
        }
        
        try {
          // find array boundaries in case there's extra text
          const startIdx = jsonStr.indexOf('[');
          const endIdx = jsonStr.lastIndexOf(']');
          if (startIdx !== -1 && endIdx !== -1) {
            const cleanJson = jsonStr.substring(startIdx, endIdx + 1);
            const tasks = JSON.parse(cleanJson);
            setParsedTasks(tasks);
          } else {
            throw new Error('Valid JSON array not found in response');
          }
        } catch (e) {
          setError('Failed to parse generated tasks. ' + e.message);
        }
      }
    });
  };

  const handleCommit = async () => {
    if (!parsedTasks || parsedTasks.length === 0) return;
    try {
      setStatusMsg('Committing tasks to database...');
      await wbsApi.commitWbs({
        project_id: projectId,
        tasks: parsedTasks
      });
      setParsedTasks(null);
      setFile(null);
      setRawStream('');
      setThinkLog('');
      if (onCompleteCommit) onCompleteCommit();
    } catch (e) {
      setError('Failed to commit tasks: ' + e.message);
    }
  };

  // Editable Grid Handlers
  const updateTask = (index, field, value) => {
    const updated = [...parsedTasks];
    updated[index][field] = value;
    setParsedTasks(updated);
  };
  
  const removeTask = (index) => {
    setParsedTasks(parsedTasks.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-5 h-full animate-fade-in">
      {/* Header Area */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <BrainCircuit size={22} className="text-blue-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Neural Work Breakdown Engine</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by Local MLX LLM (DeepSeek R1 / Qwen)</p>
        </div>
      </div>
      
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Upload and Generation Section (Visible if tasks not generated yet) */}
      {!parsedTasks && (
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1 p-6 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center transition-all hover:bg-[var(--surface-solid)] hover:border-blue-500/50" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <UploadCloud size={36} className="text-blue-500 mb-3 opacity-80" />
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Upload Requirements</h3>
            <p className="text-xs mb-4 max-w-xs" style={{ color: 'var(--text-muted)' }}>Upload your PRD (PDF, DOCX, MD) to let the Neural Engine synthesize a structured WBS.</p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.docx,.doc,.txt,.md" 
              onChange={handleFileChange} 
            />
            
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary px-4 py-2 text-xs mb-3">
              {file ? file.name : "Select File..."}
            </button>
            
            <button 
              onClick={handleGenerate} 
              disabled={!file || isGenerating}
              className="btn-primary w-full max-w-[200px] py-2.5 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isGenerating ? <Cpu size={16} className="animate-pulse" /> : <Play size={16} className="group-hover:translate-x-0.5 transition-transform" />}
              {isGenerating ? 'Synthesizing...' : 'Start NWBE Process'}
            </button>
          </div>
          
          <div className="flex-1 p-4 rounded-2xl border flex flex-col h-64 md:h-auto font-mono" style={{ background: '#09090b', borderColor: '#27272a' }}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
              <Terminal size={14} className="text-green-400" />
              <span className="text-xs font-bold text-gray-300">Engine Terminal / Reasoning Log</span>
            </div>
            <div className="flex-1 overflow-y-auto text-[11px] leading-relaxed text-green-400/90 whitespace-pre-wrap">
              {statusMsg && <div className="mb-2 text-blue-400">&gt; {statusMsg}</div>}
              {thinkLog ? (
                <div>
                  <div className="text-gray-500 mb-1">{"<think>"}</div>
                  {thinkLog}
                  {rawStream.includes('</think>') && <div className="text-gray-500 mt-1">{"</think>"}</div>}
                </div>
              ) : (
                <div className="text-gray-600 italic">Waiting for input...</div>
              )}
              {isGenerating && <span className="animate-pulse">_</span>}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Interactive WBS Editor Section (Visible once tasks are generated) */}
      {parsedTasks && (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in gap-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <h3 className="text-sm font-bold text-green-500 flex items-center gap-2"><CheckCircle2 size={16} /> WBS Successfully Generated!</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Review and refine the {parsedTasks.length} tasks below before committing them to your board.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setParsedTasks(null)} className="btn-secondary text-xs py-1.5 flex items-center gap-1">Discard</button>
              <button onClick={handleCommit} className="btn-primary text-xs py-1.5 flex items-center gap-1 shadow-[0_0_15px_rgba(34,197,94,0.3)] bg-green-600 hover:bg-green-500 border-none">
                <Save size={14} /> Commit Tasks
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto rounded-xl border relative" style={{ background: 'var(--surface-solid)', borderColor: 'var(--border)' }}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="sticky top-0 z-10 shadow-sm" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                  <th className="p-3 border-b font-bold w-[30%]">Title</th>
                  <th className="p-3 border-b font-bold w-[30%]">Description</th>
                  <th className="p-3 border-b font-bold w-[12%]">Type</th>
                  <th className="p-3 border-b font-bold w-[12%]">Priority</th>
                  <th className="p-3 border-b font-bold w-[8%] text-center">Hours</th>
                  <th className="p-3 border-b font-bold w-[8%] text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {parsedTasks.map((task, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-blue-500/5 transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-2">
                      <input 
                        type="text" 
                        value={task.title} 
                        onChange={(e) => updateTask(i, 'title', e.target.value)}
                        className="w-full bg-transparent outline-none p-1 border border-transparent focus:border-blue-500/50 rounded"
                        style={{ color: 'var(--text)' }}
                      />
                    </td>
                    <td className="p-2">
                      <textarea 
                        value={task.description} 
                        onChange={(e) => updateTask(i, 'description', e.target.value)}
                        className="w-full bg-transparent outline-none p-1 border border-transparent focus:border-blue-500/50 rounded resize-none h-12 text-[11px]"
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </td>
                    <td className="p-2">
                      <select 
                        value={task.type} 
                        onChange={(e) => updateTask(i, 'type', e.target.value)}
                        className="w-full bg-transparent outline-none p-1 border border-transparent focus:border-blue-500/50 rounded appearance-none"
                        style={{ color: task.type === 'EPIC' ? '#a855f7' : task.type === 'BUG' ? '#ef4444' : 'var(--blue)' }}
                      >
                        <option value="EPIC">Epic</option>
                        <option value="TASK">Task</option>
                        <option value="SUBTASK">Subtask</option>
                        <option value="BUG">Bug</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select 
                        value={task.priority} 
                        onChange={(e) => updateTask(i, 'priority', e.target.value)}
                        className="w-full bg-transparent outline-none p-1 border border-transparent focus:border-blue-500/50 rounded appearance-none"
                        style={{ color: task.priority === 'CRITICAL' ? '#ef4444' : task.priority === 'HIGH' ? '#f97316' : 'var(--text)' }}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        value={task.estimated_hours} 
                        onChange={(e) => updateTask(i, 'estimated_hours', parseFloat(e.target.value))}
                        className="w-full bg-transparent outline-none p-1 border border-transparent focus:border-blue-500/50 rounded text-center"
                        style={{ color: 'var(--text)' }}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => removeTask(i)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
