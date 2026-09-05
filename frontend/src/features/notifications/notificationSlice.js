import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const id = Date.now().toString();
      const notification = {
        id,
        type: action.payload.type || "info", // 'success' | 'error' | 'warning' | 'info'
        message: action.payload.message || "",
        duration: action.payload.duration || 4000,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, clearNotifications } =
  notificationSlice.actions;

export const selectNotifications = (state) => state.notifications.notifications;

export default notificationSlice.reducer;
