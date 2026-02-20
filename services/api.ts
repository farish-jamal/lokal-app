interface ApiSong {
  id: string;
  name: string;
  type: string;
  year: string;
  releaseDate: string | null;
  duration: number;
  label: string;
  explicitContent: boolean;
  playCount: number;
  language: string;
  hasLyrics: boolean;
  lyricsId: string | null;
  url: string;
  copyright: string;
  album: {
    id: string;
    name: string;
    url: string;
  };
  artists: {
    primary: Array<{
      id: string;
      name: string;
      role: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      type: string;
      url: string;
    }>;
    featured: any[];
    all: Array<{
      id: string;
      name: string;
      role: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      type: string;
      url: string;
    }>;
  };
  image: Array<{
    quality: string;
    url: string;
  }>;
  downloadUrl: Array<{
    quality: string;
    url: string;
  }>;
}

interface ApiArtist {
  id: string;
  name: string;
  role: string;
  image: Array<{
    quality: string;
    url: string;
  }>;
  type: string;
  url: string;
}

interface ApiAlbum {
  id: string;
  name: string;
  description: string;
  url: string;
  year: number;
  type: string;
  playCount: number | null;
  language: string;
  explicitContent: boolean;
  artists: {
    primary: Array<{
      id: string;
      name: string;
      role: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      type: string;
      url: string;
    }>;
    featured: any[];
    all: Array<{
      id: string;
      name: string;
      role: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      type: string;
      url: string;
    }>;
  };
  image: Array<{
    quality: string;
    url: string;
  }>;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork: string;
  url: string;
  isFavorite: boolean;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  followers: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  year: number;
  songs: string[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  artwork: string;
  songCount: number;
  songs: Song[];
  year?: number;
  language?: string;
}

interface ApiPlaylist {
  id: string;
  name: string;
  description: string;
  type: string;
  year: number | null;
  playCount: number | null;
  language: string;
  explicitContent: boolean;
  url: string;
  songCount: number;
  artists: Array<{
    id: string;
    name: string;
    role: string;
    image: Array<{
      quality: string;
      url: string;
    }>;
    type: string;
    url: string;
  }>;
  image: Array<{
    quality: string;
    url: string;
  }>;
  songs: ApiSong[];
}

const BASE_URL = 'https://saavn.sumit.co/api';

const getHighestQualityImage = (imageArray: Array<{ quality: string; url: string }>): string => {
  if (!imageArray || imageArray.length === 0) return '';
  
  const highQuality = imageArray.find(img => img.quality === '500x500');
  if (highQuality) return highQuality.url;
  
  const mediumQuality = imageArray.find(img => img.quality === '150x150');
  if (mediumQuality) return mediumQuality.url;
  
  return imageArray[0]?.url || '';
};

const transformSong = (apiSong: ApiSong): Song => ({
  id: apiSong.id,
  title: apiSong.name,
  artist: apiSong.artists.primary.map(artist => artist.name).join(', ') || 'Unknown Artist',
  album: apiSong.album?.name || 'Unknown Album',
  duration: apiSong.duration || 0,
  artwork: getHighestQualityImage(apiSong.image),
  url: apiSong.downloadUrl?.find(d => d.quality === '160kbps')?.url || apiSong.downloadUrl?.[0]?.url || '',
  isFavorite: false,
});

const transformArtist = (apiArtist: ApiArtist): Artist => ({
  id: apiArtist.id,
  name: apiArtist.name,
  image: getHighestQualityImage(apiArtist.image) || 'https://via.placeholder.com/500x500?text=No+Image',
  followers: '0',
});

const transformAlbum = (apiAlbum: ApiAlbum): Album => ({
  id: apiAlbum.id,
  title: apiAlbum.name,
  artist: apiAlbum.artists.primary.map(artist => artist.name).join(', ') || 'Unknown Artist',
  artwork: getHighestQualityImage(apiAlbum.image),
  year: apiAlbum.year || new Date().getFullYear(),
  songs: [],
});

const transformPlaylist = (apiPlaylist: ApiPlaylist): Playlist => ({
  id: apiPlaylist.id,
  name: apiPlaylist.name,
  description: apiPlaylist.description,
  artwork: getHighestQualityImage(apiPlaylist.image),
  songCount: apiPlaylist.songCount,
  songs: apiPlaylist.songs.map(transformSong),
  year: apiPlaylist.year || undefined,
  language: apiPlaylist.language,
});

export const apiService = {
  async searchSongs(query: string = 'trending'): Promise<Song[]> {
    try {
      const response = await fetch(`${BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=1&limit=50`);
      const data = await response.json();
      
      console.log('Songs API Response:', { success: data.success, resultsCount: data.data?.results?.length });
      
      if (data.success && data.data && data.data.results) {
        return data.data.results.map(transformSong);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching songs:', error);
      return [];
    }
  },

  async searchArtists(query: string = 'popular'): Promise<Artist[]> {
    try {
      const response = await fetch(`${BASE_URL}/search/artists?query=${encodeURIComponent(query)}&page=1&limit=50`);
      const data = await response.json();
      
      console.log('Artists API Response:', { success: data.success, resultsCount: data.data?.results?.length });
      
      if (data.success && data.data && data.data.results) {
        return data.data.results.map(transformArtist);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching artists:', error);
      return [];
    }
  },

  async searchAlbums(query: string = 'latest'): Promise<Album[]> {
    try {
      const response = await fetch(`${BASE_URL}/search/albums?query=${encodeURIComponent(query)}&page=1&limit=25`);
      const data = await response.json();
      
      console.log('Albums API Response:', { success: data.success, resultsCount: data.data?.results?.length });
      
      if (data.success && data.data && data.data.results) {
        return data.data.results.map(transformAlbum);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
  },

  async getHomeData(): Promise<{
    songs: Song[];
    artists: Artist[];
    albums: Album[];
  }> {
    try {
      const [songs, artists, albums] = await Promise.all([
        this.searchSongs('trending'),
        this.searchArtists('new'),
        this.searchAlbums('latest')
      ]);

      return { songs, artists, albums };
    } catch (error) {
      console.error('Error fetching home data:', error);
      return { songs: [], artists: [], albums: [] };
    }
  },

  async getPlaylist(playlistUrl: string): Promise<Playlist | null> {
    try {
      const response = await fetch(`${BASE_URL}/playlists?link=${encodeURIComponent(playlistUrl)}`);
      const data = await response.json();
      
      console.log('Playlist API Response:', { success: data.success, playlistName: data.data?.name });
      
      if (data.success && data.data) {
        return transformPlaylist(data.data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching playlist:', error);
      return null;
    }
  }
};