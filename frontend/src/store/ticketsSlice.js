/**
 * Slice de tickets (Redux Toolkit) — Módulos B/C.
 * Estado del listado, del detalle abierto y de las operaciones sobre tickets.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/client';

const qs = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

export const fetchTickets = createAsyncThunk('tickets/fetch', async (params, { rejectWithValue }) => {
  try { return await api.get(`/tickets${qs(params)}`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchTicket = createAsyncThunk('tickets/fetchOne', async (id, { rejectWithValue }) => {
  try { return await api.get(`/tickets/${id}`); }
  catch (err) { return rejectWithValue(err.message); }
});

export const createTicket = createAsyncThunk('tickets/create', async (payload, { rejectWithValue }) => {
  try { return await api.post('/tickets', payload); }
  catch (err) { return rejectWithValue(err.message); }
});

export const createEmergency = createAsyncThunk('tickets/emergency', async (payload, { rejectWithValue }) => {
  try { return await api.post('/tickets/emergency', payload); }
  catch (err) { return rejectWithValue(err.message); }
});

export const updateStatus = createAsyncThunk('tickets/updateStatus', async ({ id, status, comment }, { rejectWithValue }) => {
  try { return await api.patch(`/tickets/${id}/status`, { status, comment }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const reassignTicket = createAsyncThunk('tickets/reassign', async ({ id, assignedTo, reason }, { rejectWithValue }) => {
  try { return await api.patch(`/tickets/${id}/reassign`, { assignedTo, reason }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const addComment = createAsyncThunk('tickets/addComment', async ({ id, body }, { rejectWithValue }) => {
  try { return await api.post(`/tickets/${id}/comments`, { body }); }
  catch (err) { return rejectWithValue(err.message); }
});

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState: { list: [], detail: null, loading: false, error: null },
  reducers: {
    clearDetail(state) { state.detail = null; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTickets.fulfilled, (state, action) => { state.list = action.payload; state.loading = false; })
      .addCase(fetchTickets.rejected, (state, action) => { state.error = action.payload; state.loading = false; })
      .addCase(fetchTicket.fulfilled, (state, action) => { state.detail = action.payload; })
      .addCase(addComment.fulfilled, (state, action) => {
        if (state.detail) state.detail.comments = [...(state.detail.comments || []), action.payload];
      })
      // Tras cambiar estado o reasignar, refrescamos el ticket en la lista.
      .addCase(updateStatus.fulfilled, (state, action) => {
        state.list = state.list.map((t) => (t.id === action.payload.id ? action.payload : t));
      })
      .addCase(reassignTicket.fulfilled, (state, action) => {
        state.list = state.list.map((t) => (t.id === action.payload.id ? { ...t, ...action.payload } : t));
      });
  },
});

export const { clearDetail, clearError } = ticketsSlice.actions;
export default ticketsSlice.reducer;
