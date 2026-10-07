import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../features/auth/authSlice';

// Shared base query for every authenticated API slice:
//  - attaches the JWT as a Bearer token
//  - on a 401 (token expired/invalid) clears the session, which sends the user back to Sign In
// Usage: baseQuery: baseQueryWithAuth('/api/plan')
export const baseQueryWithAuth = (pathPrefix = '') => {
    const rawBaseQuery = fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL + pathPrefix,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) headers.set('Authorization', `Bearer ${token}`);
            return headers;
        },
    });

    return async (args, api, extraOptions) => {
        const result = await rawBaseQuery(args, api, extraOptions);

        console.log('baseQueryWithAuth result:', result); // Debugging line
        if (result.error?.status === 401) {
            api.dispatch(logout());
        }
        return result;
    };
};
