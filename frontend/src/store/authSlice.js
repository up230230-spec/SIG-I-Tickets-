/**
 * Slice de autenticación (Redux Toolkit).
 * Reemplaza el estado que antes vivía en AuthContext: usuario actual, carga
 * inicial y errores. El token JWT se sigue guardando en localStorage.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/client';

const TOKEN_KEY = 'sigi_token';

// Carga el usuario actual a partir del token guardado (al arrancar la app).
export const loadMe = createAsyncThunk('auth/loadMe', async (_, { rejectWithValue }) => {
  if (!localStorage.getItem(TOKEN_KEY)) return rejectWithValue(null);
  try {
    return await api.get('/auth/me');
  } catch (err) {
    localStorage.removeItem(TOKEN_KEY);
    return rejectWithValue(err.message);
  }
});

// Inicia sesión: guarda el token y devuelve el usuario.
export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { token, user } = await api.post('/auth/login', { email, password }, { auth: false });
    localStorage.setItem(TOKEN_KEY, token);
    return user;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Registro (en desarrollo devuelve token+user → auto-login).
export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', payload, { auth: false });
    if (res.token) localStorage.setItem(TOKEN_KEY, res.token);
    return res;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: true, error: null },
  reducers: {
    logout(state) {
      localStorage.removeItem(TOKEN_KEY);
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMe.fulfilled, (state, action) => { state.user = action.payload; state.loading = false; })
      .addCase(loadMe.rejected, (state) => { state.user = null; state.loading = false; })
      .addCase(login.pending, (state) => { state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.user = action.payload; })
      .addCase(login.rejected, (state, action) => { state.error = action.payload; })
      .addCase(register.fulfilled, (state, action) => {
        if (action.payload.token) state.user = action.payload.user;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
