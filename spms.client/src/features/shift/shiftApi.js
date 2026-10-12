import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '../../app/baseQuery';

//   GET  /api/Shift/Overview?date=YYYY-MM-DD&shiftType=Morning
//        -> { shiftId, date, shiftType, status: 'NotStarted'|'Running'|'Ended', startedAt, endedAt, startedByName, plans: [PlanStatus] }
//   POST /api/Shift/Start  body: { date, shiftType }
//   POST /api/Shift/End    body: { id }          (id = shiftId from the overview)
//   GET  /api/Shift/Dashboard?date=&shiftType=
//        -> { current: { shiftId, date, shiftType, status, startedAt, endedAt, startedByName, summary: {total, accepted, pending, green, yellow, red, stale, notStarted}, rows: [...] },
//             previous: [same shape, the last two shifts that had plans] }
// Start and End return the same overview shape, so the screen updates from the response.
export const shiftApi = createApi({
    reducerPath: 'shiftApi',
    baseQuery: baseQueryWithAuth('/api/Shift'),
    tagTypes: ['Shift'],
    endpoints: (builder) => ({
        getShiftOverview: builder.query({
            query: ({ date, shiftType }) => ({ url: '/Overview', params: { date, shiftType } }),
            providesTags: ['Shift'],
        }),
        getDashboard: builder.query({
            query: ({ date, shiftType }) => ({ url: '/Dashboard', params: { date, shiftType } }),
            providesTags: ['Shift'],
        }),
        startShift: builder.mutation({
            query: (body) => ({ url: '/Start', method: 'POST', body }),
            invalidatesTags: ['Shift'],
        }),
        endShift: builder.mutation({
            query: (body) => ({ url: '/End', method: 'POST', body }),
            invalidatesTags: ['Shift'],
        }),
    }),
});

export const {
    useGetShiftOverviewQuery,
    useGetDashboardQuery,
    useStartShiftMutation,
    useEndShiftMutation,
} = shiftApi;
