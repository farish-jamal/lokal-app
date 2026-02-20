import React from 'react';
import {
    TouchableOpacity,
    Image,
    Text,
    StyleSheet,
    View,
    Dimensions,
} from 'react-native';
import { Song } from '@/store/data/dummyData';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentSong } from '@/store/slices/playerSlice';

interface SongCardProps {
    song: Song;
    width?: number;
    onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2.5;

export default function SongCard({ song, width, onPress }: SongCardProps) {
    const C = useThemeColors();
    const dispatch = useAppDispatch();
    const cardWidth = width ?? CARD_WIDTH;

    const handlePress = () => {
        dispatch(setCurrentSong(song));
        if (onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, { width: cardWidth }]}
            activeOpacity={0.8}
            onPress={handlePress}
        >
            <Image
                source={{ uri: song.artwork }}
                style={[styles.artwork, { width: cardWidth, height: cardWidth }]}
                resizeMode="cover"
            />
            <View style={styles.info}>
                <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
                    {song.title}
                </Text>
                <Text style={[styles.artist, { color: C.textSecondary }]} numberOfLines={1}>
                    {song.artist}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginRight: 12,
    },
    artwork: {
        borderRadius: 10,
        backgroundColor: '#2a2a2a',
    },
    info: {
        marginTop: 7,
        gap: 2,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 17,
    },
    artist: {
        fontSize: 11,
        fontWeight: '400',
        lineHeight: 14,
    },
});
