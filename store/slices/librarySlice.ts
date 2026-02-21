import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../data/dummyData';
import { Artist, Album, Playlist, apiService } from '../../services/api';

interface LibraryState {
    songs: Song[];
    artists: Artist[];
    albums: Album[];
    playlists: Playlist[];
    currentPlaylist: Playlist | null;
    favorites: Song[];
    searchQuery: string;
    searchResults: Song[];
    loading: {
        songs: boolean;
        artists: boolean;
        albums: boolean;
        playlists: boolean;
        home: boolean;
    };
    error: string | null;
}

const initialState: LibraryState = {
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
    currentPlaylist: null,
    favorites: [],
    searchQuery: '',
    searchResults: [],
    loading: {
        songs: false,
        artists: false,
        albums: false,
        playlists: false,
        home: false,
    },
    error: null,
};

// Async thunks for API calls
export const fetchHomeData = createAsyncThunk(
    'library/fetchHomeData',
    async () => {
        const data = await apiService.getHomeData();
        return data;
    }
);

export const fetchSongs = createAsyncThunk(
    'library/fetchSongs',
    async (query?: string) => {
        const songs = await apiService.searchSongs(query);
        return songs;
    }
);

export const fetchArtists = createAsyncThunk(
    'library/fetchArtists',
    async (query?: string) => {
        const artists = await apiService.searchArtists(query);
        return artists;
    }
);

export const fetchAlbums = createAsyncThunk(
    'library/fetchAlbums',
    async (query?: string) => {
        const albums = await apiService.searchAlbums(query);
        return albums;
    }
);

export const fetchPlaylist = createAsyncThunk(
    'library/fetchPlaylist',
    async (playlistUrl: string) => {
        const playlist = await apiService.getPlaylist(playlistUrl);
        return playlist;
    }
);

export const loadFavorites = createAsyncThunk(
    'library/loadFavorites',
    async () => {
        const data = await AsyncStorage.getItem('favorites');
        if (data) {
            return JSON.parse(data) as Song[];
        }
        return [];
    }
);

export const toggleFavoriteAsync = createAsyncThunk(
    'library/toggleFavoriteAsync',
    async (song: Song, { getState }) => {
        const state = getState() as any;
        let favorites = [...state.library.favorites];
        const exists = favorites.find((s: Song) => s.id === song.id);
        if (exists) {
            favorites = favorites.filter((s: Song) => s.id !== song.id);
        } else {
            favorites.push({ ...song, isFavorite: true });
        }
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
        return favorites;
    }
);

const librarySlice = createSlice({
    name: 'library',
    initialState,
    reducers: {
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
            if (action.payload.trim() === '') {
                state.searchResults = [];
            } else {
                const q = action.payload.toLowerCase();
                state.searchResults = state.songs.filter(
                    s =>
                        s.title.toLowerCase().includes(q) ||
                        s.artist.toLowerCase().includes(q) ||
                        s.album.toLowerCase().includes(q)
                );
            }
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Home data
        builder
            .addCase(fetchHomeData.pending, (state) => {
                state.loading.home = true;
                state.error = null;
            })
            .addCase(fetchHomeData.fulfilled, (state, action) => {
                state.loading.home = false;
                state.songs = action.payload.songs;
                state.artists = action.payload.artists;
                state.albums = action.payload.albums;
                state.favorites = action.payload.songs.filter(s => s.isFavorite);
            })
            .addCase(fetchHomeData.rejected, (state, action) => {
                state.loading.home = false;
                state.error = action.error.message || 'Failed to fetch data';
            })
            // Songs
            .addCase(fetchSongs.pending, (state) => {
                state.loading.songs = true;
                state.error = null;
            })
            .addCase(fetchSongs.fulfilled, (state, action) => {
                state.loading.songs = false;
                state.songs = action.payload;
            })
            .addCase(fetchSongs.rejected, (state, action) => {
                state.loading.songs = false;
                state.error = action.error.message || 'Failed to fetch songs';
            })
            // Artists
            .addCase(fetchArtists.pending, (state) => {
                state.loading.artists = true;
                state.error = null;
            })
            .addCase(fetchArtists.fulfilled, (state, action) => {
                state.loading.artists = false;
                state.artists = action.payload;
            })
            .addCase(fetchArtists.rejected, (state, action) => {
                state.loading.artists = false;
                state.error = action.error.message || 'Failed to fetch artists';
            })
            // Albums
            .addCase(fetchAlbums.pending, (state) => {
                state.loading.albums = true;
                state.error = null;
            })
            .addCase(fetchAlbums.fulfilled, (state, action) => {
                state.loading.albums = false;
                state.albums = action.payload;
            })
            .addCase(fetchAlbums.rejected, (state, action) => {
                state.loading.albums = false;
                state.error = action.error.message || 'Failed to fetch albums';
            })
            // Playlists
            .addCase(fetchPlaylist.pending, (state) => {
                state.loading.playlists = true;
                state.error = null;
            })
            .addCase(fetchPlaylist.fulfilled, (state, action) => {
                state.loading.playlists = false;
                if (action.payload) {
                    state.currentPlaylist = action.payload;
                    // Add to playlists array if not already there
                    const existingIndex = state.playlists.findIndex(p => p.id === action.payload!.id);
                    if (existingIndex >= 0) {
                        state.playlists[existingIndex] = action.payload;
                    } else {
                        state.playlists.push(action.payload);
                    }
                }
            })
            .addCase(fetchPlaylist.rejected, (state, action) => {
                state.loading.playlists = false;
                state.error = action.error.message || 'Failed to fetch playlist';
            })
            // Favorites
            .addCase(loadFavorites.fulfilled, (state, action) => {
                state.favorites = action.payload;
            })
            .addCase(toggleFavoriteAsync.fulfilled, (state, action) => {
                state.favorites = action.payload;
            });
    },
});

export const { setSearchQuery, clearError } = librarySlice.actions;
export default librarySlice.reducer;
