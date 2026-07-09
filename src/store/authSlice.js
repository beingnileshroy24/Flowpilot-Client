import { createSlice } from '@reduxjs/toolkit';

const getInitialToken = () => {
  return sessionStorage.getItem('flowpilot_token');
};

const getInitialUser = () => {
  const userJson = sessionStorage.getItem('flowpilot_user');
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
  return null;
};

const initialState = {
  token: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: !!getInitialToken(),
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      sessionStorage.setItem('flowpilot_token', token);
      sessionStorage.setItem('flowpilot_user', JSON.stringify(user));
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      sessionStorage.setItem('flowpilot_user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      sessionStorage.removeItem('flowpilot_token');
      sessionStorage.removeItem('flowpilot_user');
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
