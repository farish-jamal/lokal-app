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
import { PLAYLISTS, SONGS } from '@/store/data/dummyData';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MiniPlayer from '@/components/MiniPlayer';

export default function PlaylistsScreen() {
    const C = useThemeColors();
    const scheme = useColorScheme() ?? 'light';

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
            <StatusBar
                barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={C.background}
            />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: C.background }]}>
                <Text style={[styles.title, { color: C.text }]}>Playlists</Text>
                <TouchableOpacity
                    style={[styles.createBtn, { backgroundColor: C.primary }]}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.createBtnText}>New</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={PLAYLISTS}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const songCount = item.songs.length;
                    return (
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: C.card, shadowColor: '#000' }]}
                            activeOpacity={0.8}
                        >
                            <Image
                                source={{ uri: item.artwork }}
                                style={styles.artwork}
                                resizeMode="cover"
                            />
                            <View style={styles.info}>
                                <Text style={[styles.playlistName, { color: C.text }]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.desc, { color: C.textSecondary }]} numberOfLines={1}>
                                    {item.description}
                                </Text>
                                <View style={styles.meta}>
                                    <Ionicons name="musical-note" size={12} color={C.primary} />
                                    <Text style={[styles.metaText, { color: C.textMuted }]}>
                                        {songCount} songs
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="play-circle" size={38} color={C.primary} />
                        </TouchableOpacity>
                    );
                }}
            />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    createBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        gap: 12,
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    artwork: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: '#2a2a2a',
    },
    info: {
        flex: 1,
        gap: 3,
    },
    playlistName: {
        fontSize: 16,
        fontWeight: '700',
    },
    desc: {
        fontSize: 13,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    metaText: {
        fontSize: 12,
    },
});
