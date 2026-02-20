import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Switch,
    ScrollView,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MiniPlayer from '@/components/MiniPlayer';

interface SettingRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sublabel?: string;
    right?: React.ReactNode;
    onPress?: () => void;
}

function SettingRow({ icon, label, sublabel, right, onPress }: SettingRowProps) {
    const C = useThemeColors();
    return (
        <TouchableOpacity
            style={[styles.row, { borderBottomColor: C.border }]}
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
        >
            <View style={[styles.iconBox, { backgroundColor: C.surface }]}>
                <Ionicons name={icon} size={18} color={C.primary} />
            </View>
            <View style={styles.rowInfo}>
                <Text style={[styles.rowLabel, { color: C.text }]}>{label}</Text>
                {sublabel && (
                    <Text style={[styles.rowSub, { color: C.textMuted }]}>{sublabel}</Text>
                )}
            </View>
            {right ?? <Ionicons name="chevron-forward" size={16} color={C.textMuted} />}
        </TouchableOpacity>
    );
}

export default function SettingsScreen() {
    const C = useThemeColors();
    const scheme = useColorScheme() ?? 'light';
    const [notifications, setNotifications] = React.useState(true);
    const [highQuality, setHighQuality] = React.useState(true);
    const [autoPlay, setAutoPlay] = React.useState(false);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
            <StatusBar
                barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={C.background}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: C.text }]}>Settings</Text>
                </View>

                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: C.card, shadowColor: '#000' }]}>
                    <View style={[styles.avatar, { backgroundColor: C.primary }]}>
                        <Ionicons name="person" size={28} color="#fff" />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: C.text }]}>Music Lover</Text>
                        <Text style={[styles.profileSub, { color: C.textSecondary }]}>
                            Free Plan
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.upgradeBtn, { borderColor: C.primary }]}>
                        <Text style={[styles.upgradeText, { color: C.primary }]}>Upgrade</Text>
                    </TouchableOpacity>
                </View>

                {/* Section: Playback */}
                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>PLAYBACK</Text>
                <View style={[styles.group, { backgroundColor: C.card }]}>
                    <SettingRow
                        icon="musical-note"
                        label="Audio Quality"
                        sublabel="High (320kbps)"
                        right={
                            <Switch
                                value={highQuality}
                                onValueChange={setHighQuality}
                                trackColor={{ true: C.primary, false: C.border }}
                                thumbColor="#fff"
                            />
                        }
                    />
                    <SettingRow
                        icon="play-circle"
                        label="Autoplay"
                        sublabel="Play similar songs when queue ends"
                        right={
                            <Switch
                                value={autoPlay}
                                onValueChange={setAutoPlay}
                                trackColor={{ true: C.primary, false: C.border }}
                                thumbColor="#fff"
                            />
                        }
                    />
                    <SettingRow icon="download" label="Downloads" sublabel="Manage offline music" />
                </View>

                {/* Section: Notifications */}
                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>NOTIFICATIONS</Text>
                <View style={[styles.group, { backgroundColor: C.card }]}>
                    <SettingRow
                        icon="notifications"
                        label="Push Notifications"
                        right={
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ true: C.primary, false: C.border }}
                                thumbColor="#fff"
                            />
                        }
                    />
                </View>

                {/* Section: General */}
                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>GENERAL</Text>
                <View style={[styles.group, { backgroundColor: C.card }]}>
                    <SettingRow icon="language" label="Language" sublabel="English" />
                    <SettingRow icon="shield-checkmark" label="Privacy Policy" />
                    <SettingRow icon="document-text" label="Terms of Service" />
                    <SettingRow icon="information-circle" label="About Mume" sublabel="v1.0.0" />
                </View>

                {/* Sign Out */}
                <TouchableOpacity
                    style={[styles.signOut, { backgroundColor: C.card, borderColor: '#FF4444' }]}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out-outline" size={20} color="#FF4444" />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>

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
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        gap: 12,
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '700',
    },
    profileSub: {
        fontSize: 13,
        marginTop: 2,
    },
    upgradeBtn: {
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    upgradeText: {
        fontWeight: '700',
        fontSize: 13,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginHorizontal: 20,
        marginBottom: 8,
        marginTop: 4,
    },
    group: {
        marginHorizontal: 20,
        borderRadius: 14,
        marginBottom: 20,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowInfo: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    rowSub: {
        fontSize: 12,
        marginTop: 1,
    },
    signOut: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 4,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    signOutText: {
        color: '#FF4444',
        fontWeight: '700',
        fontSize: 15,
    },
});
