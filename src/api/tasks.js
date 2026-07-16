import client from './client';

export const tasksApi = {
  getTasks: async (projectId) => {
    const params = {};
    if (projectId) params.project_id = projectId;
    const response = await client.get('/api/v1/tasks/', { params });
    return response.data;
  },

  createTask: async (payload) => {
    const response = await client.post('/api/v1/tasks/', payload);
    return response.data;
  },

  updateTaskStatus: async (taskId, status) => {
    const response = await client.patch(`/api/v1/tasks/${taskId}/status`, null, {
      params: { current_status: status },
    });
    return response.data;
  },

  updateTaskDetails: async (taskId, payload) => {
    const response = await client.patch(`/api/v1/tasks/${taskId}`, payload);
    return response.data;
  },

  deleteTask: async (taskId) => {
    const response = await client.delete(`/api/v1/tasks/${taskId}`);
    return response.data;
  },

  bulkUpdateTaskStatus: async ({ taskIds, status }) => {
    const response = await client.post('/api/v1/tasks/bulk-status', { task_ids: taskIds, status });
    return response.data;
  },

  bulkDeleteTasks: async ({ taskIds }) => {
    const response = await client.post('/api/v1/tasks/bulk-delete', { task_ids: taskIds });
    return response.data;
  },

  uploadAttachment: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/api/v1/tasks/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
