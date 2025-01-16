import { defineStore, storeToRefs } from 'pinia';
import { onUnmounted, watch } from 'vue';
import { getPlayer } from '../config/utils/initPlayer.js';

export const usePlayerStore = defineStore({
    id: 'Player',
    state: () => ({
        loopType: 0,
        playList: [],
        showPlayList: false,
        id: 0,
        url: '',
        songUrl: {},
        song: {},
        isPlaying: false,
        isPause: false,
        sliderInput: false,
        ended: false,
        muted: false,
        currentTime: 0,
        duration: 0,
        currentLyric: null,
        playerShow: false,
    }),
    getters: {
        playListCount: (state) => {
            return state.playList.length;
        },
        thisIndex: (state) => {
            return state.playList.findIndex((song) => song.id === state.id);
        },
        nextSong(state) {
            const { thisIndex, playListCount } = this;
            if (thisIndex === playListCount - 1) {
                return state.playList[0];
            } else {
                const nextIndex = thisIndex + 1;
                return state.playList[nextIndex];
            }
        },
        prevSong(state) {
            const { thisIndex } = this;
            if (thisIndex === 0) {
                return state.playList[state.playList.length - 1];
            } else {
                const prevIndex = thisIndex - 1;
                return state.playList[prevIndex];
            }
        }
    },
    actions: {
        pushPlayList(replace, ...list) {
            if (replace) {
                this.playList = list;
                return;
            }
            list.forEach((song) => {
                if (this.playList.filter((s) => s.id == song.id).length <= 0) {
                    this.playList.push(song);
                }
            });
        },
        deleteSong(id) {
            this.playList.splice(
                this.playList.findIndex((s) => s.id == id),
                1
            );
        },
        clearPlayList() {
            this.songUrl = {};
            this.url = '';
            this.id = 0;
            this.song = {};
            this.isPlaying = false;
            this.isPause = false;
            this.sliderInput = false;
            this.ended = false;
            this.muted = false;
            this.currentTime = 0;
            this.playList = [];
            this.showPlayList = false;
            const audio = getPlayer();
            audio.stop();
            setTimeout(() => {
                this.duration = 0;
            }, 500);
        },
        async play(id) {
            console.log('play');
            if (id == this.id) return;
            this.ended = false;
            this.isPause = false;
            this.isPlaying = false;
            const data = await getSongUrl(id);
            console.log(data);
            if (data.url && !data.freeTrialInfo) {
                const audio = getPlayer();
                this.id = id;
                this.songDetail();
                setTimeout(() => {
                    if (!!uni.getBackgroundAudioManager) {
                        audio.title = this.song.name;
                        audio.singer = this.song.ar[0].name;
                        audio.epname = this.song.al.name;
                        audio.coverImgUrl = this.song.al.picUrl;
                    }
                    audio.src = 'https://music.163.com/song/media/outer/url?id=' + data.id + '.mp3';
                    audio.play();
                    this.isPlaying = true;
                    this.songUrl = data;
                    this.url = data.url;
                    audio.onError((err) => {
                        this.id = id;
                        uni.showToast({
                            icon: "error",
                            title: "该歌曲无法播放"
                        });
                        this.isPause = true;
                    });
                }, 500);
            } else {
                uni.showToast({
                    icon: "error",
                    title: "该歌曲无法播放"
                });
                this.deleteSong(id);
                this.next();
            }
        },
        async getLyric(id) {
            const lyricData = await getSongLyric(id);
            if (lyricData) {
                const lyric = JSON.parse(JSON.stringify(lyricData)).lyric;
                return lyric;
            }
        },
        saveLyric(currentLyric) {
            this.currentLyric = currentLyric;
        },
        playEnd() {
            this.isPause = true;
            console.log('播放结束');
            switch (this.loopType) {
                case 0:
                    this.next();
                    break;
                case 1:
                    this.rePlay();
                    break;
                case 2:
                    this.randomPlay();
                    break;
            }
        },
        async songDetail() {
            this.song = await getSongDetail(this.id);
            this.pushPlayList(false, this.song);
        },
        rePlay() {
            setTimeout(() => {
                console.log('replay');
                this.currentTime = 0;
                this.ended = false;
                this.isPause = false;
                this.isPlaying = true;
                const audio = getPlayer();
                audio.seek(0);
                audio.play();
            }, 1500);
        },
        next() {
            if (this.loopType === 2) {
                this.randomPlay();
            } else {
                if (this.id === this.nextSong.id) {
                    uni.showToast({
                        icon: "none",
                        title: "没有下一首"
                    });
                } else {
                    this.play(this.nextSong.id);
                }
            }
        },
        prev() {
            if (this.id === this.prevSong.id) {
                uni.showToast({
                    icon: "none",
                    title: "没有上一首"
                });
            } else {
                this.play(this.prevSong.id);
            }
        },
        randomPlay() {
            console.log('randomPlay');
            this.play(
                this.playList[Math.ceil(Math.random() * this.playList.length - 1)].id,
            );
        },
        togglePlay() {
            if (!this.song.id) return;
            this.isPlaying = !this.isPlaying;
            const audio = getPlayer();
            if (!this.isPlaying) {
                audio.pause();
                this.isPause = true;
            } else {
                audio.play();
                this.isPause = false;
            }
        },
        setPlay() {
            if (!this.song.id) return;
            const audio = getPlayer();
            this.isPlaying = true;
            audio.play();
            this.isPause = false;
        },
        setPause() {
            if (!this.song.id) return;
            const audio = getPlayer();
            this.isPlaying = false;
            audio.pause();
            this.isPause = true;
        },
        toggleLoop() {
            if (this.loopType == 2) {
                this.loopType = 0;
            } else {
                this.loopType++;
            }
        },
        forward(val) {
            const audio = getPlayer();
            audio.seek(this.currentTime + val);
        },
        backup(val) {
            const audio = getPlayer();
            if (this.currentTime < 5) {
                audio.seek(0);
            } else {
                audio.seek(this.currentTime - val);
            }
        },
        onSliderChange(val) {
            const audio = getPlayer();
            audio.seek(val);
        },
        interval() {
            if (this.isPlaying && !this.sliderInput) {
                const audio = getPlayer();
                this.currentTime = parseInt(audio.currentTime.toString());
                this.duration = parseInt(audio.duration.toString());
                audio.onEnded(() => {
                    this.ended = true;
                });
            }
        },
        setPlayerShow(val) {
            if (val === 0) {
                this.playerShow = true;
            } else {
                this.playerShow = false;
            }
        }
    }
});

export const useInitPlayer = () => {
    let timer;
    const { interval, playEnd, setPlayerShow } = usePlayerStore();
    const { ended, song } = storeToRefs(usePlayerStore());

    watch(ended, (ended) => {
        console.log('start');
        if (!ended) return;
        console.log('end');
        playEnd();
    });

    watch(song, (song) => {
        if (song) {
            setPlayerShow(0);
        } else {
            setPlayerShow(1);
        }
    });

    console.log('启动定时器');
    timer = setInterval(interval, 1000);

    onUnmounted(() => {
        clearInterval(timer);
    });
};