import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '../../app/baseQuery';

//   GET  /api/PlanType/GetAllPlanTypes -> [{ planTypeId, type, unit }]
//   POST /api/PlanType/CreatePlanType  body: { type, unit }
//   POST /api/PlanType/UpdatePlanType  body: { planTypeId, type, unit }
//   POST /api/PlanType/DeletePlanType  body: { planTypeId }
export const planTypeApi = createApi({
    reducerPath: 'planTypeApi',
    baseQuery: baseQueryWithAuth('/api/PlanType'),
    tagTypes: ['PlanType'],
    endpoints: (builder) => ({
        getAllPlanTypes: builder.query({
            query: () => '/GetAllPlanTypes',
            providesTags: ['PlanType'],
        }),
        createPlanType: builder.mutation({
            query: (body) => ({ url: '/CreatePlanType', method: 'POST', body }),
            invalidatesTags: ['PlanType'],
        }),
        updatePlanType: builder.mutation({
            query: (body) => ({ url: '/UpdatePlanType', method: 'POST', body }),
            invalidatesTags: ['PlanType'],
        }),
        deletePlanType: builder.mutation({
            query: (body) => ({ url: '/DeletePlanType', method: 'POST', body }),
            invalidatesTags: ['PlanType'],
        }),
    }),
});

export const {
    useGetAllPlanTypesQuery,
    useCreatePlanTypeMutation,
    useUpdatePlanTypeMutation,
    useDeletePlanTypeMutation,
} = planTypeApi;
