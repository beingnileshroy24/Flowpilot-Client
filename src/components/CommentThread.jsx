import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '../api/comments';
import { MessageSquare, Send, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommentThread({ taskId, currentUser }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.getComments(taskId),
    enabled: !!taskId,
  });

  const createMutation = useMutation({
    mutationFn: (content) => commentsApi.createComment({ task_id: taskId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', taskId] });
      setNewComment('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate(newComment);
  };

  if (isLoading) {
    return <div className="p-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>Loading comments...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={16} className="text-blue-500" />
        <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Discussion</h4>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {comments.length === 0 ? (
          <div className="text-xs text-center py-6 italic" style={{ color: 'var(--text-muted)' }}>
            No comments yet. Start the discussion!
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3 animate-fade-in group">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                  color: '#fff',
                  boxShadow: '0 2px 6px rgba(59,130,246,0.3)'
                }}
              >
                {comment.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{comment.author_name}</span>
                    <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {currentUser?.id === comment.author_id && (
                    <button 
                      onClick={() => deleteMutation.mutate(comment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div 
                  className="p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed whitespace-pre-wrap"
                  style={{ 
                    background: 'var(--surface-solid)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text)'
                  }}
                >
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-auto shrink-0 relative">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full text-xs p-3 pr-12 rounded-xl resize-none focus:outline-none transition-all"
          style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--border)',
            color: 'var(--text)',
            boxShadow: 'var(--shadow-sm)'
          }}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || createMutation.isPending}
          className="absolute right-2 bottom-3 p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
