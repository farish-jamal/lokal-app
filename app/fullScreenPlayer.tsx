import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleFavoriteAsync } from '@/store/slices/librarySlice';
import {
  togglePlay,
  playNext,
  playPrev,
  toggleShuffle,
  toggleRepeat,
  downloadSong,
} from '@/store/slices/playerSlice';
import audioService from '@/services/audioService';

const { width } = Dimensions.get('window');

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork: string;
  duration: number;
  url: string;
  isFavorite?: boolean;
}

interface FullScreenPlayerProps {
  song?: Song;
  onBack?: () => void;
  onClose?: () => void;
}

export default function FullScreenPlayer({
  song = {
    id: '1',
    title: 'Starboy',
    artist: 'The Weeknd, Daft Punk',
    album: 'Starboy',
    artwork: 'https://picsum.photos/400/400?random=starboy',
    duration: 230,
    url: ''
  },
  onBack,
  onClose
}: FullScreenPlayerProps) {
  const C = useThemeColors();
  const scheme = useColorScheme() ?? 'light';
  const dispatch = useAppDispatch();
  const { favorites } = useAppSelector(s => s.library);
  const {
    isPlaying,
    currentSong,
    progress,
    currentTimeMs,
    durationMs,
    shuffle,
    repeat,
    isBuffering,
    downloadedSongs,
    downloadProgress,
  } = useAppSelector(s => s.player);

  const activeSong = currentSong || song;
  const isFavorite = favorites.some((f: Song) => f.id === activeSong.id);
  const isDownloaded = downloadedSongs.some(d => d.songId === activeSong.id);
  const songDownloadProgress = downloadProgress[activeSong.id];
  const isDownloading = songDownloadProgress !== undefined && songDownloadProgress < 1;

  const [showTimer, setShowTimer] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Button press animation
  const handleButtonPress = (callback?: () => void) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (callback) callback();
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayProgress = isSeeking ? seekPosition : progress;
  const displayTimeMs = isSeeking ? seekPosition * durationMs : currentTimeMs;

  const handlePlayPause = () => {
    dispatch(togglePlay());
  };

  const handleSkipBackward = () => {
    const newPos = Math.max(0, currentTimeMs - 15000);
    audioService.seekTo(newPos);
  };

  const handleSkipForward = () => {
    const newPos = Math.min(durationMs, currentTimeMs + 15000);
    audioService.seekTo(newPos);
  };

  const handlePrevious = () => {
    dispatch(playPrev());
  };

  const handleNext = () => {
    dispatch(playNext());
  };

  const handleProgressPress = useCallback((event: any) => {
    const { locationX } = event.nativeEvent;
    const progressWidth = width - 40; // Account for padding
    const percentage = Math.max(0, Math.min(1, locationX / progressWidth));
    audioService.seekToPercentage(percentage);
  }, []);

  const handleDownload = () => {
    if (isDownloaded) {
      Alert.alert('Already Downloaded', 'This song is already available offline.');
      return;
    }
    if (isDownloading) {
      return;
    }
    if (!activeSong.url || activeSong.url.trim() === '') {
      Alert.alert('Cannot Download', 'No download URL available for this song.');
      return;
    }
    dispatch(downloadSong(activeSong as any));
  };

  const getRepeatIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (repeat) {
      case 'one': return 'repeat';
      case 'all': return 'repeat';
      default: return 'repeat';
    }
  };

  const getRepeatColor = () => {
    return repeat === 'none' ? C.textMuted : '#ff6b35';
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={C.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onBack || onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={28} color={C.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerSubtitle, { color: C.textMuted }]}>
            NOW PLAYING
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={C.text} />
        </TouchableOpacity>
      </View>

      {/* Album Artwork */}
      <View style={styles.artworkContainer}>
        <Animated.View
          style={[
            styles.artworkWrapper,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={{ uri: activeSong.artwork }}
            style={styles.artwork}
            resizeMode="cover"
          />
          {isBuffering && (
            <View style={styles.bufferingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </Animated.View>
      </View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, { color: C.text }]} numberOfLines={1}>
          {activeSong.title}
        </Text>
        <Text style={[styles.artistName, { color: C.textSecondary }]} numberOfLines={1}>
          {activeSong.artist}
        </Text>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <TouchableOpacity
          style={styles.progressBarContainer}
          onPress={handleProgressPress}
          activeOpacity={1}
        >
          <View style={[styles.progressBarBackground, { backgroundColor: C.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: '#ff6b35',
                  width: `${displayProgress * 100}%`
                }
              ]}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: C.textSecondary }]}>
            {formatTime(displayTimeMs)}
          </Text>
          <Text style={[styles.timeText, { color: C.textSecondary }]}>
            {formatTime(durationMs)}
          </Text>
        </View>
      </View>

      {/* Main Controls */}
      <View style={styles.mainControls}>
        {/* Shuffle */}
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => dispatch(toggleShuffle())}
          activeOpacity={0.7}
        >
          <Ionicons
            name="shuffle"
            size={22}
            color={shuffle ? '#ff6b35' : C.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleButtonPress(handlePrevious)}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-back" size={28} color={C.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: '#ff6b35' }]}
          onPress={() => handleButtonPress(handlePlayPause)}
          activeOpacity={0.8}
        >
          {isBuffering ? (
            <ActivityIndicator size={28} color="white" />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color="white"
              style={!isPlaying ? { marginLeft: 3 } : {}}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleButtonPress(handleNext)}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-forward" size={28} color={C.text} />
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => dispatch(toggleRepeat())}
          activeOpacity={0.7}
        >
          <View>
            <Ionicons
              name={getRepeatIcon()}
              size={22}
              color={getRepeatColor()}
            />
            {repeat === 'one' && (
              <View style={styles.repeatOneBadge}>
                <Text style={styles.repeatOneText}>1</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => dispatch(toggleFavoriteAsync(activeSong as any))}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? '#ff6b35' : C.textMuted}
          />
        </TouchableOpacity>

        {/* Download button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleDownload}
          activeOpacity={0.7}
        >
          {isDownloading ? (
            <View style={styles.downloadProgressContainer}>
              <ActivityIndicator size={20} color="#ff6b35" />
              <Text style={[styles.downloadPercent, { color: '#ff6b35' }]}>
                {Math.round((songDownloadProgress || 0) * 100)}%
              </Text>
            </View>
          ) : (
            <Ionicons
              name={isDownloaded ? "cloud-done" : "cloud-download-outline"}
              size={24}
              color={isDownloaded ? '#ff6b35' : C.textMuted}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowTimer(!showTimer)}
          activeOpacity={0.7}
        >
          <Ionicons name="timer-outline" size={24} color={C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={24} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Lyrics */}
      <View style={styles.lyricsSection}>
        <Text style={[styles.lyricsText, { color: C.textMuted }]}>
          Lyrics
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  artworkContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  artworkWrapper: {
    width: width - 80,
    height: width - 80,
    maxWidth: 320,
    maxHeight: 320,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  songTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 40,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 16,
  },
  modeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  repeatOneBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ff6b35',
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
    marginBottom: 30,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadProgressContainer: {
    alignItems: 'center',
  },
  downloadPercent: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  lyricsSection: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  lyricsText: {
    fontSize: 16,
    fontWeight: '500',
  },
});