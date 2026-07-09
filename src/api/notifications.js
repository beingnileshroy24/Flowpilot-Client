import client from './client';

export const notificationsApi = {
  getNotifications: async () => {
    const response = await client.get('/api/v1/notifications/');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await client.post(`/api/v1/notifications/${notificationId}/read`);
    return response.data;
  },
};
