import client from './client';

export const healthApi = {
  getLatestProjectHealth: async (projectId) => {
    const response = await client.get(`/api/v1/health/project/${projectId}`);
    return response.data;
  },

  getLatestSprintPrediction: async (sprintId) => {
    const response = await client.get(`/api/v1/health/sprint/${sprintId}`);
    return response.data;
  },

  triggerPrediction: async (projectId) => {
    const response = await client.post(`/api/v1/health/predict/${projectId}`);
    return response.data;
  }
};
