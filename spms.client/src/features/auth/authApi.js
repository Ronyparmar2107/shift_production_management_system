import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { login } from './authSlice';
import { API_URL } from '../../app/config';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL + '/api/auth'
    }),
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: '/login',
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: {
                    "EmployeeNumber": credentials.emp_id,
                    "Password": credentials.password
                }
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // console.log('Login successful:', data);
                    dispatch(login(data));
                } catch (error) {
                    console.error('Login failed:', error);
                }
            }
        })
    })
});

export const { useLoginMutation } = authApi;