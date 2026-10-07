import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '../../app/baseQuery';

//   GET /api/Role/GetAllRoles -> [{ roleId, role }]
export const roleApi = createApi({
    reducerPath: 'roleApi',
    baseQuery: baseQueryWithAuth('/api/Role'),
    endpoints: (builder) => ({
        getAllRoles: builder.query({
            query: () => '/GetAllRoles',
        }),
    }),
});

export const { useGetAllRolesQuery } = roleApi;
