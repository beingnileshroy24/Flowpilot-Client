import client from './client';

export const fetchDuplicateScreening = async (data) => {
  const response = await client.post('/api/v1/ai/check-duplicates', data);
  return response.data;
};
