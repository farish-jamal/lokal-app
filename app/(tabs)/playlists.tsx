import React, { useEffect, useState } from 'react';
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
    ActivityIndicator,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchPlaylist } from '@/store/slices/librarySlice';
import { Playlist } from '@/services/api';
import MiniPlayer from '@/components/MiniPlayer';
import SongRow from '@/components/SongRow';

const SAMPLE_PLAYLISTS = [
    {
        name: "Best of Indie - English",
        url: "https://www.jiosaavn.com/featured/best-of-2010s-hindi/gn19HTwL-lfgEhiRleA1SQ__",
        description: "The Best Desi Indie in English"
    },

];

export default function PlaylistsScreen() {
    const C = useThemeColors();
    const scheme = useColorScheme() ?? 'light';
    const dispatch = useAppDispatch();
    const { playlists, currentPlaylist, loading } = useAppSelector(s => s.library);
    
    const [showPlaylistDetail, setShowPlaylistDetail] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        const loadInitialPlaylists = async () => {
            if (isInitialized || playlists.length > 0) return;
            
            setIsInitialized(true);
            try {
                await dispatch(fetchPlaylist(SAMPLE_PLAYLISTS[0].url)).unwrap();
            } catch (error) {
                console.log('Failed to load initial playlist:', error);
            }
        };
        
        loadInitialPlaylists();
    }, [dispatch, isInitialized, playlists.length]);

    const handlePlaylistPress = async (playlist: Playlist) => {
        try {
            await dispatch(fetchPlaylist('https://www.jiosaavn.com/featured/its-indie-english/AMoxtXyKHoU_')).unwrap();
            setShowPlaylistDetail(true);
        } catch (error) {
            Alert.alert('Error', 'Failed to load playlist details');
        }
    };

    const handleLoadSamplePlaylist = async (playlistUrl: string) => {
        try {
            await dispatch(fetchPlaylist(playlistUrl)).unwrap();
            Alert.alert('Success', 'Playlist loaded successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to load playlist. Please check the URL.');
        }
    };

    const renderPlaylistItem = ({ item }: { item: Playlist }) => {
        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: C.card, shadowColor: '#000' }]}
                activeOpacity={0.8}
                onPress={() => handlePlaylistPress(item)}
            >
                <Image
                    source={{ uri: item.artwork || 'https://via.placeholder.com/60x60?text=No+Image' }}
                    style={styles.artwork}
                    resizeMode="cover"
                />
                <View style={styles.info}>
                    <Text style={[styles.playlistName, { color: C.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.desc, { color: C.textSecondary }]} numberOfLines={2}>
                        {item.description || 'No description'}
                    </Text>
                    <View style={styles.meta}>
                        <Ionicons name="musical-note" size={12} color={C.primary} />
                        <Text style={[styles.metaText, { color: C.textMuted }]}>
                            {item.songCount} songs
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => handlePlaylistPress(item)}>
                    <Ionicons name="play-circle" size={38} color={C.primary} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const renderSamplePlaylistItem = ({ item }: { item: typeof SAMPLE_PLAYLISTS[0] }) => {
        return (
            <TouchableOpacity
                style={[styles.sampleCard, { backgroundColor: C.surface, borderColor: C.border }]}
                activeOpacity={0.8}
                onPress={() => handleLoadSamplePlaylist(item.url)}
                disabled={loading.playlists}
            >
                <View style={styles.sampleInfo}>
                    <Text style={[styles.sampleName, { color: C.text }]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.sampleDesc, { color: C.textSecondary }]}>
                        {item.description}
                    </Text>
                </View>
                {loading.playlists ? (
                    <ActivityIndicator size="small" color={C.primary} />
                ) : (
                    <Ionicons name="download-outline" size={20} color={C.primary} />
                )}
            </TouchableOpacity>
        );
    };

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
                    style={[styles.createBtn, { backgroundColor: C.primary, opacity: loading.playlists ? 0.6 : 1 }]}
                    activeOpacity={0.8}
                    disabled={loading.playlists}
                    onPress={() => {
                        // Load the next available sample playlist
                        const availablePlaylists = SAMPLE_PLAYLISTS.filter(sample => 
                            !playlists.some(p => sample.url.includes(p.id))
                        );
                        if (availablePlaylists.length > 0) {
                            handleLoadSamplePlaylist(availablePlaylists[0].url);
                        }
                    }}
                >
                    {loading.playlists ? (
                        <ActivityIndicator size={16} color="#fff" />
                    ) : (
                        <Ionicons name="add" size={20} color="#fff" />
                    )}
                    <Text style={styles.createBtnText}>
                        {loading.playlists ? 'Loading...' : 'Load More'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Your Playlists Section */}
                {playlists.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: C.text }]}>
                            Your Playlists ({playlists.length})
                        </Text>
                        {loading.playlists && playlists.length === 0 ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={C.primary} />
                                <Text style={[styles.loadingText, { color: C.textSecondary }]}>
                                    Loading playlist...
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={playlists}
                                keyExtractor={item => item.id}
                                renderItem={renderPlaylistItem}
                                scrollEnabled={false}
                                contentContainerStyle={{ paddingHorizontal: 20 }}
                            />
                        )}
                    </View>
                )}

                {/* Sample Playlists Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: C.text }]}>
                        {playlists.length === 0 && !loading.playlists ? 'Load More Playlists' : 'Discover More Music'}
                    </Text>
                    {playlists.length === 0 && !loading.playlists && (
                        <Text style={[styles.sectionSubtitle, { color: C.textSecondary }]}>
                            Tap any playlist below to load it with real songs from JioSaavn
                        </Text>
                    )}
                    <FlatList
                        data={SAMPLE_PLAYLISTS.filter(sample => 
                            !playlists.some(p => sample.url.includes(p.id))
                        )}
                        keyExtractor={(item, index) => `sample-${index}`}
                        renderItem={renderSamplePlaylistItem}
                        scrollEnabled={false}
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                    />
                </View>
            </ScrollView>
            <MiniPlayer />

            {/* Playlist Detail Modal */}
            <Modal
                visible={showPlaylistDetail && currentPlaylist !== null}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowPlaylistDetail(false)}
            >
                {currentPlaylist && (
                    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
                        <StatusBar
                            barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
                            backgroundColor={C.background}
                        />
                        
                        {/* Modal Header */}
                        <View style={[styles.modalHeader, { backgroundColor: C.background, borderBottomColor: C.border }]}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setShowPlaylistDetail(false)}
                            >
                                <Ionicons name="arrow-back" size={24} color={C.text} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: C.text }]} numberOfLines={1}>
                                {currentPlaylist.name}
                            </Text>
                            <View style={styles.backButton} />
                        </View>

                        {/* Playlist Header */}
                        <View style={styles.playlistHeader}>
                            <Image
                                source={{ uri: currentPlaylist.artwork || 'https://via.placeholder.com/200x200?text=No+Image' }}
                                style={styles.playlistArtwork}
                                resizeMode="cover"
                            />
                            <Text style={[styles.playlistTitle, { color: C.text }]}>
                                {currentPlaylist.name}
                            </Text>
                            {currentPlaylist.description && (
                                <Text style={[styles.playlistDescription, { color: C.textSecondary }]}>
                                    {currentPlaylist.description}
                                </Text>
                            )}
                            <Text style={[styles.playlistMeta, { color: C.textMuted }]}>
                                {currentPlaylist.songCount} songs
                            </Text>
                        </View>

                        {/* Songs List */}
                        {currentPlaylist.songs && currentPlaylist.songs.length > 0 ? (
                            <FlatList
                                data={currentPlaylist.songs}
                                keyExtractor={item => item.id}
                                style={{ flex: 1 }}
                                contentContainerStyle={{ paddingBottom: 100 }}
                                renderItem={({ item, index }) => (
                                    <SongRow
                                        song={item}
                                        index={index + 1}
                                        onPress={() => {
                                            // Handle song press - integrate with your existing player
                                            console.log('Playing song:', item.title);
                                        }}
                                    />
                                )}
                            />
                        ) : (
                            <View style={styles.emptySongsContainer}>
                                <Ionicons name="musical-notes-outline" size={48} color={C.textMuted} />
                                <Text style={[styles.emptySongsText, { color: C.textMuted }]}>
                                    No songs available
                                </Text>
                            </View>
                        )}
                    </SafeAreaView>
                )}
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 16,
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    sampleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
    },
    sampleInfo: {
        flex: 1,
    },
    sampleName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    sampleDesc: {
        fontSize: 13,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    playlistHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    playlistArtwork: {
        width: 200,
        height: 200,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: '#2a2a2a',
    },
    playlistTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    playlistDescription: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 20,
    },
    playlistMeta: {
        fontSize: 13,
        textAlign: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
    },
    emptySongsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptySongsText: {
        fontSize: 16,
        marginTop: 12,
    },
});
