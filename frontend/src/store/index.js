/**
 * Store central de Redux (Redux Toolkit).
 * Combina los slices de la aplicación: auth, tickets, foro y dashboards.
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ticketsReducer from './ticketsSlice';
import forumReducer from './forumSlice';
import dashboardReducer from './dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketsReducer,
    forum: forumReducer,
    dashboard: dashboardReducer,
  },
});
