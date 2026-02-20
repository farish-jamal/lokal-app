import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork: string;
  duration: number;
  url: string;
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(215); // 3:35 in seconds
  const [isFavorite, setIsFavorite] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = song.duration;
  const progressPercentage = (currentTime / totalDuration) * 100;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipBackward = () => {
    setCurrentTime(Math.max(0, currentTime - 15));
  };

  const handleSkipForward = () => {
    setCurrentTime(Math.min(totalDuration, currentTime + 15));
  };

  const handlePrevious = () => {
    setCurrentTime(0);
    // In a real app, this would switch to the previous song
  };

  const handleNext = () => {
    // In a real app, this would switch to the next song
    console.log('Next song');
  };

  const handleProgressPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const progressWidth = width - 40; // Account for padding
    const percentage = locationX / progressWidth;
    const newTime = Math.floor(totalDuration * percentage);
    setCurrentTime(Math.max(0, Math.min(totalDuration, newTime)));
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
            source={{ uri: song.artwork }}
            style={styles.artwork}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, { color: C.text }]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={[styles.artistName, { color: C.textSecondary }]} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: C.textSecondary }]}>
            {formatTime(currentTime)}
          </Text>
          <Text style={[styles.timeText, { color: C.textSecondary }]}>
            {formatTime(totalDuration)}
          </Text>
        </View>
        
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
                  width: `${progressPercentage}%`
                }
              ]} 
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Controls */}
      <View style={styles.mainControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleButtonPress(handlePrevious)}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-back" size={32} color={C.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleButtonPress(handleSkipBackward)}
          activeOpacity={0.7}
        >
          <Ionicons name="play-back" size={24} color={C.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: '#ff6b35' }]}
          onPress={() => handleButtonPress(handlePlayPause)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={32} 
            color="white"
            style={!isPlaying ? { marginLeft: 3 } : {}}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleButtonPress(handleSkipForward)}
          activeOpacity={0.7}
        >
          <Ionicons name="play-forward" size={24} color={C.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => handleButtonPress(handleNext)}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-forward" size={32} color={C.text} />
        </TouchableOpacity>
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setIsFavorite(!isFavorite)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? '#ff6b35' : C.textMuted} 
          />
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
          <Ionicons name="tv-outline" size={24} color={C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={C.textMuted} />
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
    marginBottom: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    marginBottom: 40,
    gap: 20,
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
    marginHorizontal: 10,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  lyricsSection: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  lyricsText: {
    fontSize: 16,
    fontWeight: '500',
  },
});