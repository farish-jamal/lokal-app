import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '@/store/data/dummyData';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentSong, togglePlay } from '@/store/slices/playerSlice';

interface SongRowProps {
    song: Song;
    onMorePress?: () => void;
    onPress?: () => void;
}

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    return `${mm}:${ss} mins`;
}

export default function SongRow({ song, onMorePress, onPress }: SongRowProps) {
    const C = useThemeColors();
    const dispatch = useAppDispatch();
    const { currentSong, isPlaying } = useAppSelector(s => s.player);

    const isActive = currentSong?.id === song.id;

    function handlePlay() {
        if (isActive) {
            dispatch(togglePlay());
        } else {
            dispatch(setCurrentSong(song));
        }
    }

    function handleSongPress() {
        handlePlay();
        if (onPress) {
            onPress();
        }
    }

    return (
        <View style={[styles.container, { borderBottomColor: C.border }]}>
            {/* Artwork */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleSongPress}>
                <Image
                    source={{ uri: song.artwork }}
                    style={[styles.artwork, isActive && styles.artworkActive]}
                    resizeMode="cover"
                />
            </TouchableOpacity>

            {/* Info */}
            <TouchableOpacity style={styles.info} activeOpacity={0.85} onPress={handleSongPress}>
                <Text
                    style={[
                        styles.title,
                        { color: isActive ? C.primary : C.text },
                    ]}
                    numberOfLines={1}
                >
                    {song.title.toUpperCase()}
                </Text>
                <View style={styles.meta}>
                    <Text style={[styles.artist, { color: C.textSecondary }]} numberOfLines={1}>
                        {song.artist}
                    </Text>
                    <Text style={[styles.separator, { color: C.textMuted }]}> | </Text>
                    <Text style={[styles.duration, { color: C.textMuted }]}>
                        {formatDuration(song.duration)}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Play button */}
            <TouchableOpacity onPress={handlePlay} style={styles.playBtn} activeOpacity={0.7}>
                <View style={[styles.playCircle, { backgroundColor: C.primary }]}>
                    <Ionicons
                        name={isActive && isPlaying ? 'pause' : 'play'}
                        size={16}
                        color="#fff"
                        style={{ marginLeft: isActive && isPlaying ? 0 : 2 }}
                    />
                </View>
            </TouchableOpacity>

            {/* More options */}
            <TouchableOpacity
                onPress={onMorePress}
                style={styles.moreBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
            >
                <Ionicons name="ellipsis-vertical" size={18} color={C.textMuted} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    artwork: {
        width: 58,
        height: 58,
        borderRadius: 10,
        backgroundColor: '#2a2a2a',
    },
    artworkActive: {
        opacity: 0.85,
    },
    info: {
        flex: 1,
        gap: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    artist: {
        fontSize: 12,
        fontWeight: '400',
        flexShrink: 1,
    },
    separator: {
        fontSize: 12,
    },
    duration: {
        fontSize: 12,
        flexShrink: 0,
    },
    playBtn: {
        padding: 4,
    },
    playCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreBtn: {
        padding: 4,
    },
});
