import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '../../app/baseQuery';

//   GET  /api/Plan/GetMyPlans   -> [{ planId, date, shiftType, crewName, leadName, area, planType, unit, target, startTime, endTime, comment, status, acceptedByName, acceptedAt, createdAt }]
//   GET  /api/Plan/GetCrewPlans -> same shape as GetMyPlans, for the signed-in crew lead's crew
//   POST /api/Plan/AcceptPlan   body: plan fields (only id is used)
//   POST /api/Plan/UpdateAndAccept body: { id, area, planType, target, startTime, endTime, comment }
//   POST /api/Plan/CreatePlan   body: { date, shiftType, crewLeadId, area, planType, target, startTime, endTime, comment }
export const planApi = createApi({
    reducerPath: 'planApi',
    baseQuery: baseQueryWithAuth('/api/Plan'),
    tagTypes: ['Plan'],
    endpoints: (builder) => ({
        getMyPlans: builder.query({
            query: () => '/GetMyPlans',
            providesTags: ['Plan'],
        }),
        getCrewPlans: builder.query({
            query: () => '/GetCrewPlans',
            providesTags: ['Plan'],
        }),
        acceptPlan: builder.mutation({
            query: (body) => ({ url: '/AcceptPlan', method: 'POST', body }),
            invalidatesTags: ['Plan'],
        }),
        updateAndAcceptPlan: builder.mutation({
            query: (body) => ({ url: '/UpdateAndAccept', method: 'POST', body }),
            invalidatesTags: ['Plan'],
        }),
        createPlan: builder.mutation({
            query: (body) => ({ url: '/CreatePlan', method: 'POST', body }),
            invalidatesTags: ['Plan'],
        }),
    }),
});

export const {
    useGetMyPlansQuery,
    useGetCrewPlansQuery,
    useAcceptPlanMutation,
    useUpdateAndAcceptPlanMutation,
    useCreatePlanMutation,
} = planApi;
