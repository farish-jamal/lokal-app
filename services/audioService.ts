import { Audio, AVPlaybackStatus } from 'expo-av';

export type RepeatMode = 'none' | 'one' | 'all';

export interface AudioServiceCallbacks {
    onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
    onSongFinished?: () => void;
}

class AudioService {
    private sound: Audio.Sound | null = null;
    private isLoaded: boolean = false;
    private callbacks: AudioServiceCallbacks = {};
    private currentUrl: string = '';

    async init() {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
    }

    setCallbacks(callbacks: AudioServiceCallbacks) {
        this.callbacks = callbacks;
    }

    private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (this.callbacks.onPlaybackStatusUpdate) {
            this.callbacks.onPlaybackStatusUpdate(status);
        }

        if (status.isLoaded && status.didJustFinish && !status.isLooping) {
            if (this.callbacks.onSongFinished) {
                this.callbacks.onSongFinished();
            }
        }
    };

    async loadAndPlay(url: string): Promise<boolean> {
        try {
            // Don't reload if same URL is already loaded and playing
            if (this.currentUrl === url && this.isLoaded && this.sound) {
                await this.sound.playAsync();
                return true;
            }

            // Unload previous sound
            await this.unload();

            if (!url || url.trim() === '') {
                console.warn('AudioService: No URL provided');
                return false;
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true, progressUpdateIntervalMillis: 500 },
                this.onPlaybackStatusUpdate
            );

            this.sound = sound;
            this.isLoaded = true;
            this.currentUrl = url;
            return true;
        } catch (error) {
            console.error('AudioService: Error loading audio:', error);
            this.isLoaded = false;
            this.currentUrl = '';
            return false;
        }
    }

    async play() {
        if (this.sound && this.isLoaded) {
            await this.sound.playAsync();
        }
    }

    async pause() {
        if (this.sound && this.isLoaded) {
            await this.sound.pauseAsync();
        }
    }

    async togglePlayPause(): Promise<boolean> {
        if (!this.sound || !this.isLoaded) return false;

        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
            if (status.isPlaying) {
                await this.sound.pauseAsync();
                return false;
            } else {
                await this.sound.playAsync();
                return true;
            }
        }
        return false;
    }

    async seekTo(positionMillis: number) {
        if (this.sound && this.isLoaded) {
            await this.sound.setPositionAsync(positionMillis);
        }
    }

    async seekToPercentage(percentage: number) {
        if (this.sound && this.isLoaded) {
            const status = await this.sound.getStatusAsync();
            if (status.isLoaded && status.durationMillis) {
                const positionMillis = percentage * status.durationMillis;
                await this.sound.setPositionAsync(positionMillis);
            }
        }
    }

    async setLooping(isLooping: boolean) {
        if (this.sound && this.isLoaded) {
            await this.sound.setIsLoopingAsync(isLooping);
        }
    }

    async getStatus(): Promise<AVPlaybackStatus | null> {
        if (this.sound && this.isLoaded) {
            return await this.sound.getStatusAsync();
        }
        return null;
    }

    async unload() {
        if (this.sound) {
            try {
                await this.sound.unloadAsync();
            } catch (e) {
                // Ignore unload errors
            }
            this.sound = null;
            this.isLoaded = false;
            this.currentUrl = '';
        }
    }

    getIsLoaded() {
        return this.isLoaded;
    }

    getCurrentUrl() {
        return this.currentUrl;
    }
}

// Singleton
const audioService = new AudioService();
export default audioService;
