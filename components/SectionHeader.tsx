import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface SectionHeaderProps {
    title: string;
    onSeeAll?: () => void;
}

export default function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
    const C = useThemeColors();
    return (
        <View style={styles.row}>
            <Text style={[styles.title, { color: C.text }]}>{title}</Text>
            {onSeeAll && (
                <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
                    <Text style={[styles.seeAll, { color: C.primary }]}>See All</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
    },
    seeAll: {
        fontSize: 13,
        fontWeight: '600',
    },
});
