import React, { useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    removeFromQueue,
    moveInQueue,
    clearUpcoming,
    playFromQueue,
    setCurrentSong,
    saveQueueToStorage,
} from '@/store/slices/playerSlice';

interface QueueScreenProps {
    onClose: () => void;
}

export default function QueueScreen({ onClose }: QueueScreenProps) {
    const C = useThemeColors();
    const dispatch = useAppDispatch();
    const { queue, currentSong } = useAppSelector(s => s.player);

    // Save queue to AsyncStorage on any change
    useEffect(() => {
        dispatch(saveQueueToStorage());
    }, [queue, currentSong, dispatch]);

    const currentIdx = currentSong
        ? queue.findIndex(s => s.id === currentSong.id)
        : -1;

    // Songs that have been played / are before the current
    const playedSongs = currentIdx > 0 ? queue.slice(0, currentIdx) : [];
    // The currently playing song
    const nowPlaying = currentSong ? [currentSong] : [];
    // Songs coming up next
    const upcomingSongs = currentIdx >= 0 ? queue.slice(currentIdx + 1) : queue;

    const formatDuration = (seconds: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlay = useCallback((songId: string) => {
        dispatch(playFromQueue(songId));
    }, [dispatch]);

    const handleRemove = useCallback((songId: string) => {
        if (currentSong?.id === songId) {
            Alert.alert('Cannot Remove', 'Cannot remove the currently playing song.');
            return;
        }
        dispatch(removeFromQueue(songId));
    }, [dispatch, currentSong]);

    const handleMoveUp = useCallback((songId: string) => {
        dispatch(moveInQueue({ songId, direction: 'up' }));
    }, [dispatch]);

    const handleMoveDown = useCallback((songId: string) => {
        dispatch(moveInQueue({ songId, direction: 'down' }));
    }, [dispatch]);

    const handleClearUpcoming = useCallback(() => {
        Alert.alert(
            'Clear Queue',
            'Remove all upcoming songs from the queue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => dispatch(clearUpcoming()),
                },
            ]
        );
    }, [dispatch]);

    type SectionItem =
        | { type: 'header'; title: string; count: number; showClear?: boolean }
        | { type: 'song'; song: any; isPlaying: boolean; canMoveUp: boolean; canMoveDown: boolean; isUpcoming: boolean };

    const buildListData = (): SectionItem[] => {
        const data: SectionItem[] = [];

        // History section
        if (playedSongs.length > 0) {
            data.push({ type: 'header', title: 'Previously Played', count: playedSongs.length });
            playedSongs.forEach(song => {
                data.push({ type: 'song', song, isPlaying: false, canMoveUp: false, canMoveDown: false, isUpcoming: false });
            });
        }

        // Now playing
        if (nowPlaying.length > 0) {
            data.push({ type: 'header', title: 'Now Playing', count: 1 });
            data.push({ type: 'song', song: nowPlaying[0], isPlaying: true, canMoveUp: false, canMoveDown: false, isUpcoming: false });
        }

        // Up next
        data.push({ type: 'header', title: 'Up Next', count: upcomingSongs.length, showClear: upcomingSongs.length > 0 });
        upcomingSongs.forEach((song, idx) => {
            data.push({
                type: 'song',
                song,
                isPlaying: false,
                canMoveUp: idx > 0,
                canMoveDown: idx < upcomingSongs.length - 1,
                isUpcoming: true,
            });
        });

        return data;
    };

    const listData = buildListData();

    const renderItem = ({ item }: { item: SectionItem }) => {
        if (item.type === 'header') {
            return (
                <View style={[styles.sectionHeader, { borderBottomColor: C.border }]}>
                    <View style={styles.sectionHeaderLeft}>
                        <Text style={[styles.sectionTitle, { color: C.text }]}>{item.title}</Text>
                        <View style={[styles.countBadge, { backgroundColor: C.primary + '20' }]}>
                            <Text style={[styles.countText, { color: C.primary }]}>{item.count}</Text>
                        </View>
                    </View>
                    {item.showClear && (
                        <TouchableOpacity
                            onPress={handleClearUpcoming}
                            style={styles.clearBtn}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.clearText, { color: '#ff4444' }]}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        const { song, isPlaying: isNowPlaying, canMoveUp, canMoveDown, isUpcoming } = item;

        return (
            <View
                style={[
                    styles.songRow,
                    { borderBottomColor: C.border },
                    isNowPlaying && { backgroundColor: C.primary + '10' },
                ]}
            >
                {/* Playback / number indicator */}
                <TouchableOpacity
                    style={styles.playIndicator}
                    onPress={() => !isNowPlaying && handlePlay(song.id)}
                    activeOpacity={0.7}
                >
                    {isNowPlaying ? (
                        <View style={styles.nowPlayingBars}>
                            <View style={[styles.bar, styles.bar1, { backgroundColor: C.primary }]} />
                            <View style={[styles.bar, styles.bar2, { backgroundColor: C.primary }]} />
                            <View style={[styles.bar, styles.bar3, { backgroundColor: C.primary }]} />
                        </View>
                    ) : (
                        <Ionicons name="play" size={16} color={C.textMuted} />
                    )}
                </TouchableOpacity>

                {/* Artwork */}
                <Image
                    source={{ uri: song.artwork }}
                    style={styles.artwork}
                    resizeMode="cover"
                />

                {/* Song info */}
                <TouchableOpacity
                    style={styles.songInfo}
                    onPress={() => !isNowPlaying && handlePlay(song.id)}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[styles.songTitle, { color: isNowPlaying ? C.primary : C.text }]}
                        numberOfLines={1}
                    >
                        {song.title}
                    </Text>
                    <Text style={[styles.songArtist, { color: C.textSecondary }]} numberOfLines={1}>
                        {song.artist}{song.duration ? ` · ${formatDuration(song.duration)}` : ''}
                    </Text>
                </TouchableOpacity>

                {/* Actions — only for upcoming songs, not now playing */}
                {isUpcoming && (
                    <View style={styles.actions}>
                        {/* Move up */}
                        <TouchableOpacity
                            onPress={() => canMoveUp && handleMoveUp(song.id)}
                            style={[styles.actionBtn, !canMoveUp && styles.actionBtnDisabled]}
                            activeOpacity={canMoveUp ? 0.6 : 1}
                            disabled={!canMoveUp}
                        >
                            <Ionicons name="chevron-up" size={18} color={canMoveUp ? C.text : C.border} />
                        </TouchableOpacity>

                        {/* Move down */}
                        <TouchableOpacity
                            onPress={() => canMoveDown && handleMoveDown(song.id)}
                            style={[styles.actionBtn, !canMoveDown && styles.actionBtnDisabled]}
                            activeOpacity={canMoveDown ? 0.6 : 1}
                            disabled={!canMoveDown}
                        >
                            <Ionicons name="chevron-down" size={18} color={canMoveDown ? C.text : C.border} />
                        </TouchableOpacity>

                        {/* Remove */}
                        <TouchableOpacity
                            onPress={() => handleRemove(song.id)}
                            style={styles.actionBtn}
                            activeOpacity={0.6}
                        >
                            <Ionicons name="close-circle" size={18} color="#ff4444" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Now playing indicator */}
                {isNowPlaying && (
                    <View style={styles.nowPlayingTag}>
                        <Ionicons name="volume-high" size={16} color={C.primary} />
                    </View>
                )}

                {/* Played songs — just a muted play icon */}
                {!isNowPlaying && !isUpcoming && (
                    <TouchableOpacity
                        onPress={() => handlePlay(song.id)}
                        style={styles.replayBtn}
                        activeOpacity={0.6}
                    >
                        <Ionicons name="refresh" size={16} color={C.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: C.border }]}>
                <TouchableOpacity onPress={onClose} style={styles.headerBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-down" size={28} color={C.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: C.text }]}>Queue</Text>

                <View style={styles.headerBtn}>
                    <Text style={[styles.totalCount, { color: C.textMuted }]}>{queue.length} songs</Text>
                </View>
            </View>

            {/* Queue list */}
            {queue.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="list" size={56} color={C.textMuted} />
                    <Text style={[styles.emptyTitle, { color: C.textMuted }]}>Queue is Empty</Text>
                    <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
                        Play a song to start building your queue
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={listData}
                    keyExtractor={(item, index) => {
                        if (item.type === 'header') return `header-${item.title}-${index}`;
                        return `song-${item.song.id}-${index}`;
                    }}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerBtn: {
        width: 70,
        height: 44,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    totalCount: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'right',
    },
    // Section headers
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    countBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
    },
    clearBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    clearText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Song row
    songRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    playIndicator: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    artwork: {
        width: 44,
        height: 44,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#2a2a2a',
    },
    songInfo: {
        flex: 1,
        marginRight: 8,
    },
    songTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    songArtist: {
        fontSize: 12,
        fontWeight: '400',
    },
    // Actions
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    actionBtn: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
    },
    actionBtnDisabled: {
        opacity: 0.3,
    },
    // Now playing
    nowPlayingTag: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nowPlayingBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2,
        height: 14,
    },
    bar: {
        width: 3,
        borderRadius: 1.5,
    },
    bar1: {
        height: 8,
    },
    bar2: {
        height: 14,
    },
    bar3: {
        height: 10,
    },
    replayBtn: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Empty state
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingBottom: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtitle: {
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
