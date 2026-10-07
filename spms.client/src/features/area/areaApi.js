import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '../../app/baseQuery';

// Backend action names drop the "Async" suffix in routes (ASP.NET Core default):
//   GET  /api/Area/GetAllArea
//   POST /api/Area/CreateArea   body: { areaName }
//   POST /api/Area/UpdateArea   body: { areaId, areaName }
export const areaApi = createApi({
    reducerPath: 'areaApi',
    baseQuery: baseQueryWithAuth('/api/Area'),
    tagTypes: ['Area'],
    endpoints: (builder) => ({
        getAllAreas: builder.query({
            query: () => '/GetAllArea',
            providesTags: ['Area'],
        }),
        createArea: builder.mutation({
            query: (body) => ({ url: '/CreateArea', method: 'POST', body }),
            invalidatesTags: ['Area'],
        }),
        updateArea: builder.mutation({
            query: (body) => ({ url: '/UpdateArea', method: 'POST', body }),
            invalidatesTags: ['Area'],
        }),
    }),
});

export const {
    useGetAllAreasQuery,
    useCreateAreaMutation,
    useUpdateAreaMutation,
} = areaApi;
