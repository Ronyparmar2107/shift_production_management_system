import { configureStore } from '@reduxjs/toolkit';

import authSlice from '../features/auth/authSlice';
import { authApi } from '../features/auth/authApi';
import { areaApi } from '../features/area/areaApi';
import { employeeApi } from '../features/employee/employeeApi';
import { roleApi } from '../features/role/roleApi';
import { crewApi } from '../features/crew/crewApi';
import { planApi } from '../features/plan/planApi';
import { planTypeApi } from '../features/planType/planTypeApi';


export const store = configureStore({
    reducer: {
        // Add your reducers here
        auth: authSlice,
        [authApi.reducerPath]: authApi.reducer,
        [areaApi.reducerPath]: areaApi.reducer,
        [employeeApi.reducerPath]: employeeApi.reducer,
        [roleApi.reducerPath]: roleApi.reducer,
        [crewApi.reducerPath]: crewApi.reducer,
        [planApi.reducerPath]: planApi.reducer,
        [planTypeApi.reducerPath]: planTypeApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware,
            areaApi.middleware,
            employeeApi.middleware,
            roleApi.middleware,
            crewApi.middleware,
            planApi.middleware,
            planTypeApi.middleware
        )
});
