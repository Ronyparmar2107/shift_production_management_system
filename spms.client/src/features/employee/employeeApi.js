import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '../../app/baseQuery';

// Routes (ASP.NET drops the "Async" suffix from action names):
//   GET  /api/Employee/GetAllEmployees   -> [{ id, name, role, employeeNumber, isActive }]
//   POST /api/Employee/CreateEmployee    body: { name, roleId }
//   POST /api/Employee/UpdateEmployee    body: { id, name, roleId, isActive, isDeleted }   <-- not built yet
// Delete is a soft delete: UpdateEmployee with isDeleted = true (UpdateEmployeeDto already has the flag).
export const employeeApi = createApi({
    reducerPath: 'employeeApi',
    baseQuery: baseQueryWithAuth('/api/Employee'),
    tagTypes: ['Employee'],
    endpoints: (builder) => ({
        getAllEmployees: builder.query({
            query: () => '/GetAllEmployees',
            providesTags: ['Employee'],
        }),
        createEmployee: builder.mutation({
            query: (body) => ({ url: '/CreateEmployee', method: 'POST', body }),
            invalidatesTags: ['Employee'],
        }),
        updateEmployee: builder.mutation({
            query: (body) => ({ url: '/UpdateEmployee', method: 'POST', body }),
            invalidatesTags: ['Employee'],
        }),
    }),
});

export const {
    useGetAllEmployeesQuery,
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
} = employeeApi;
