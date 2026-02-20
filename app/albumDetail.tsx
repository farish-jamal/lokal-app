import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
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

interface AlbumDetailProps {
  album?: any;
  onBack?: () => void;
  onSongPress?: (song: any) => void;
}

export default function AlbumDetailScreen({ 
  album = {
    id: 'al1',
    title: 'The Weeknd',
    artist: 'The Weeknd',
    year: 2016,
    artwork: 'https://picsum.photos/300/300?random=weeknd',
    songs: []
  }, 
  onBack,
  onSongPress 
}: AlbumDetailProps) {
  const C = useThemeColors();
  const scheme = useColorScheme() ?? 'light';
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showSongContext, setShowSongContext] = useState(false);

  // Filter songs by album or use sample songs
  const albumSongs = album.songs || SONGS.filter(song => song.artist === album.artist).slice(0, 5);
  
  // Calculate stats
  const albumCount = 1;
  const songCount = albumSongs.length;
  const totalDuration = "01:20:39"; // Based on the image

  const handleSongContextAction = (actionId: string) => {
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
        {/* Album Cover Section */}
        <View style={styles.coverSection}>
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: album.artwork }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Album Info */}
        <View style={styles.albumInfo}>
          <Text style={[styles.albumTitle, { color: C.text }]}>
            {album.title}
          </Text>
          <Text style={[styles.albumStats, { color: C.textSecondary }]}>
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
            {albumSongs.map((song, index) => (
              <View key={song.id || index} style={styles.songItem}>
                <TouchableOpacity 
                  style={styles.songContent} 
                  activeOpacity={0.8}
                  onPress={() => onSongPress && onSongPress(song)}
                >
                  <Image
                    source={{ uri: song.artwork || album.artwork }}
                    style={styles.songArtwork}
                    resizeMode="cover"
                  />
                  <View style={styles.songDetails}>
                    <Text style={[styles.songTitle, { color: C.text }]} numberOfLines={1}>
                      {song.title || `Song ${index + 1}`}
                    </Text>
                    <Text style={[styles.songArtist, { color: C.textSecondary }]} numberOfLines={1}>
                      {song.artist || album.artist}
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
            ))}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  albumInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  albumTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  albumStats: {
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