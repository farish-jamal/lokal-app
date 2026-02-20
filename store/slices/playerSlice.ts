import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Song, SONGS, RECENTLY_PLAYED, MOST_PLAYED } from '../data/dummyData';

interface PlayerState {
    currentSong: Song | null;
    queue: Song[];
    isPlaying: boolean;
    shuffle: boolean;
    repeat: 'none' | 'one' | 'all';
    progress: number; // 0-1
    volume: number;   // 0-1
    recentlyPlayed: Song[];
    mostPlayed: Song[];
}

const recentlyPlayedSongs = RECENTLY_PLAYED.map(id => SONGS.find(s => s.id === id)!).filter(Boolean);
const mostPlayedSongs = MOST_PLAYED.map(id => SONGS.find(s => s.id === id)!).filter(Boolean);

const initialState: PlayerState = {
    currentSong: null,
    queue: SONGS,
    isPlaying: false,
    shuffle: false,
    repeat: 'none',
    progress: 0,
    volume: 1,
    recentlyPlayed: recentlyPlayedSongs,
    mostPlayed: mostPlayedSongs,
};

const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        setCurrentSong: (state, action: PayloadAction<Song>) => {
            state.currentSong = action.payload;
            state.isPlaying = true;
            state.progress = 0;
        },
        togglePlay: (state) => {
            state.isPlaying = !state.isPlaying;
        },
        setIsPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        toggleShuffle: (state) => {
            state.shuffle = !state.shuffle;
        },
        toggleRepeat: (state) => {
            const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
            const idx = modes.indexOf(state.repeat);
            state.repeat = modes[(idx + 1) % modes.length];
        },
        setProgress: (state, action: PayloadAction<number>) => {
            state.progress = action.payload;
        },
        setVolume: (state, action: PayloadAction<number>) => {
            state.volume = action.payload;
        },
        playNext: (state) => {
            if (!state.currentSong) return;
            const idx = state.queue.findIndex(s => s.id === state.currentSong!.id);
            const nextIdx = (idx + 1) % state.queue.length;
            state.currentSong = state.queue[nextIdx];
            state.progress = 0;
        },
        playPrev: (state) => {
            if (!state.currentSong) return;
            const idx = state.queue.findIndex(s => s.id === state.currentSong!.id);
            const prevIdx = (idx - 1 + state.queue.length) % state.queue.length;
            state.currentSong = state.queue[prevIdx];
            state.progress = 0;
        },
    },
});

export const {
    setCurrentSong,
    togglePlay,
    setIsPlaying,
    toggleShuffle,
    toggleRepeat,
    setProgress,
    setVolume,
    playNext,
    playPrev,
} = playerSlice.actions;

export default playerSlice.reducer;
