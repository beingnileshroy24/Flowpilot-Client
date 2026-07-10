import client from './client';

export const commentsApi = {
  getComments: async (taskId) => {
    const response = await client.get(`/api/v1/comments/`, { params: { task_id: taskId } });
    return response.data;
  },

  createComment: async (payload) => {
    const response = await client.post('/api/v1/comments/', payload);
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await client.delete(`/api/v1/comments/${commentId}`);
    return response.data;
  },
};
