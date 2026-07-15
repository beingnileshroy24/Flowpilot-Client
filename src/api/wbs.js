import client from './client';

export const wbsApi = {
  commitWbs: async (payload) => {
    const response = await client.post('/api/v1/ai/wbs/commit', payload);
    return response.data;
  },

  generateWbsStream: async ({ projectId, file, onChunk, onStatus, onError, onComplete }) => {
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('file', file);

      const token = sessionStorage.getItem('flowpilot_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${baseUrl}/api/v1/ai/wbs/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep the last incomplete chunk in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr) {
                const data = JSON.parse(dataStr);
                
                if (data.status) {
                  if (onStatus) onStatus(data.status);
                } else if (data.chunk) {
                  if (onChunk) onChunk(data.chunk);
                } else if (data.error) {
                  if (onError) onError(new Error(data.error));
                }
              }
            } catch (err) {
              console.warn('Error parsing SSE chunk:', err, line);
            }
          }
        }
      }
      
      if (onComplete) onComplete();
    } catch (error) {
      if (onError) onError(error);
    }
  }
};
