import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Song, SONGS, RECENTLY_PLAYED, MOST_PLAYED } from '../data/dummyData';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = '@mume_queue';
const QUEUE_META_KEY = '@mume_queue_meta'; // currentSong id, shuffle, repeat

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
    queueLoaded: boolean;
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
    queueLoaded: false,
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

// ─── Persistence thunks ──────────────────────────────────────────────────────

export const saveQueueToStorage = createAsyncThunk(
    'player/saveQueueToStorage',
    async (_, { getState }) => {
        const state = (getState() as any).player as PlayerState;
        try {
            await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(state.queue));
            await AsyncStorage.setItem(QUEUE_META_KEY, JSON.stringify({
                currentSongId: state.currentSong?.id || null,
                originalQueue: state.originalQueue,
                shuffle: state.shuffle,
                repeat: state.repeat,
            }));
        } catch (e) {
            console.error('Failed to save queue:', e);
        }
    }
);

export const loadQueueFromStorage = createAsyncThunk(
    'player/loadQueueFromStorage',
    async () => {
        try {
            const [queueJson, metaJson] = await Promise.all([
                AsyncStorage.getItem(QUEUE_STORAGE_KEY),
                AsyncStorage.getItem(QUEUE_META_KEY),
            ]);

            const queue: Song[] = queueJson ? JSON.parse(queueJson) : [];
            const meta = metaJson ? JSON.parse(metaJson) : {};

            return {
                queue,
                originalQueue: meta.originalQueue || queue,
                currentSongId: meta.currentSongId as string | null,
                shuffle: meta.shuffle || false,
                repeat: meta.repeat || 'none',
            };
        } catch (e) {
            console.error('Failed to load queue:', e);
            return null;
        }
    }
);

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
        // ─── Queue management ────────────────────────────────────
        addToQueue: (state, action: PayloadAction<Song>) => {
            // Add after current song so it plays next by default
            const song = action.payload;
            // Avoid exact duplicates in a row
            const alreadyExists = state.queue.some(s => s.id === song.id);
            if (!alreadyExists) {
                if (state.currentSong) {
                    const currentIdx = state.queue.findIndex(s => s.id === state.currentSong!.id);
                    state.queue.splice(currentIdx + 1, 0, song);
                    state.originalQueue.splice(
                        state.originalQueue.findIndex(s => s.id === state.currentSong!.id) + 1,
                        0,
                        song
                    );
                } else {
                    state.queue.push(song);
                    state.originalQueue.push(song);
                }
            }
        },
        addToQueueEnd: (state, action: PayloadAction<Song>) => {
            const song = action.payload;
            const alreadyExists = state.queue.some(s => s.id === song.id);
            if (!alreadyExists) {
                state.queue.push(song);
                state.originalQueue.push(song);
            }
        },
        removeFromQueue: (state, action: PayloadAction<string>) => {
            const songId = action.payload;
            // Don't allow removing the currently playing song
            if (state.currentSong?.id === songId) return;
            state.queue = state.queue.filter(s => s.id !== songId);
            state.originalQueue = state.originalQueue.filter(s => s.id !== songId);
        },
        reorderQueue: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
            const { fromIndex, toIndex } = action.payload;
            if (fromIndex < 0 || toIndex < 0 || fromIndex >= state.queue.length || toIndex >= state.queue.length) return;
            const [moved] = state.queue.splice(fromIndex, 1);
            state.queue.splice(toIndex, 0, moved);
            // Also update originalQueue to match
            const origFromIdx = state.originalQueue.findIndex(s => s.id === moved.id);
            if (origFromIdx >= 0) {
                const [origMoved] = state.originalQueue.splice(origFromIdx, 1);
                // Find a reasonable target position in original queue
                const targetSong = state.queue[toIndex > 0 ? toIndex - 1 : 0];
                const origTargetIdx = state.originalQueue.findIndex(s => s.id === targetSong?.id);
                state.originalQueue.splice(origTargetIdx + 1, 0, origMoved);
            }
        },
        moveInQueue: (state, action: PayloadAction<{ songId: string; direction: 'up' | 'down' }>) => {
            const { songId, direction } = action.payload;
            const idx = state.queue.findIndex(s => s.id === songId);
            if (idx < 0) return;
            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= state.queue.length) return;
            // Don't allow moving past the currently playing song position
            const currentIdx = state.currentSong ? state.queue.findIndex(s => s.id === state.currentSong!.id) : -1;
            if (newIdx <= currentIdx && direction === 'up') return;
            [state.queue[idx], state.queue[newIdx]] = [state.queue[newIdx], state.queue[idx]];
        },
        clearUpcoming: (state) => {
            // Keep only the current song and songs already played
            if (!state.currentSong) {
                state.queue = [];
                state.originalQueue = [];
                return;
            }
            const currentIdx = state.queue.findIndex(s => s.id === state.currentSong!.id);
            state.queue = state.queue.slice(0, currentIdx + 1);
            state.originalQueue = [...state.queue];
        },
        playFromQueue: (state, action: PayloadAction<string>) => {
            const songId = action.payload;
            const song = state.queue.find(s => s.id === songId);
            if (song) {
                state.currentSong = song;
                state.isPlaying = true;
                state.progress = 0;
                state.currentTimeMs = 0;
                state.isBuffering = true;
            }
        },
        // ─── Existing reducers ───────────────────────────────────
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
            })
            .addCase(loadQueueFromStorage.fulfilled, (state, action) => {
                if (action.payload && action.payload.queue.length > 0) {
                    state.queue = action.payload.queue;
                    state.originalQueue = action.payload.originalQueue;
                    state.shuffle = action.payload.shuffle;
                    state.repeat = action.payload.repeat as 'none' | 'one' | 'all';
                    if (action.payload.currentSongId) {
                        const song = action.payload.queue.find(s => s.id === action.payload!.currentSongId);
                        if (song) {
                            state.currentSong = song;
                            state.isPlaying = false; // Don't auto-play on restore
                        }
                    }
                }
                state.queueLoaded = true;
            });
    },
});

export const {
    setCurrentSong,
    setQueue,
    addToQueue,
    addToQueueEnd,
    removeFromQueue,
    reorderQueue,
    moveInQueue,
    clearUpcoming,
    playFromQueue,
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
