import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';
import { Artist } from '@/store/data/dummyData';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface ArtistCardProps {
    artist: Artist;
    size?: number;
}

export default function ArtistCard({ artist, size = 110 }: ArtistCardProps) {
    const C = useThemeColors();

    return (
        <TouchableOpacity style={[styles.container, { width: size }]} activeOpacity={0.8}>
            <Image
                source={{ uri: artist.image }}
                style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
                resizeMode="cover"
            />
            <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
                {artist.name}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginRight: 16,
    },
    image: {
        backgroundColor: '#2a2a2a',
    },
    name: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
});
