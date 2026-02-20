import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Song, SONGS } from '../data/dummyData';

interface LibraryState {
    songs: Song[];
    favorites: Song[];
    searchQuery: string;
    searchResults: Song[];
}

const favoriteSongs = SONGS.filter(s => s.isFavorite);

const initialState: LibraryState = {
    songs: SONGS,
    favorites: favoriteSongs,
    searchQuery: '',
    searchResults: [],
};

const librarySlice = createSlice({
    name: 'library',
    initialState,
    reducers: {
        toggleFavorite: (state, action: PayloadAction<string>) => {
            const songId = action.payload;
            const song = state.songs.find(s => s.id === songId);
            if (song) {
                song.isFavorite = !song.isFavorite;
                state.favorites = state.songs.filter(s => s.isFavorite);
            }
        },
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
    },
});

export const { toggleFavorite, setSearchQuery } = librarySlice.actions;
export default librarySlice.reducer;
