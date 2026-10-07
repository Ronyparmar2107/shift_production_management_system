import { createSlice } from '@reduxjs/toolkit';
import { isTokenExpired } from './jwt';

let sessionData = localStorage.getItem('sessionData');
if (sessionData) {
    sessionData = JSON.parse(sessionData);
    // Token lives 8 hours; if the stored one is dead, start signed out.
    if (isTokenExpired(sessionData?.token)) {
        localStorage.removeItem('sessionData');
        sessionData = null;
    }
}

const initialState = {
    token: sessionData?.token ?? null,
    isAuthenticated: sessionData?.isAuthenticated ?? false,
    userId: sessionData?.userId ?? null,
    loading: false,
    role: sessionData?.role ?? null,
    name: sessionData?.name ?? null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action) => {
            state.isAuthenticated = true;
            state.userId = action.payload.employeeId;
            state.name = action.payload.name;
            state.role = action.payload.role;
            state.token = action.payload.token;

            let sessionData = {
                isAuthenticated: true,
                userId: action.payload.employeeId,
                name: action.payload.name,
                role: action.payload.role,
                token: action.payload.token
            };
            localStorage.setItem('sessionData', JSON.stringify(sessionData));
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.userId = null;
            state.role = null;
            state.token = null;
            state.name = null;
            localStorage.removeItem('sessionData');
        }
    }
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
