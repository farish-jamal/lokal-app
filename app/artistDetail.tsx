import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch } from '@/store/hooks';
import { addToQueue, addToQueueEnd } from '@/store/slices/playerSlice';
import { SONGS } from '@/store/data/dummyData';

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

interface ArtistDetailProps {
  artistId?: string;
  artistName?: string;
  artistImage?: string;
  onBack?: () => void;
  onSongPress?: (song: any) => void;
}

export default function ArtistDetailScreen({
  artistId,
  artistName = "Ariana Grande",
  artistImage = "https://picsum.photos/300/300?random=ariana",
  onBack,
  onSongPress
}: ArtistDetailProps) {
  const C = useThemeColors();
  const scheme = useColorScheme() ?? 'light';
  const dispatch = useAppDispatch();
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showSongContext, setShowSongContext] = useState(false);
  const [artistSongs, setArtistSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchArtistSongs = async () => {
      if (!artistId) {
        setArtistSongs(SONGS.filter(song => song.artist === artistName));
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`https://saavn.sumit.co/api/artists/${artistId}/songs`);
        const data = await response.json();
        if (data.success && data.data && data.data.songs) {
          const formattedSongs = data.data.songs.map((song: any) => ({
            id: song.id,
            title: song.name,
            artist: song.artists?.primary?.map((a: any) => a.name).join(', ') || artistName,
            album: song.album?.name || '',
            artwork: song.image?.[song.image.length - 1]?.url || 'https://picsum.photos/200',
            url: song.downloadUrl?.find((d: any) => d.quality === '160kbps')?.url || song.downloadUrl?.[song.downloadUrl.length - 1]?.url || '',
            duration: song.duration || 0,
            isFavorite: false,
          }));
          setArtistSongs(formattedSongs);
        }
      } catch (error) {
        console.error('Error fetching artist songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtistSongs();
  }, [artistId, artistName]);

  // Calculate stats
  const albumCount = 1; // Based on the image showing "1 Album"
  const songCount = artistSongs.length;
  const totalDuration = "01:24:24"; // Based on the image

  const handleSongContextAction = (actionId: string) => {
    if (selectedSong) {
      if (actionId === 'play-next') {
        dispatch(addToQueue(selectedSong));
      } else if (actionId === 'add-to-queue') {
        dispatch(addToQueueEnd(selectedSong));
      }
    }
    console.log(`Action ${actionId} for song:`, selectedSong?.title);
    setShowSongContext(false);
    setSelectedSong(null);
  };

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
    <View style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={C.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: C.surface }]}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: C.surface }]}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Artist Cover Section */}
        <View style={styles.coverSection}>
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: artistImage }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Artist Info */}
        <View style={styles.artistInfo}>
          <Text style={[styles.artistName, { color: C.text }]}>
            {artistName}
          </Text>
          <Text style={[styles.artistStats, { color: C.textSecondary }]}>
            {albumCount} Album | {songCount} Songs | {totalDuration} mins
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.shuffleButton, { backgroundColor: '#ff6b35' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="shuffle" size={18} color="white" />
            <Text style={styles.shuffleButtonText}>Shuffle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: '#ff6b35' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={18} color="white" />
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
        </View>

        {/* Songs Section */}
        <View style={styles.songsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Songs</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.seeAllButton, { color: '#ff6b35' }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Songs List */}
          <View style={styles.songsList}>
            {isLoading ? (
              <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: 40 }} />
            ) : artistSongs.length === 0 ? (
              <Text style={{ color: C.textMuted, textAlign: 'center', marginVertical: 20 }}>No songs found</Text>
            ) : (
              artistSongs.map((song, index) => (
                <View key={song.id} style={styles.songItem}>
                  <TouchableOpacity
                    style={styles.songContent}
                    activeOpacity={0.8}
                    onPress={() => onSongPress && onSongPress(song)}
                  >
                    <Image
                      source={{ uri: song.artwork }}
                      style={styles.songArtwork}
                      resizeMode="cover"
                    />
                    <View style={styles.songDetails}>
                      <Text style={[styles.songTitle, { color: C.text }]} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={[styles.songArtist, { color: C.textSecondary }]} numberOfLines={1}>
                        {song.artist}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.songMoreBtn}
                    onPress={() => {
                      setSelectedSong(song);
                      setShowSongContext(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color={C.textMuted} />
                  </TouchableOpacity>
                </View>
              )))}
          </View>
        </View>
      </ScrollView>

      {renderSongContextMenu()}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  coverSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  coverContainer: {
    width: 280,
    height: 320,
    borderRadius: 20,
    backgroundColor: '#e91e63',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  artistInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  artistName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  artistStats: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  shuffleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  shuffleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  songsSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  songsList: {
    gap: 4,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  songArtwork: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 13,
    fontWeight: '500',
  },
  songMoreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Context menu styles (reused from main component)
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
});