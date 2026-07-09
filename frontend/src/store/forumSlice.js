/**
 * Slice del foro (Redux Toolkit) — Módulo E.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/client';

export const fetchPosts = createAsyncThunk('forum/fetch', async (category, { rejectWithValue }) => {
  try { return await api.get(`/forum${category ? `?category=${category}` : ''}`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchPost = createAsyncThunk('forum/fetchOne', async (id, { rejectWithValue }) => {
  try { return await api.get(`/forum/${id}`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const createPost = createAsyncThunk('forum/create', async (payload, { rejectWithValue }) => {
  try { return await api.post('/forum', payload); }
  catch (err) { return rejectWithValue(err.message); }
});

export const addReply = createAsyncThunk('forum/reply', async ({ id, ...body }, { rejectWithValue }) => {
  try { return await api.post(`/forum/${id}/replies`, body); }
  catch (err) { return rejectWithValue(err.message); }
});

export const moderatePost = createAsyncThunk('forum/moderate', async ({ id, patch }, { rejectWithValue }) => {
  try { return await api.patch(`/forum/${id}/moderate`, patch); }
  catch (err) { return rejectWithValue(err.message); }
});

export const deletePost = createAsyncThunk('forum/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(`/forum/${id}`); return id; }
  catch (err) { return rejectWithValue(err.message); }
});

const forumSlice = createSlice({
  name: 'forum',
  initialState: { posts: [], detail: null, error: null },
  reducers: {
    clearDetail(state) { state.detail = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.fulfilled, (state, action) => { state.posts = action.payload; state.error = null; })
      .addCase(fetchPosts.rejected, (state, action) => { state.error = action.payload; })
      .addCase(fetchPost.fulfilled, (state, action) => { state.detail = action.payload; })
      .addCase(addReply.fulfilled, (state, action) => {
        if (state.detail) state.detail.replies = [...(state.detail.replies || []), action.payload];
      })
      .addCase(moderatePost.fulfilled, (state, action) => {
        if (state.detail) state.detail = { ...state.detail, ...action.payload };
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.detail = null;
        state.posts = state.posts.filter((p) => p.id !== action.payload);
      });
  },
});

export const { clearDetail } = forumSlice.actions;
export default forumSlice.reducer;
