import client from './client';

export const projectsApi = {
  getProjects: async () => {
    const response = await client.get('/api/v1/projects/');
    return response.data;
  },

  createProject: async (payload) => {
    const response = await client.post('/api/v1/projects/', payload);
    return response.data;
  },

  getProject: async (projectId) => {
    const response = await client.get(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  updateProject: async ({ projectId, payload }) => {
    const response = await client.patch(`/api/v1/projects/${projectId}`, payload);
    return response.data;
  },
};
