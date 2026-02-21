import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Song, SONGS, RECENTLY_PLAYED, MOST_PLAYED } from '../data/dummyData';
import * as FileSystem from 'expo-file-system/legacy';

export interface DownloadedSong {
    songId: string;
    localUri: string;
    downloadedAt: number;
}

interface PlayerState {
    currentSong: Song | null;
    queue: Song[];
    originalQueue: Song[]; // keeps the un-shuffled order
    isPlaying: boolean;
    shuffle: boolean;
    repeat: 'none' | 'one' | 'all';
    progress: number;        // 0-1
    currentTimeMs: number;   // current position in milliseconds
    durationMs: number;      // total duration in milliseconds
    volume: number;          // 0-1
    recentlyPlayed: Song[];
    mostPlayed: Song[];
    isBuffering: boolean;
    downloadedSongs: DownloadedSong[];
    downloadProgress: { [songId: string]: number }; // 0-1
}

const recentlyPlayedSongs = RECENTLY_PLAYED.map(id => SONGS.find(s => s.id === id)!).filter(Boolean);
const mostPlayedSongs = MOST_PLAYED.map(id => SONGS.find(s => s.id === id)!).filter(Boolean);

const initialState: PlayerState = {
    currentSong: null,
    queue: SONGS,
    originalQueue: SONGS,
    isPlaying: false,
    shuffle: false,
    repeat: 'none',
    progress: 0,
    currentTimeMs: 0,
    durationMs: 0,
    volume: 1,
    recentlyPlayed: recentlyPlayedSongs,
    mostPlayed: mostPlayedSongs,
    isBuffering: false,
    downloadedSongs: [],
    downloadProgress: {},
};

// Fisher-Yates shuffle keeping currentSong at index 0
function shuffleArray(arr: Song[], currentSong: Song | null): Song[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (currentSong) {
        const idx = shuffled.findIndex(s => s.id === currentSong.id);
        if (idx > 0) {
            [shuffled[0], shuffled[idx]] = [shuffled[idx], shuffled[0]];
        }
    }
    return shuffled;
}

// Download a song for offline listening
export const downloadSong = createAsyncThunk(
    'player/downloadSong',
    async (song: Song, { dispatch }) => {
        if (!song.url || song.url.trim() === '') {
            throw new Error('No download URL');
        }

        const dir = FileSystem.documentDirectory + 'downloads/';
        const dirInfo = await FileSystem.getInfoAsync(dir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        }

        const ext = song.url.includes('.mp4') ? '.mp4' : '.mp3';
        const localUri = dir + song.id + ext;

        const downloadResumable = FileSystem.createDownloadResumable(
            song.url,
            localUri,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                dispatch(setDownloadProgress({ songId: song.id, progress }));
            }
        );

        const result = await downloadResumable.downloadAsync();
        if (!result) throw new Error('Download failed');

        return {
            songId: song.id,
            localUri: result.uri,
            downloadedAt: Date.now(),
        } as DownloadedSong;
    }
);

const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        setCurrentSong: (state, action: PayloadAction<Song>) => {
            state.currentSong = action.payload;
            state.isPlaying = true;
            state.progress = 0;
            state.currentTimeMs = 0;
            state.isBuffering = true;
        },
        setQueue: (state, action: PayloadAction<Song[]>) => {
            state.originalQueue = action.payload;
            if (state.shuffle) {
                state.queue = shuffleArray(action.payload, state.currentSong);
            } else {
                state.queue = action.payload;
            }
        },
        togglePlay: (state) => {
            state.isPlaying = !state.isPlaying;
        },
        setIsPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        toggleShuffle: (state) => {
            state.shuffle = !state.shuffle;
            if (state.shuffle) {
                state.queue = shuffleArray(state.originalQueue, state.currentSong);
            } else {
                state.queue = [...state.originalQueue];
            }
        },
        toggleRepeat: (state) => {
            const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
            const idx = modes.indexOf(state.repeat);
            state.repeat = modes[(idx + 1) % modes.length];
        },
        setProgress: (state, action: PayloadAction<number>) => {
            state.progress = action.payload;
        },
        updatePlaybackStatus: (state, action: PayloadAction<{
            positionMillis: number;
            durationMillis: number;
            isPlaying: boolean;
            isBuffering: boolean;
        }>) => {
            const { positionMillis, durationMillis, isPlaying, isBuffering } = action.payload;
            state.currentTimeMs = positionMillis;
            state.durationMs = durationMillis;
            state.progress = durationMillis > 0 ? positionMillis / durationMillis : 0;
            state.isPlaying = isPlaying;
            state.isBuffering = isBuffering;
        },
        setVolume: (state, action: PayloadAction<number>) => {
            state.volume = action.payload;
        },
        playNext: (state) => {
            if (!state.currentSong || state.queue.length === 0) return;
            const idx = state.queue.findIndex(s => s.id === state.currentSong!.id);
            if (idx === state.queue.length - 1) {
                // Last song
                if (state.repeat === 'all') {
                    state.currentSong = state.queue[0];
                    state.progress = 0;
                    state.currentTimeMs = 0;
                    state.isPlaying = true;
                    state.isBuffering = true;
                } else if (state.repeat === 'none') {
                    state.isPlaying = false;
                }
            } else {
                state.currentSong = state.queue[idx + 1];
                state.progress = 0;
                state.currentTimeMs = 0;
                state.isPlaying = true;
                state.isBuffering = true;
            }
        },
        playPrev: (state) => {
            if (!state.currentSong || state.queue.length === 0) return;
            // If past 3 seconds, restart current song
            if (state.currentTimeMs > 3000) {
                state.progress = 0;
                state.currentTimeMs = 0;
                return;
            }
            const idx = state.queue.findIndex(s => s.id === state.currentSong!.id);
            const prevIdx = (idx - 1 + state.queue.length) % state.queue.length;
            state.currentSong = state.queue[prevIdx];
            state.progress = 0;
            state.currentTimeMs = 0;
            state.isPlaying = true;
            state.isBuffering = true;
        },
        setDownloadProgress: (state, action: PayloadAction<{ songId: string; progress: number }>) => {
            state.downloadProgress[action.payload.songId] = action.payload.progress;
        },
        removeDownloadProgress: (state, action: PayloadAction<string>) => {
            delete state.downloadProgress[action.payload];
        },
        addDownloadedSong: (state, action: PayloadAction<DownloadedSong>) => {
            const exists = state.downloadedSongs.find(d => d.songId === action.payload.songId);
            if (!exists) {
                state.downloadedSongs.push(action.payload);
            }
        },
        removeDownloadedSong: (state, action: PayloadAction<string>) => {
            state.downloadedSongs = state.downloadedSongs.filter(d => d.songId !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(downloadSong.fulfilled, (state, action) => {
                const exists = state.downloadedSongs.find(d => d.songId === action.payload.songId);
                if (!exists) {
                    state.downloadedSongs.push(action.payload);
                }
                delete state.downloadProgress[action.payload.songId];
            })
            .addCase(downloadSong.rejected, (state, action) => {
                const songId = action.meta.arg.id;
                delete state.downloadProgress[songId];
            });
    },
});

export const {
    setCurrentSong,
    setQueue,
    togglePlay,
    setIsPlaying,
    toggleShuffle,
    toggleRepeat,
    setProgress,
    updatePlaybackStatus,
    setVolume,
    playNext,
    playPrev,
    setDownloadProgress,
    removeDownloadProgress,
    addDownloadedSong,
    removeDownloadedSong,
} = playerSlice.actions;

export default playerSlice.reducer;
