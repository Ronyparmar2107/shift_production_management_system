import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '../../app/baseQuery';

//   GET  /api/Actuals/GetMyPlans
//        -> [{ planId, planType, unit, area, shiftDate, shiftType, plannedStart, plannedEnd, target,
//              expected, actual, varianceUnits, variancePct, status, projectedEnd, projectedShortfall,
//              lastLoggedAt, minutesSinceUpdate }]
//   POST /api/Actuals/Log  body: { planId, value, readingTime, comment }
//        -> { saved, reasonRequired, message, status }   (reasonRequired = nothing saved, ask for a comment)
export const actualsApi = createApi({
    reducerPath: 'actualsApi',
    baseQuery: baseQueryWithAuth('/api/Actuals'),
    tagTypes: ['Actuals'],
    endpoints: (builder) => ({
        getMyActuals: builder.query({
            query: () => '/GetMyPlans',
            providesTags: ['Actuals'],
        }),
        logActual: builder.mutation({
            query: (body) => ({ url: '/Log', method: 'POST', body }),
            invalidatesTags: (result) => (result?.saved ? ['Actuals'] : []),
        }),
    }),
});

export const { useGetMyActualsQuery, useLogActualMutation } = actualsApi;
