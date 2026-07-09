import client from './client';

export const usersApi = {
  getMyProfile: async () => {
    const response = await client.get('/api/v1/users/me');
    return response.data;
  },

  listUsers: async () => {
    const response = await client.get('/api/v1/users/');
    return response.data;
  },
};
