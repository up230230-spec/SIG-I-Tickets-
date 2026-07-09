/**
 * Slice de dashboards (Redux Toolkit) — Módulo D.
 * Datos de los paneles global/ejecutivo y del mapa de calor.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/client';

export const fetchGlobal = createAsyncThunk('dashboard/global', async (_, { rejectWithValue }) => {
  try { return await api.get('/dashboard/global'); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchHeatmap = createAsyncThunk('dashboard/heatmap', async (_, { rejectWithValue }) => {
  try { return await api.get('/dashboard/heatmap'); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchExecutive = createAsyncThunk('dashboard/executive', async (_, { rejectWithValue }) => {
  try { return await api.get('/dashboard/executive'); }
  catch (err) { return rejectWithValue(err.message); }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { global: null, heatmap: [], executive: null, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobal.fulfilled, (state, action) => { state.global = action.payload; state.error = null; })
      .addCase(fetchGlobal.rejected, (state, action) => { state.error = action.payload; })
      .addCase(fetchHeatmap.fulfilled, (state, action) => { state.heatmap = action.payload; })
      .addCase(fetchExecutive.fulfilled, (state, action) => { state.executive = action.payload; state.error = null; })
      .addCase(fetchExecutive.rejected, (state, action) => { state.error = action.payload; });
  },
});

export default dashboardSlice.reducer;
