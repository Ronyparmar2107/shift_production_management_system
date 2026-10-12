import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '../../app/baseQuery';
import { shiftApi } from '../shift/shiftApi';

//   GET  /api/Plan/GetMyPlans   -> [{ planId, date, shiftType, crewName, leadName, area, planType, unit, target, startTime, endTime, comment,
//                                      status: 'Pending'|'Accepted'|'Updated', createdByName, acceptedByName, acceptedAt, updatedByName, updatedAt, createdAt }]
//   POST /api/Plan/AcceptPlan   body: plan fields (only id is used)         (supervisor, shift must be running)
//   POST /api/Plan/UpdateAndAccept body: { id, area, planType, target, startTime, endTime, comment }
//   POST /api/Plan/CreatePlan   body: { date, shiftType, crewLeadId, area, planType, target, startTime, endTime, comment }
export const planApi = createApi({
    reducerPath: 'planApi',
    baseQuery: baseQueryWithAuth('/api/Plan'),
    tagTypes: ['Plan'],
    endpoints: (builder) => {
        // The supervisor's shift screen is served by the shift API, so refresh it after any plan change
        const refreshShift = async (arg, { dispatch, queryFulfilled }) => {
            try {
                await queryFulfilled;
                dispatch(shiftApi.util.invalidateTags(['Shift']));
            } catch {
                // the error is shown by the caller
            }
        };

        return {
            getMyPlans: builder.query({
                query: () => '/GetMyPlans',
                providesTags: ['Plan'],
            }),
            acceptPlan: builder.mutation({
                query: (body) => ({ url: '/AcceptPlan', method: 'POST', body }),
                invalidatesTags: ['Plan'],
                onQueryStarted: refreshShift,
            }),
            updateAndAcceptPlan: builder.mutation({
                query: (body) => ({ url: '/UpdateAndAccept', method: 'POST', body }),
                invalidatesTags: ['Plan'],
                onQueryStarted: refreshShift,
            }),
            createPlan: builder.mutation({
                query: (body) => ({ url: '/CreatePlan', method: 'POST', body }),
                invalidatesTags: ['Plan'],
                onQueryStarted: refreshShift,
            }),
        };
    },
});

export const {
    useGetMyPlansQuery,
    useAcceptPlanMutation,
    useUpdateAndAcceptPlanMutation,
    useCreatePlanMutation,
} = planApi;
