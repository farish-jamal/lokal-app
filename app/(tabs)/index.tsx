import React, { useState, useEffect } from 'react';
import {
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  Image,
  View, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchHomeData, fetchArtists, fetchAlbums } from '@/store/slices/librarySlice';
import SongCard from '@/components/SongCard';
import ArtistCard from '@/components/ArtistCard';
import SectionHeader from '@/components/SectionHeader';
import SongRow from '@/components/SongRow';
import MiniPlayer from '@/components/MiniPlayer';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ArtistDetailScreen from '../artistDetail';
import AlbumDetailScreen from '../albumDetail';
import FullScreenPlayer from '../fullScreenPlayer';

const TABS = ['Suggested', 'Songs', 'Artists', 'Albums', 'Favorites'];

type SortField = 'title' | 'artist' | 'album' | 'year' | 'dateAdded' | 'dateModified' | 'composer';
type SortDirection = 'Ascending' | 'Descending';

interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: 'title', direction: 'Ascending', label: 'Ascending' },
  { field: 'title', direction: 'Descending', label: 'Descending' },
  { field: 'artist', direction: 'Ascending', label: 'Artist' },
  { field: 'album', direction: 'Ascending', label: 'Album' },
  { field: 'year', direction: 'Ascending', label: 'Year' },
  { field: 'dateAdded', direction: 'Ascending', label: 'Date Added' },
  { field: 'dateModified', direction: 'Ascending', label: 'Date Modified' },
  { field: 'composer', direction: 'Ascending', label: 'Composer' },
];

interface SongContextOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
}

const SONG_CONTEXT_OPTIONS: SongContextOption[] = [
  { id: 'play-next', label: 'Play Next', icon: 'play-skip-forward' },
  { id: 'add-to-queue', label: 'Add to Playing Queue', icon: 'list' },
  { id: 'add-to-playlist', label: 'Add to Playlist', icon: 'add-circle' },
  { id: 'go-to-album', label: 'Go to Album', icon: 'disc' },
  { id: 'go-to-artist', label: 'Go to Artist', icon: 'person' },
  { id: 'details', label: 'Details', icon: 'information-circle' },
  { id: 'set-ringtone', label: 'Set as Ringtone', icon: 'call' },
  { id: 'add-to-blacklist', label: 'Add to Blacklist', icon: 'ban' },
  { id: 'share', label: 'Share', icon: 'share' },
  { id: 'delete', label: 'Delete from Device', icon: 'trash', destructive: true },
];

const ALBUM_CONTEXT_OPTIONS: SongContextOption[] = [
  { id: 'play', label: 'Play', icon: 'play' },
  { id: 'play-next', label: 'Play Next', icon: 'play-skip-forward' },
  { id: 'add-to-queue', label: 'Add to Queue', icon: 'list' },
  { id: 'add-to-playlist', label: 'Add to Playlist', icon: 'add-circle' },
  { id: 'go-to-artist', label: 'Go to Artist', icon: 'person' },
  { id: 'share', label: 'Share', icon: 'share' },
];

const ARTIST_CONTEXT_OPTIONS: SongContextOption[] = [
  { id: 'play', label: 'Play Top Songs', icon: 'play' },
  { id: 'add-to-queue', label: 'Add to Queue', icon: 'list' },
  { id: 'follow', label: 'Follow', icon: 'heart' },
  { id: 'view-albums', label: 'View Albums', icon: 'disc' },
  { id: 'share', label: 'Share', icon: 'share' },
];

type ArtistSortField = 'name' | 'followers' | 'albums' | 'songs' | 'dateAdded';
type ArtistSortDirection = 'Ascending' | 'Descending';

interface ArtistSortOption {
  field: ArtistSortField;
  direction: ArtistSortDirection;
  label: string;
}

const ARTIST_SORT_OPTIONS: ArtistSortOption[] = [
  { field: 'name', direction: 'Ascending', label: 'Name (A-Z)' },
  { field: 'name', direction: 'Descending', label: 'Name (Z-A)' },
  { field: 'followers', direction: 'Descending', label: 'Most Followers' },
  { field: 'followers', direction: 'Ascending', label: 'Least Followers' },
  { field: 'albums', direction: 'Descending', label: 'Most Albums' },
  { field: 'songs', direction: 'Descending', label: 'Most Songs' },
  { field: 'dateAdded', direction: 'Descending', label: 'Recently Added' },
  { field: 'dateAdded', direction: 'Ascending', label: 'Date Added' },
];

type AlbumSortField = 'title' | 'artist' | 'year' | 'songs' | 'dateAdded' | 'dateModified';
type AlbumSortDirection = 'Ascending' | 'Descending';

interface AlbumSortOption {
  field: AlbumSortField;
  direction: AlbumSortDirection;
  label: string;
}

const ALBUM_SORT_OPTIONS: AlbumSortOption[] = [
  { field: 'title', direction: 'Ascending', label: 'Title (A-Z)' },
  { field: 'title', direction: 'Descending', label: 'Title (Z-A)' },
  { field: 'artist', direction: 'Ascending', label: 'Artist (A-Z)' },
  { field: 'artist', direction: 'Descending', label: 'Artist (Z-A)' },
  { field: 'year', direction: 'Descending', label: 'Newest First' },
  { field: 'year', direction: 'Ascending', label: 'Oldest First' },
  { field: 'songs', direction: 'Descending', label: 'Most Songs' },
  { field: 'dateModified', direction: 'Descending', label: 'Recently Modified' },
  { field: 'dateAdded', direction: 'Descending', label: 'Recently Added' },
];

// ─── Suggested tab content ──────────────────────────────────────────────────
function SuggestedContent({ onSongPress, onArtistPress }: { onSongPress: (song: any) => void; onArtistPress?: (artist: any) => void }) {
  const C = useThemeColors();
  const { songs, artists, albums, loading } = useAppSelector(s => s.library);

  if (loading.home) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={[styles.loadingText, { color: C.text }]}>Loading content...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.section}>
        <SectionHeader title="Recently Played" onSeeAll={() => { }} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={songs.slice(0, 10)}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SongCard 
              song={item} 
              onPress={() => onSongPress(item)} 
            />
          )}
          contentContainerStyle={{ paddingRight: 8 }}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Artists" onSeeAll={() => { }} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={artists.slice(0, 10)}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ArtistCard artist={item} onPress={() => onArtistPress && onArtistPress(item)} />}
          contentContainerStyle={{ paddingRight: 8 }}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Most Played" onSeeAll={() => { }} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={songs.slice(10, 20)}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SongCard 
              song={item} 
              onPress={() => onSongPress(item)} 
            />
          )}
          contentContainerStyle={{ paddingRight: 8 }}
        />
      </View>

      <View style={[styles.section, { marginBottom: 100 }]}>
        <SectionHeader title="Albums" onSeeAll={() => { }} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={albums.slice(0, 10)}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const songData = {
              id: item.id,
              title: item.title,
              artist: item.artist,
              album: item.title,
              duration: 0,
              artwork: item.artwork,
              url: '',
              isFavorite: false,
            };
            return (
              <SongCard
                song={songData}
                onPress={() => onSongPress(songData)}
              />
            );
          }}
          contentContainerStyle={{ paddingRight: 8 }}
        />
      </View>
    </ScrollView>
  );
}

// ─── Songs tab content ───────────────────────────────────────────────────────
function SongsContent({ onSongPress }: { onSongPress: (song: any) => void }) {
  const C = useThemeColors();
  const [currentSort, setCurrentSort] = useState<SortOption>(SORT_OPTIONS[0]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showSongContext, setShowSongContext] = useState(false);
  const { songs } = useAppSelector(s => s.library);

  const getSortedSongs = () => {
    return [...songs].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (currentSort.field) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'artist':
          aValue = a.artist;
          bValue = b.artist;
          break;
        case 'album':
          aValue = a.album || '';
          bValue = b.album || '';
          break;
        case 'year':
          aValue = (a as any).year || 0;
          bValue = (b as any).year || 0;
          break;
        case 'dateAdded':
          aValue = (a as any).dateAdded || 0;
          bValue = (b as any).dateAdded || 0;
          break;
        case 'dateModified':
          aValue = (a as any).dateModified || 0;
          bValue = (b as any).dateModified || 0;
          break;
        case 'composer':
          aValue = (a as any).composer || '';
          bValue = (b as any).composer || '';
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return currentSort.direction === 'Ascending' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return currentSort.direction === 'Ascending'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  };

  const handleSongContextAction = (actionId: string) => {
    console.log(`Action ${actionId} for song:`, selectedSong?.title);
    setShowSongContext(false);
    setSelectedSong(null);
  };

  const renderSortDropdown = () => (
    <Modal
      visible={showSortDropdown}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortDropdown(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortDropdown(false)}
      >
        <View style={[styles.dropdownContainer, { backgroundColor: C.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {SORT_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={`${option.field}-${option.direction}`}
                style={[
                  styles.dropdownItem,
                  index !== SORT_OPTIONS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }
                ]}
                onPress={() => {
                  setCurrentSort(option);
                  setShowSortDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: C.text }]}>
                  {option.label}
                </Text>
                {currentSort.field === option.field && currentSort.direction === option.direction && (
                  <View style={[styles.selectedIndicator, { backgroundColor: C.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSongContextMenu = () => (
    <Modal
      visible={showSongContext}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowSongContext(false);
        setSelectedSong(null);
      }}
    >
      <TouchableOpacity
        style={styles.songContextOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowSongContext(false);
          setSelectedSong(null);
        }}
      >
        <View style={[styles.songContextContainer, { backgroundColor: C.surface }]}>
          {/* Song Header */}
          <View style={[styles.songContextHeader, { borderBottomColor: C.border }]}>
            <Image
              source={{ uri: selectedSong?.artwork }}
              style={styles.songContextArtwork}
              resizeMode="cover"
            />
            <View style={styles.songContextHeaderContent}>
              <Text style={[styles.songContextTitle, { color: C.text }]} numberOfLines={1}>
                {selectedSong?.title}
              </Text>
              <Text style={[styles.songContextArtist, { color: C.textSecondary }]} numberOfLines={1}>
                {selectedSong?.artist}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.songContextClose}
              onPress={() => {
                setShowSongContext(false);
                setSelectedSong(null);
              }}
            >
              <Ionicons name="close" size={24} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          
          {/* Options */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.songContextOptions}>
            {SONG_CONTEXT_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.songContextOption,
                  index !== SONG_CONTEXT_OPTIONS.length - 1 && { 
                    borderBottomWidth: StyleSheet.hairlineWidth, 
                    borderBottomColor: C.border 
                  }
                ]}
                onPress={() => handleSongContextAction(option.id)}
              >
                <View style={styles.songContextOptionContent}>
                  <Ionicons 
                    name={option.icon} 
                    size={16} 
                    color={option.destructive ? '#ff4444' : C.text} 
                  />
                  <Text style={[
                    styles.songContextOptionText, 
                    { color: option.destructive ? '#ff4444' : C.text }
                  ]}>
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* Count + Sort row */}
      <View style={[styles.sortRow, { borderBottomColor: C.border }]}>
        <Text style={[styles.songCount, { color: C.text }]}>
          {songs.length} songs
        </Text>
        <TouchableOpacity
          style={styles.sortBtn}
          activeOpacity={0.7}
          onPress={() => setShowSortDropdown(true)}
        >
          <Text style={[styles.sortText, { color: C.primary }]}>{currentSort.label}</Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={C.primary}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={getSortedSongs()}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: 140 }]}
        renderItem={({ item }) => (
          <SongRow 
            song={item} 
            onPress={() => onSongPress(item)}
            onMorePress={() => {
              setSelectedSong(item);
              setShowSongContext(true);
            }}
          />
        )}
      />

      {renderSortDropdown()}
      {renderSongContextMenu()}
    </View>
  );
}

// ─── Artists tab content ─────────────────────────────────────────────────────
function ArtistsContent({ onSongPress }: { onSongPress?: (song: any) => void }) {
  const C = useThemeColors();
  const { artists, songs, albums } = useAppSelector(s => s.library);
  const dispatch = useAppDispatch();
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [showArtistContext, setShowArtistContext] = useState(false);
  const [currentArtistSort, setCurrentArtistSort] = useState<ArtistSortOption>(ARTIST_SORT_OPTIONS[0]);
  const [showArtistSortDropdown, setShowArtistSortDropdown] = useState(false);
  const [showArtistDetail, setShowArtistDetail] = useState(false);
  const [selectedArtistForDetail, setSelectedArtistForDetail] = useState<any>(null);
  
  // Fetch artists if not already loaded
  useEffect(() => {
    if (artists.length === 0) {
      dispatch(fetchArtists());
    }
  }, [dispatch, artists.length]);
  
  const getArtistStats = (artistName: string) => {
    const artistAlbums = albums.filter(album => album.artist === artistName);
    const artistSongs = songs.filter(song => song.artist === artistName);
    return {
      albums: artistAlbums.length,
      songs: artistSongs.length
    };
  };

  const getSortedArtists = () => {
    return [...artists].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (currentArtistSort.field) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'followers':
          // Convert followers string to number (e.g. "72.4M" -> 72400000)
          const parseFollowers = (followers: string) => {
            const num = parseFloat(followers.replace(/[^\d.]/g, ''));
            if (followers.includes('M')) return num * 1000000;
            if (followers.includes('K')) return num * 1000;
            return num;
          };
          aValue = parseFollowers(a.followers);
          bValue = parseFollowers(b.followers);
          break;
        case 'albums':
          aValue = getArtistStats(a.name).albums;
          bValue = getArtistStats(b.name).albums;
          break;
        case 'songs':
          aValue = getArtistStats(a.name).songs;
          bValue = getArtistStats(b.name).songs;
          break;
        case 'dateAdded':
          // Use artist id as proxy for date added (newer artists have higher ids)
          aValue = parseInt(a.id.replace('a', ''));
          bValue = parseInt(b.id.replace('a', ''));
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return currentArtistSort.direction === 'Ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return currentArtistSort.direction === 'Ascending'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  };

  const handleArtistContextAction = (actionId: string) => {
    console.log(`Artist action ${actionId} for:`, selectedArtist?.name);
    setShowArtistContext(false);
    setSelectedArtist(null);
  };

  const renderArtistSortDropdown = () => (
    <Modal
      visible={showArtistSortDropdown}
      transparent
      animationType="fade"
      onRequestClose={() => setShowArtistSortDropdown(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowArtistSortDropdown(false)}
      >
        <View style={[styles.dropdownContainer, { backgroundColor: C.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ARTIST_SORT_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={`${option.field}-${option.direction}`}
                style={[
                  styles.dropdownItem,
                  index !== ARTIST_SORT_OPTIONS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }
                ]}
                onPress={() => {
                  setCurrentArtistSort(option);
                  setShowArtistSortDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: C.text }]}>
                  {option.label}
                </Text>
                {currentArtistSort.field === option.field && currentArtistSort.direction === option.direction && (
                  <View style={[styles.selectedIndicator, { backgroundColor: C.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderArtistContextMenu = () => (
    <Modal
      visible={showArtistContext}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowArtistContext(false);
        setSelectedArtist(null);
      }}
    >
      <TouchableOpacity
        style={styles.songContextOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowArtistContext(false);
          setSelectedArtist(null);
        }}
      >
        <View style={[styles.songContextContainer, { backgroundColor: C.surface }]}>
          <View style={[styles.songContextHeader, { borderBottomColor: C.border }]}>
            <Image
              source={{ uri: selectedArtist?.image }}
              style={[styles.songContextArtwork, { borderRadius: 25 }]}
              resizeMode="cover"
            />
            <View style={styles.songContextHeaderContent}>
              <Text style={[styles.songContextTitle, { color: C.text }]} numberOfLines={1}>
                {selectedArtist?.name}
              </Text>
              <Text style={[styles.songContextArtist, { color: C.textSecondary }]} numberOfLines={1}>
                {selectedArtist?.followers} followers
              </Text>
            </View>
            <TouchableOpacity
              style={styles.songContextClose}
              onPress={() => {
                setShowArtistContext(false);
                setSelectedArtist(null);
              }}
            >
              <Ionicons name="close" size={24} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.songContextOptions}>
            {ARTIST_CONTEXT_OPTIONS.slice(0, -1).map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.songContextOption,
                  index !== ARTIST_CONTEXT_OPTIONS.slice(0, -1).length - 1 && { 
                    borderBottomWidth: StyleSheet.hairlineWidth, 
                    borderBottomColor: C.border 
                  }
                ]}
                onPress={() => handleArtistContextAction(option.id)}
              >
                <View style={styles.songContextOptionContent}>
                  <Ionicons 
                    name={option.icon} 
                    size={16} 
                    color={C.text} 
                  />
                  <Text style={[styles.songContextOptionText, { color: C.text }]}>
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={[styles.sortRow, { borderBottomColor: C.border }]}>
        <Text style={[styles.songCount, { color: C.text }]}>
          {artists.length} artists
        </Text>
        <TouchableOpacity 
          style={styles.sortBtn} 
          activeOpacity={0.7}
          onPress={() => setShowArtistSortDropdown(true)}
        >
          <Text style={[styles.sortText, { color: C.primary }]}>{currentArtistSort.label}</Text>
          <Ionicons name="chevron-down" size={16} color={C.primary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={getSortedArtists()}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: 140 }]}
        renderItem={({ item }) => {
          const stats = getArtistStats(item.name);
          return (
            <View style={[styles.artistRow, { borderBottomColor: C.border }]}>
              <TouchableOpacity 
                style={styles.artistContent} 
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedArtistForDetail(item);
                  setShowArtistDetail(true);
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.artistImage}
                  resizeMode="cover"
                />
                <View style={styles.artistInfo}>
                  <Text style={[styles.artistName, { color: C.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.artistMeta, { color: C.textSecondary }]} numberOfLines={1}>
                    {stats.albums} album{stats.albums !== 1 ? 's' : ''} | {stats.songs} songs
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.artistMoreBtn}
                onPress={() => {
                  setSelectedArtist(item);
                  setShowArtistContext(true);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
      {renderArtistSortDropdown()}
      {renderArtistContextMenu()}
      
      {/* Artist Detail Modal */}
      <Modal
        visible={showArtistDetail}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowArtistDetail(false);
          setSelectedArtistForDetail(null);
        }}
      >
        <ArtistDetailScreen
          artistName={selectedArtistForDetail?.name}
          onSongPress={onSongPress}
          onBack={() => {
            setShowArtistDetail(false);
            setSelectedArtistForDetail(null);
          }}
        />
      </Modal>
    </View>
  );
}

// ─── Albums tab content ──────────────────────────────────────────────────────
function AlbumsContent({ onSongPress }: { onSongPress?: (song: any) => void }) {
  const C = useThemeColors();
  const { albums } = useAppSelector(s => s.library);
  const dispatch = useAppDispatch();
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [showAlbumContext, setShowAlbumContext] = useState(false);
  const [currentAlbumSort, setCurrentAlbumSort] = useState<AlbumSortOption>(ALBUM_SORT_OPTIONS[0]);
  const [showAlbumSortDropdown, setShowAlbumSortDropdown] = useState(false);
  const [showAlbumDetail, setShowAlbumDetail] = useState(false);
  const [selectedAlbumForDetail, setSelectedAlbumForDetail] = useState<any>(null);
  
  // Fetch albums if not already loaded
  useEffect(() => {
    if (albums.length === 0) {
      dispatch(fetchAlbums());
    }
  }, [dispatch, albums.length]);
  
  const getSortedAlbums = () => {
    return [...albums].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (currentAlbumSort.field) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'artist':
          aValue = a.artist;
          bValue = b.artist;
          break;
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'songs':
          aValue = a.songs.length;
          bValue = b.songs.length;
          break;
        case 'dateAdded':
          // Use album id as proxy for date added (newer albums have higher ids)
          aValue = parseInt(a.id.replace('al', ''));
          bValue = parseInt(b.id.replace('al', ''));
          break;
        case 'dateModified':
          // Use year as proxy for date modified, or could use album id
          aValue = a.year;
          bValue = b.year;
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return currentAlbumSort.direction === 'Ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return currentAlbumSort.direction === 'Ascending'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  };

  const handleAlbumContextAction = (actionId: string) => {
    console.log(`Album action ${actionId} for:`, selectedAlbum?.title);
    setShowAlbumContext(false);
    setSelectedAlbum(null);
  };

  const renderAlbumSortDropdown = () => (
    <Modal
      visible={showAlbumSortDropdown}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAlbumSortDropdown(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowAlbumSortDropdown(false)}
      >
        <View style={[styles.dropdownContainer, { backgroundColor: C.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ALBUM_SORT_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={`${option.field}-${option.direction}`}
                style={[
                  styles.dropdownItem,
                  index !== ALBUM_SORT_OPTIONS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }
                ]}
                onPress={() => {
                  setCurrentAlbumSort(option);
                  setShowAlbumSortDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: C.text }]}>
                  {option.label}
                </Text>
                {currentAlbumSort.field === option.field && currentAlbumSort.direction === option.direction && (
                  <View style={[styles.selectedIndicator, { backgroundColor: C.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderAlbumContextMenu = () => (
    <Modal
      visible={showAlbumContext}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowAlbumContext(false);
        setSelectedAlbum(null);
      }}
    >
      <TouchableOpacity
        style={styles.songContextOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowAlbumContext(false);
          setSelectedAlbum(null);
        }}
      >
        <View style={[styles.songContextContainer, { backgroundColor: C.surface }]}>
          <View style={[styles.songContextHeader, { borderBottomColor: C.border }]}>
            <Image
              source={{ uri: selectedAlbum?.artwork }}
              style={styles.songContextArtwork}
              resizeMode="cover"
            />
            <View style={styles.songContextHeaderContent}>
              <Text style={[styles.songContextTitle, { color: C.text }]} numberOfLines={1}>
                {selectedAlbum?.title}
              </Text>
              <Text style={[styles.songContextArtist, { color: C.textSecondary }]} numberOfLines={1}>
                {selectedAlbum?.artist}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.songContextClose}
              onPress={() => {
                setShowAlbumContext(false);
                setSelectedAlbum(null);
              }}
            >
              <Ionicons name="close" size={24} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.songContextOptions}>
            {ALBUM_CONTEXT_OPTIONS.slice(0, -1).map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.songContextOption,
                  index !== ALBUM_CONTEXT_OPTIONS.slice(0, -1).length - 1 && { 
                    borderBottomWidth: StyleSheet.hairlineWidth, 
                    borderBottomColor: C.border 
                  }
                ]}
                onPress={() => handleAlbumContextAction(option.id)}
              >
                <View style={styles.songContextOptionContent}>
                  <Ionicons 
                    name={option.icon} 
                    size={16} 
                    color={C.text} 
                  />
                  <Text style={[styles.songContextOptionText, { color: C.text }]}>
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={[styles.sortRow, { borderBottomColor: C.border }]}>
        <Text style={[styles.songCount, { color: C.text }]}>
          {albums.length} albums
        </Text>
        <TouchableOpacity 
          style={styles.sortBtn} 
          activeOpacity={0.7}
          onPress={() => setShowAlbumSortDropdown(true)}
        >
          <Text style={[styles.sortText, { color: C.primary }]}>{currentAlbumSort.label}</Text>
          <Ionicons name="chevron-down" size={16} color={C.primary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={getSortedAlbums()}
        keyExtractor={item => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: 140, paddingTop: 12 }]}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <View style={styles.albumCard}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                setSelectedAlbumForDetail(item);
                setShowAlbumDetail(true);
              }}
            >
              <Image
                source={{ uri: item.artwork }}
                style={styles.albumArtwork}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.albumMoreBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedAlbum(item);
                  setShowAlbumContext(true);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
            <View style={styles.albumInfo}>
              <Text style={[styles.albumTitle, { color: C.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.albumMeta, { color: C.textSecondary }]} numberOfLines={1}>
                {item.artist} | {item.year}
              </Text>
              <Text style={[styles.albumSongs, { color: C.textMuted }]}>
                {item.songs.length} songs
              </Text>
            </View>
          </View>
        )}
      />
      {renderAlbumSortDropdown()}
      {renderAlbumContextMenu()}
      
      {/* Album Detail Modal */}
      <Modal
        visible={showAlbumDetail}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowAlbumDetail(false);
          setSelectedAlbumForDetail(null);
        }}
      >
        <AlbumDetailScreen
          album={selectedAlbumForDetail}
          onSongPress={onSongPress}
          onBack={() => {
            setShowAlbumDetail(false);
            setSelectedAlbumForDetail(null);
          }}
        />
      </Modal>
    </View>
  );
}

// ─── Favorites tab content ───────────────────────────────────────────────────
function FavoritesContent({ onSongPress }: { onSongPress: (song: any) => void }) {
  const C = useThemeColors();
  const { favorites } = useAppSelector(s => s.library);

  if (favorites.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="heart-outline" size={56} color={C.textMuted} />
        <Text style={[styles.emptyText, { color: C.textMuted }]}>No favorites yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.listContent, { paddingBottom: 140 }]}
      renderItem={({ item }) => (
        <SongRow 
          song={item} 
          onPress={() => onSongPress(item)}
          onMorePress={() => {
            // Note: You might want to add context menu here too
            console.log('More pressed for favorite:', item.title);
          }}
        />
      )}
    />
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const C = useThemeColors();
  const scheme = useColorScheme() ?? 'light';
  const [activeTab, setActiveTab] = useState(0);
  const [showFullScreenPlayer, setShowFullScreenPlayer] = useState(false);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<any>(null);
  const [showArtistDetail, setShowArtistDetail] = useState(false);
  const [selectedArtistForDetail, setSelectedArtistForDetail] = useState<any>(null);
  const dispatch = useAppDispatch();

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchHomeData());
  }, [dispatch]);

  const handleSongPress = (song: any) => {
    setCurrentPlayingSong(song);
    setShowFullScreenPlayer(true);
  };

  const handleArtistPress = (artist: any) => {
    setSelectedArtistForDetail(artist);
    setShowArtistDetail(true);
  };

  function renderTabContent() {
    switch (activeTab) {
      case 0: return <SuggestedContent onSongPress={handleSongPress} onArtistPress={handleArtistPress} />;
      case 1: return <SongsContent onSongPress={handleSongPress} />;
      case 2: return <ArtistsContent onSongPress={handleSongPress} />;
      case 3: return <AlbumsContent onSongPress={handleSongPress} />;
      case 4: return <FavoritesContent onSongPress={handleSongPress} />;
      default: return <SuggestedContent onSongPress={handleSongPress} onArtistPress={handleArtistPress} />;
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={C.background}
      />

      {/* ─── Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: C.background }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Ionicons name="musical-notes" size={22} color={C.primary} />
          </View>
          <Text style={[styles.appName, { color: C.text }]}>Mume</Text>
        </View>
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: C.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ─── Category Tabs ───────────────────────────────────── */}
      <View style={[styles.tabsWrapper, { backgroundColor: C.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setActiveTab(i)}
              style={styles.tabItem}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === i ? C.primary : C.textMuted },
                  activeTab === i && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
              {activeTab === i && (
                <View style={[styles.tabUnderline, { backgroundColor: C.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={[styles.tabsBorderBottom, { backgroundColor: C.border }]} />
      </View>

      {/* ─── Tab Content ─────────────────────────────────────── */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>

      {/* ─── Mini Player ─────────────────────────────────────── */}
      <MiniPlayer />
      
      {/* Artist Detail Modal */}
      <Modal
        visible={showArtistDetail}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowArtistDetail(false);
          setSelectedArtistForDetail(null);
        }}
      >
        <ArtistDetailScreen
          artistName={selectedArtistForDetail?.name}
          onSongPress={handleSongPress}
          onBack={() => {
            setShowArtistDetail(false);
            setSelectedArtistForDetail(null);
          }}
        />
      </Modal>
      
      {/* Full Screen Player Modal */}
      <Modal
        visible={showFullScreenPlayer}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowFullScreenPlayer(false);
          setCurrentPlayingSong(null);
        }}
      >
        <FullScreenPlayer
          song={currentPlayingSong}
          onBack={() => {
            setShowFullScreenPlayer(false);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tabs
  tabsWrapper: {
    marginTop: 4,
  },
  tabsContent: {
    paddingHorizontal: 20,
  },
  tabItem: {
    marginRight: 24,
    paddingBottom: 10,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
  },
  tabsBorderBottom: {
    height: StyleSheet.hairlineWidth,
  },
  // Sections (Suggested)
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  // Songs list
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  songCount: {
    fontSize: 15,
    fontWeight: '600',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Sort dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'flex-end',
    top: -40,
    height: '100%',
  },
  dropdownContainer: {
    width: 200,
    maxHeight: 400,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Song context menu
  songContextOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  songContextContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  songContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  songContextArtwork: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 16,
  },
  songContextHeaderContent: {
    flex: 1,
    marginRight: 16,
  },
  songContextTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songContextArtist: {
    fontSize: 12,
    fontWeight: '500',
  },
  songContextClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songContextOptions: {
    maxHeight: 600,
  },
  songContextOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  songContextOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  songContextOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Album cards
  albumCard: {
    width: '48%',
    marginBottom: 20,
  },
  albumArtwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    position: 'relative',
  },
  albumInfo: {
    marginTop: 8,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  albumMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  albumSongs: {
    fontSize: 11,
    fontWeight: '400',
  },
  albumMoreBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  // Artist rows
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  artistContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artistImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  artistMoreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});
