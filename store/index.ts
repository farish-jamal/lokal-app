import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import libraryReducer from './slices/librarySlice';

export const store = configureStore({
    reducer: {
        player: playerReducer,
        library: libraryReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
