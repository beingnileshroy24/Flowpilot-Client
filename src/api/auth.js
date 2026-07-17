import client from './client';

export const authApi = {
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await client.post('/api/v1/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  signup: async (payload) => {
    const response = await client.post('/api/v1/auth/signup', payload);
    return response.data;
  },

  logout: async () => {
    const response = await client.post('/api/v1/auth/logout');
    return response.data;
  },
};
