import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, StatusBar, Platform, FlatList, Keyboard,
    Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SongRow from '@/components/SongRow';
import { useAppDispatch } from '@/store/hooks';

const SearchTabs = ['Songs', 'Artists', 'Albums', 'Folders'];
const RECENT_SEARCHES_KEY = '@recent_searches';

export default function SearchScreen() {
    const C = useThemeColors();
    const scheme = useColorScheme() ?? 'light';
    const dispatch = useAppDispatch();

    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Songs');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any>(null);

    useEffect(() => {
        loadRecentSearches();
    }, []);

    const loadRecentSearches = async () => {
        try {
            const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) setRecentSearches(JSON.parse(stored));
        } catch (e) { }
    };

    const saveRecentSearch = async (term: string) => {
        if (!term.trim()) return;
        try {
            const filtered = recentSearches.filter(s => s !== term);
            const updated = [term, ...filtered].slice(0, 10);
            setRecentSearches(updated);
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (e) { }
    };

    const clearRecentSearches = async () => {
        setRecentSearches([]);
        await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const removeRecentSearch = async (term: string) => {
        const updated = recentSearches.filter(s => s !== term);
        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    const handleSearch = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setSearchResults(null);
            return;
        }
        setQuery(searchTerm);
        setLoading(true);
        saveRecentSearch(searchTerm);
        Keyboard.dismiss();
        try {
            const res = await fetch(`https://saavn.sumit.co/api/search?query=${encodeURIComponent(searchTerm)}`);
            const json = await res.json();
            if (json.success) {
                setSearchResults(json.data);
            } else {
                setSearchResults(null);
            }
        } catch (e) {
            console.log(e);
            setSearchResults(null);
        } finally {
            setLoading(false);
        }
    };

    const renderRecentSearches = () => (
        <View style={styles.recentContainer}>
            <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: C.text }]}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={[styles.clearAll, { color: C.primary }]}>Clear All</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={recentSearches}
                keyExtractor={item => item}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <View style={styles.recentRow}>
                        <TouchableOpacity
                            style={styles.recentTextWrapper}
                            onPress={() => {
                                setQuery(item);
                                handleSearch(item);
                            }}
                        >
                            <Text style={[styles.recentText, { color: C.text }]}>{item}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeRecentSearch(item)} style={styles.recentRemove}>
                            <Ionicons name="close" size={20} color={C.textMuted} />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );

    const getActiveData = () => {
        if (!searchResults) return [];
        if (activeTab === 'Songs') return searchResults.songs?.results || [];
        if (activeTab === 'Artists') return searchResults.artists?.results || [];
        if (activeTab === 'Albums') return searchResults.albums?.results || [];
        if (activeTab === 'Folders') return searchResults.playlists?.results || [];
        return [];
    };

    const renderItem = ({ item }: { item: any }) => {
        if (activeTab === 'Songs') {
            const songData = {
                id: item.id,
                title: item.title,
                artist: item.primaryArtists || item.singers || '',
                album: item.album || '',
                duration: 0,
                artwork: item.image?.find((i: any) => i.quality === '500x500')?.url || item.image?.[item.image.length - 1]?.url || '',
                url: item.url,
                isFavorite: false,
            };
            return <SongRow song={songData} />;
        }

        // Render basic row for other types
        const imageUrl = item.image?.find((i: any) => i.quality === '500x500')?.url || item.image?.[item.image.length - 1]?.url || item.image;
        return (
            <View style={[styles.genericRow, { borderBottomColor: C.border }]}>
                <Image source={{ uri: typeof imageUrl === 'string' ? imageUrl : imageUrl?.url }} style={styles.genericImage} />
                <View style={styles.genericInfo}>
                    <Text style={[styles.genericTitle, { color: C.text }]} numberOfLines={1}>{item.title || item.name}</Text>
                    <Text style={[styles.genericDesc, { color: C.textSecondary }]} numberOfLines={1}>{item.description || item.type}</Text>
                </View>
            </View>
        );
    };

    const data = getActiveData();

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                </View>
            );
        }
        if (!searchResults) {
            return renderRecentSearches();
        }
        if (data.length === 0) {
            return (
                <ScrollView contentContainerStyle={styles.centerContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.notFoundCircle}>
                        <Ionicons name="sad" size={100} color={C.primary} />
                    </View>
                    <Text style={[styles.notFoundTitle, { color: C.text }]}>Not Found</Text>
                    <Text style={[styles.notFoundDesc, { color: C.textSecondary }]}>
                        Sorry, the keyword you entered cannot be found, please check again or search with another keyword.
                    </Text>
                </ScrollView>
            );
        }
        return (
            <FlatList
                data={data}
                keyExtractor={(item, idx) => item.id || idx.toString()}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
            />
        );
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={C.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: query ? C.primary : C.border, borderWidth: query ? 1 : 0 }]}>
                    <Ionicons name="search" size={20} color={C.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.input, { color: C.text }]}
                        placeholder="Search keyword..."
                        placeholderTextColor={C.textMuted}
                        value={query}
                        onChangeText={(text) => {
                            setQuery(text);
                            if (text === '') setSearchResults(null);
                        }}
                        onSubmitEditing={() => handleSearch(query)}
                        autoFocus
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setSearchResults(null); }} style={styles.clearBtn}>
                            <Ionicons name="close-circle" size={20} color={C.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tabs */}
            {searchResults && (
                <View style={styles.tabsWrapper}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={SearchTabs}
                        keyExtractor={item => item}
                        contentContainerStyle={styles.tabsContent}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.tabChip,
                                    {
                                        backgroundColor: activeTab === item ? C.primary : 'transparent',
                                        borderColor: activeTab === item ? C.primary : 'transparent',
                                        borderWidth: 1
                                    },
                                    activeTab !== item && { borderColor: C.primary }
                                ]}
                                onPress={() => setActiveTab(item)}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: activeTab === item ? '#fff' : C.primary }
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Main Content */}
            <View style={{ flex: 1 }}>
                {renderContent()}
            </View>

        </SafeAreaView>
    );
}

import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
    },
    backBtn: {
        paddingRight: 12,
        paddingVertical: 8,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 24,
        paddingHorizontal: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    clearBtn: {
        padding: 4,
    },
    recentContainer: {
        flex: 1,
        paddingTop: 16,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    recentTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    clearAll: {
        fontSize: 14,
        fontWeight: '600',
    },
    recentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    recentTextWrapper: {
        flex: 1,
    },
    recentText: {
        fontSize: 16,
        color: '#888',
    },
    recentRemove: {
        padding: 4,
    },
    tabsWrapper: {
        paddingBottom: 16,
        paddingTop: 8,
    },
    tabsContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    tabChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 24,
        minWidth: 70,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 100,
    },
    notFoundCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    notFoundTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
    },
    notFoundDesc: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 100,
    },
    genericRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    genericImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#2a2a2a',
        marginRight: 14,
    },
    genericInfo: {
        flex: 1,
        gap: 4,
    },
    genericTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    genericDesc: {
        fontSize: 13,
    }
});
