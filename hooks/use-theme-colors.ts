import { Colors } from '@/constants/theme';
import { useColorScheme } from './use-color-scheme';

export function useThemeColors() {
    const scheme = useColorScheme() ?? 'light';
    return Colors[scheme];
}
