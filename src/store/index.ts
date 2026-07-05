/**
 * Redux Store — Root store configuration for ZYNC LOG.
 *
 * Configures the RTK store with the dashboard API middleware.
 * Wrap the app root with <Provider store={store}> to enable
 * RTK Query caching and the useSelector / useDispatch hooks.
 */

import { configureStore } from '@reduxjs/toolkit';
import { dashboardApi } from '../features/dashboard/services/dashboardService';

// Assemble the root Redux store with RTK Query middleware injected
export const store = configureStore({
  reducer: {
    // RTK Query auto-generates a reducer keyed by the API slice's reducerPath
    [dashboardApi.reducerPath]: dashboardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    // RTK Query middleware handles cache invalidation, polling, and tag management
    getDefaultMiddleware().concat(dashboardApi.middleware),
});

// Infer root state and dispatch types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
