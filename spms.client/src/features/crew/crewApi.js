import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '../../app/baseQuery';

//   GET  /api/Crew/GetAllCrews   -> [{ crewId, crewName, leadEmpId, leadName, leadEmployeeNumber }]
//   GET  /api/Crew/GetCrewLeads  -> [{ empId, name, employeeNumber, crewId }]  (crewId = crew they already lead)
//   POST /api/Crew/CreateCrew    body: { leadEmpId }
//   POST /api/Crew/UpdateCrew    body: { crewId, leadEmpId }
//   POST /api/Crew/DeleteCrew    body: { crewId }
export const crewApi = createApi({
    reducerPath: 'crewApi',
    baseQuery: baseQueryWithAuth('/api/Crew'),
    tagTypes: ['Crew'],
    endpoints: (builder) => ({
        getAllCrews: builder.query({
            query: () => '/GetAllCrews',
            providesTags: ['Crew'],
        }),
        getCrewLeads: builder.query({
            query: () => '/GetCrewLeads',
            providesTags: ['Crew'],
        }),
        createCrew: builder.mutation({
            query: (body) => ({ url: '/CreateCrew', method: 'POST', body }),
            invalidatesTags: ['Crew'],
        }),
        updateCrew: builder.mutation({
            query: (body) => ({ url: '/UpdateCrew', method: 'POST', body }),
            invalidatesTags: ['Crew'],
        }),
        deleteCrew: builder.mutation({
            query: (body) => ({ url: '/DeleteCrew', method: 'POST', body }),
            invalidatesTags: ['Crew'],
        }),
    }),
});

export const {
    useGetAllCrewsQuery,
    useGetCrewLeadsQuery,
    useCreateCrewMutation,
    useUpdateCrewMutation,
    useDeleteCrewMutation,
} = crewApi;
