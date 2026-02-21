import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, StatusBar, Platform, FlatList, Keyboard,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SongRow from '@/components/SongRow';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const Tag = ({ label, value, color }: { label: string; value: string, color: string }) => (
    <View style={styles.tag}>
        <Text style={[styles.tagLabel, { color: color + '90' }]}>{label}: </Text>
        <Text style={[styles.tagValue, { color: color }]}>{value}</Text>
    </View>
);

export default function LyraScreen() {
    const C = useThemeColors();
    const scheme = useColorScheme() ?? 'light';

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [aiResponse, setAiResponse] = useState({
        message: 'How can I help you find music today?',
        mood: '',
        language: '',
        era: ''
    });
    const [recommendedSongs, setRecommendedSongs] = useState<any[]>([]);

    const handleGetVibes = async () => {
        if (!query.trim()) return;
        Keyboard.dismiss();
        setLoading(true);
        setErrorMsg('');
        setRecommendedSongs([]);
        setAiResponse({ message: 'Analyzing your vibes...', mood: '', language: '', era: '' });

        if (!API_KEY) {
            setLoading(false);
            setErrorMsg('Gemini API key is not configured.');
            return;
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `You are Lyra, an AI music assistant specialized in recommending highly popular mainstream Hindi Bollywood songs that are widely available on major streaming platforms like JioSaavn, Spotify, Gaana, and YouTube Music.

For any given vibe/description: "${query}", follow these strict rules:

Always prioritize well-known, commercially successful Hindi Bollywood songs.

Prefer songs from famous artists (e.g., Arijit Singh, Atif Aslam, Shreya Ghoshal, Sonu Nigam, KK, Jubin Nautiyal, Neha Kakkar, etc.).

Prefer songs from popular Bollywood movies.

Avoid obscure indie songs, remixes, live versions, regional-only tracks, or rare albums.

Choose songs that are highly likely to appear in music APIs when searched by title.

Ensure song titles are exact and commonly used spellings.

If the query is unclear, default to popular Hindi Bollywood romantic or feel-good songs.

Respond ONLY with valid JSON in this exact format, with no markdown formatting or backticks:

{
"message": "A short, friendly message introducing the songs based on the vibe.",
"mood": "Detected mood (Romantic, Sad, Party, Motivational, Chill, etc.)",
"language": "Hindi",
"era": "2000s, 2010s, 2020s, or Mixed",
"songs": [
{"title": "Exact Song Title", "artist": "Main Artist Name"},
{"title": "Exact Song Title", "artist": "Main Artist Name"},
{"title": "Exact Song Title", "artist": "Main Artist Name"},
{"title": "Exact Song Title", "artist": "Main Artist Name"},
{"title": "Exact Song Title", "artist": "Main Artist Name"}
]
}

Do not include explanations, markdown, comments, or extra text. Only return valid JSON.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            console.log(text, "<<<TEXT");

            const parsed = JSON.parse(text);
            if (parsed.message) {
                setAiResponse({
                    message: parsed.message,
                    mood: parsed.mood || '',
                    language: parsed.language || '',
                    era: parsed.era || ''
                });
            }

            const songsToSearch = parsed.songs || [];
            const fetchedSongs = [];

            for (const song of songsToSearch) {
                try {
                    const searchTerm = `${song.title}`;
                    const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(searchTerm)}`);
                    const json = await res.json();
                    console.log(json, "<<<JSON");

                    if (json.success && json.data?.results?.length > 0) {
                        const item = json.data.results[0];
                        // Extract highest quality download URL (usually 320kbps)
                        const playableUrl = item.downloadUrl?.find((d: any) => d.quality === '320kbps')?.url
                            || item.downloadUrl?.[item.downloadUrl.length - 1]?.url
                            || item.url;

                        fetchedSongs.push({
                            id: item.id,
                            title: item.name || item.title || '',
                            artist: item.artists?.primary?.map((a: any) => a.name).join(', ') || item.primaryArtists || '',
                            album: item.album?.name || item.album || '',
                            duration: item.duration || 0,
                            artwork: item.image?.find((i: any) => i.quality === '500x500')?.url || item.image?.[item.image.length - 1]?.url || '',
                            url: playableUrl,
                            isFavorite: false,
                        });
                    }
                } catch (e) {
                    console.log('Error fetching song:', song.title, e);
                }
            }

            setRecommendedSongs(fetchedSongs);
        } catch (error) {
            console.log(error);
            setErrorMsg('Oops, something went wrong finding your vibes.');
        } finally {
            setLoading(false);
        }
    };

    const isDark = scheme === 'dark';
    const bgColors = (isDark
        ? [C.background, '#1a1410', '#000000']
        : [C.background, '#FFF8F3', '#FFF0E6']) as [string, string, ...string[]];

    return (
        <LinearGradient
            colors={bgColors}
            style={styles.container}
        >
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                <View style={[styles.header, { borderBottomColor: C.border }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={28} color={C.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: C.text }]}>AI Song Assistant</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)', borderColor: C.border }]}>
                    <TextInput
                        style={[styles.input, { color: C.text }]}
                        placeholder="Romantic 2000s Bollywood songs"
                        placeholderTextColor={isDark ? '#94a3b8' : '#94a3b8'}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleGetVibes}
                    />
                    <TouchableOpacity onPress={handleGetVibes}>
                        <LinearGradient
                            colors={[C.primary, isDark ? '#D97706' : '#EA580C']}
                            style={styles.btn}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.btnText}>Get Vibes</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {errorMsg ? (
                    <Text style={[styles.errorText, { color: isDark ? '#fda4af' : '#E11D48' }]}>{errorMsg}</Text>
                ) : null}

                {!loading && (aiResponse.message !== 'How can I help you find music today?' || recommendedSongs.length > 0) && (
                    <LinearGradient
                        colors={isDark ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] : ['rgba(249,115,22,0.05)', 'rgba(249,115,22,0.02)']}
                        style={[styles.chatBubble, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(249,115,22,0.1)' }]}
                    >
                        <View style={styles.chatHeader}>
                            <View style={[styles.robotIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(249,115,22,0.1)' }]}>
                                <Ionicons name="logo-android" size={28} color={C.primary} />
                                <View style={[styles.dot, { borderColor: isDark ? '#0a0a0a' : '#fff' }]} />
                            </View>
                            <View style={styles.messageContent}>
                                <Text style={[styles.chatText, { color: C.text }]}>{aiResponse.message}</Text>
                                {(aiResponse.mood || aiResponse.language || aiResponse.era) && (
                                    <View style={[styles.tagRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                        {aiResponse.mood && <Tag label="Mood" value={aiResponse.mood} color={C.text} />}
                                        <Text style={[styles.tagDivider, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]}> | </Text>
                                        {aiResponse.language && <Tag label="Language" value={aiResponse.language} color={C.text} />}
                                        <Text style={[styles.tagDivider, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]}> | </Text>
                                        {aiResponse.era && <Tag label="Era" value={aiResponse.era} color={C.text} />}
                                    </View>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                )}

                {(loading || recommendedSongs.length > 0) && (
                    <View style={[styles.listContainer, { borderTopColor: C.border }]}>
                        <Text style={[styles.listTitle, { color: C.text }]}>Recommended for You ››</Text>
                        {loading ? (
                            <View style={styles.loadingWrapper}>
                                <ActivityIndicator size="large" color={C.primary} />
                                <Text style={[styles.loadingText, { color: C.textSecondary }]}>Searching the cosmos for your tunes...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={recommendedSongs}
                                keyExtractor={(item, idx) => item.id || idx.toString()}
                                renderItem={({ item }) => <SongRow song={item} />}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
                )}

            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        borderRadius: 30,
        paddingLeft: 20,
        paddingRight: 6,
        paddingVertical: 6,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 10,
    },
    btn: {
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    btnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    errorText: {
        textAlign: 'center',
        marginHorizontal: 16,
        marginBottom: 20,
        fontSize: 13,
    },
    chatBubble: {
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    robotIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        position: 'relative',
    },
    dot: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10b981',
        borderWidth: 2,
    },
    messageContent: {
        flex: 1,
    },
    chatText: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
        marginBottom: 10,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        paddingTop: 8,
        borderTopWidth: 1,
    },
    tagDivider: {
        fontSize: 12,
        marginHorizontal: 4,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagLabel: {
        fontSize: 12,
    },
    tagValue: {
        fontSize: 12,
        fontWeight: '700',
    },
    listContainer: {
        flex: 1,
        borderTopWidth: 1,
        paddingTop: 16,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '800',
        paddingHorizontal: 16,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    loadingWrapper: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
});
