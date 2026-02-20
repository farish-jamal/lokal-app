import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { togglePlay, playNext, playPrev } from '@/store/slices/playerSlice';

const { width: SW } = Dimensions.get('window');

export default function MiniPlayer() {
    const C = useThemeColors();
    const dispatch = useAppDispatch();
    const { currentSong, isPlaying } = useAppSelector(s => s.player);

    if (!currentSong) return null;

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: C.card,
                    borderTopColor: C.border,
                    shadowColor: '#000',
                },
            ]}
        >
            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
                <View style={[styles.progressFill, { backgroundColor: C.primary, width: '35%' }]} />
            </View>

            <View style={styles.inner}>
                {/* Artwork */}
                <Image
                    source={{ uri: currentSong.artwork }}
                    style={styles.artwork}
                    resizeMode="cover"
                />

                {/* Song info */}
                <View style={styles.info}>
                    <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
                        {currentSong.title}
                    </Text>
                    <Text style={[styles.artist, { color: C.textSecondary }]} numberOfLines={1}>
                        {currentSong.artist}
                    </Text>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        onPress={() => dispatch(playPrev())}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="play-skip-back" size={20} color={C.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => dispatch(togglePlay())}
                        style={[styles.playBtn, { backgroundColor: C.primary }]}
                    >
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={18}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => dispatch(playNext())}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="play-skip-forward" size={20} color={C.text} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 84 : 0,
        left: 0,
        right: 0,
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        elevation: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    progressTrack: {
        height: 2,
        width: SW,
    },
    progressFill: {
        height: 2,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 12,
    },
    artwork: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#2a2a2a',
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    artist: {
        fontSize: 12,
        marginTop: 2,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    playBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
