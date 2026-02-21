import { useEffect, useRef, useCallback } from 'react';
import { AVPlaybackStatus } from 'expo-av';
import audioService from '@/services/audioService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    updatePlaybackStatus,
    playNext,
    setIsPlaying,
    loadQueueFromStorage,
    saveQueueToStorage,
} from '@/store/slices/playerSlice';

/**
 * This hook bridges expo-av Audio.Sound with the Redux store.
 * Mount it ONCE at the app root so every screen (MiniPlayer, FullScreenPlayer)
 * reads the same Redux state.
 */
export function useAudioPlayer() {
    const dispatch = useAppDispatch();
    const { currentSong, isPlaying, repeat, queue, shuffle, queueLoaded } = useAppSelector(s => s.player);
    const downloadedSongs = useAppSelector(s => s.player.downloadedSongs);
    const prevSongIdRef = useRef<string | null>(null);
    const prevIsPlayingRef = useRef<boolean>(false);
    const isLoadingRef = useRef<boolean>(false);

    // Initial load
    useEffect(() => {
        dispatch(loadQueueFromStorage());
    }, [dispatch]);

    // Save to storage on changes (only after initial load has finished)
    useEffect(() => {
        if (queueLoaded) {
            dispatch(saveQueueToStorage());
        }
    }, [queue, currentSong, shuffle, repeat, queueLoaded, dispatch]);

    // Handle playback status updates
    const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            dispatch(updatePlaybackStatus({
                positionMillis: status.positionMillis || 0,
                durationMillis: status.durationMillis || 0,
                isPlaying: status.isPlaying,
                isBuffering: status.isBuffering,
            }));
        }
    }, [dispatch]);

    // Handle song finished
    const onSongFinished = useCallback(() => {
        if (repeat === 'one') {
            // replay same song
            audioService.seekTo(0).then(() => audioService.play());
        } else {
            dispatch(playNext());
        }
    }, [dispatch, repeat]);

    // Initialize audio service
    useEffect(() => {
        audioService.init();
        audioService.setCallbacks({
            onPlaybackStatusUpdate,
            onSongFinished,
        });
    }, [onPlaybackStatusUpdate, onSongFinished]);

    // Load and play when currentSong changes
    useEffect(() => {
        if (!currentSong) {
            prevSongIdRef.current = null;
            return;
        }

        if (currentSong.id !== prevSongIdRef.current) {
            prevSongIdRef.current = currentSong.id;
            isLoadingRef.current = true;

            // Check if song is downloaded
            const downloaded = downloadedSongs.find(d => d.songId === currentSong.id);
            const urlToPlay = downloaded ? downloaded.localUri : currentSong.url;

            if (urlToPlay && urlToPlay.trim() !== '') {
                audioService.loadAndPlay(urlToPlay).then((success) => {
                    isLoadingRef.current = false;
                    if (!success) {
                        dispatch(setIsPlaying(false));
                    }
                });
            } else {
                isLoadingRef.current = false;
                dispatch(setIsPlaying(false));
            }
        }
    }, [currentSong, downloadedSongs, dispatch]);

    // Handle play/pause toggle from Redux
    useEffect(() => {
        if (isLoadingRef.current) return;
        if (!currentSong) return;

        if (isPlaying !== prevIsPlayingRef.current) {
            prevIsPlayingRef.current = isPlaying;
            if (isPlaying) {
                audioService.play();
            } else {
                audioService.pause();
            }
        }
    }, [isPlaying, currentSong]);

    // Seek function
    const seekTo = useCallback(async (percentage: number) => {
        await audioService.seekToPercentage(percentage);
    }, []);

    return { seekTo };
}
