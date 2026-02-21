import React from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    SafeAreaView,
    Image,
    TouchableOpacity,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleFavoriteAsync } from '@/store/slices/librarySlice';
import { setCurrentSong } from '@/store/slices/playerSlice';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MiniPlayer from '@/components/MiniPlayer';

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function FavoritesScreen() {
    const C = useThemeColors();
    const scheme = useColorScheme() ?? 'light';
    const dispatch = useAppDispatch();
    const { favorites } = useAppSelector(s => s.library);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
            <StatusBar
                barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={C.background}
            />
            <View style={[styles.header, { backgroundColor: C.background }]}>
                <Text style={[styles.title, { color: C.text }]}>Favorites</Text>
                <Text style={[styles.subtitle, { color: C.textSecondary }]}>
                    {favorites.length} songs
                </Text>
            </View>

            {favorites.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="heart-outline" size={64} color={C.textMuted} />
                    <Text style={[styles.emptyText, { color: C.textMuted }]}>
                        No favorites yet
                    </Text>
                    <Text style={[styles.emptySubText, { color: C.textMuted }]}>
                        Tap the heart on any song to add it here
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.row, { borderBottomColor: C.border }]}
                            activeOpacity={0.7}
                            onPress={() => dispatch(setCurrentSong(item))}
                        >
                            <Image
                                source={{ uri: item.artwork }}
                                style={styles.artwork}
                                resizeMode="cover"
                            />
                            <View style={styles.info}>
                                <Text style={[styles.songTitle, { color: C.text }]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.artist, { color: C.textSecondary }]} numberOfLines={1}>
                                    {item.artist}
                                </Text>
                            </View>
                            <Text style={[styles.duration, { color: C.textMuted }]}>
                                {formatDuration(item.duration)}
                            </Text>
                            <TouchableOpacity
                                onPress={() => dispatch(toggleFavoriteAsync(item))}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="heart" size={20} color={C.primary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            )}
            <MiniPlayer />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
    },
    emptySubText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    artwork: {
        width: 52,
        height: 52,
        borderRadius: 8,
        backgroundColor: '#2a2a2a',
    },
    info: {
        flex: 1,
    },
    songTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    artist: {
        fontSize: 13,
        marginTop: 2,
    },
    duration: {
        fontSize: 13,
        marginRight: 8,
    },
});
