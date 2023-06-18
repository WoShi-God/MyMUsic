import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSetState } from "@/utils/hooks";
import music from "@/utils/music";
import { Layout, CollectSong, Toast, Modal } from "@/components";
import Controller from "../routeController";
import type { MusicItem } from "@/utils/music";

export type SongItem = Omit<MusicItem["info"], "lyric">;

interface PlayingItem extends SongItem {
    lyric: null | [string, string, number][];
}

export interface State {
    // 是否正在播放
    isPlaying: boolean;
    // 播放列表
    playlist: SongItem[];
    // 播放模式
    playMode: "list-loop" | "random" | "single-cycle";
    // 正在播放的歌曲
    playingItem: PlayingItem;
}

// 初始歌曲
const initSong = {
    id: 347230,
    name: "海阔天空",
    singers: [{ id: 11127, name: "Beyond" }],
    duration: 369.72,
    cover: "https://p2.music.126.net/8y8KJC1eCSO_vUKf2MyZwA==/109951165796899183.jpg?param=50y50",
    isFree: true,
    albumId: 34209,
    albumName: "海阔天空",
};

const initialState: State = {
    isPlaying: false,
    playlist: [initSong],
    playMode: "list-loop",
    playingItem: {
        ...initSong,
        lyric: null,
    },
};

interface FuncCtx {
    getSong: (type: "prev" | "next", state: State) => SongItem | PlayingItem;
    playSong: (item: SongItem | PlayingItem, offset?: number) => void;
    pauseSong: () => void;
    setPlaylist: (list: SongItem[]) => void;
    setPlayMode: (mode: State["playMode"]) => void;
    collectSong: (id: number) => void;
}

// 是否播放中、播放列表、播放模式、当前播放音乐
export const StateContext = React.createContext<State>(initialState);
// @ts-ignore 封装好的一些用于改变 state 的函数
export const FuncContext = React.createContext<FuncCtx>(null);

const audio: HTMLAudioElement = document.getElementById("audio") as any;

function AppContainer() {
    const [state, setState] = useSetState<State>(initialState);
    const [visible, setVisible] = useState(false);
    const [collectId, setCollectId] = useState(0);

    const handleCancle = useCallback(() => {
        setCollectId(0);
        setVisible(false);
    }, []);

    const globalFunc = useMemo(() => {
        // 根据播放模式获取上一首 / 下一首歌曲
        const getSong = (type: "prev" | "next", state: State): SongItem => {
            const { playlist, playingItem, playMode } = state;
            const len = playlist.length;
            // 列表只有一首歌 || 播放模式为单曲循环
            // 返回当前歌曲
            if (len <= 1 || playMode === "single-cycle") {
                // @ts-ignore
                return playingItem;
            }

            // 当前播放歌曲的下标
            const currentIndex = playlist.findIndex(
                ({ id }) => id === playingItem.id
            );

            // 根据播放模式决定下一首歌曲
            let nextIndex: number;
            switch (playMode) {
                // 列表循环
                case "list-loop":
                    nextIndex =
                        type === "next"
                            ? // 下一首
                              (currentIndex + 1) % len
                            : // 上一首
                              (len + currentIndex - 1) % len;
                    break;
                // 随机
                case "random":
                    nextIndex = (Math.random() * len) >> 0;
                    // 随机的歌曲与当前歌曲相同，则选取下一首歌曲
                    if (nextIndex === currentIndex) {
                        nextIndex = (currentIndex + 1) % len;
                    }
            }
            return playlist[nextIndex];
        };

        // 播放歌曲
        const playSong = (item: SongItem | PlayingItem, offset?: number) => {
            const { id } = item;
            setState({
                isPlaying: true,
                playingItem: {
                    ...item,
                    lyric: null,
                },
            });
            music()
                .play(id, offset)
                .then((isDone) => {
                    if (isDone) {
                        audio.play();
                        setState({
                            playingItem: music().getPlayingItem(),
                        });
                    } else {
                        Toast.show(`加载歌曲失败，id:${id}`);
                    }
                });
        };

        const collectSong = (id: number) => {
            setVisible(true);
            setCollectId(id);
        };

        // 暂停歌曲
        const pauseSong = () => {
            audio.pause();
            music().pause();
            setState({ isPlaying: false });
        };

        // 设置歌单列表
        const setPlaylist = (list: SongItem[]) => {
            setState({ playlist: list });
        };

        // 设置播放模式
        const setPlayMode = (mode: State["playMode"]) => {
            setState({ playMode: mode });
        };

        return {
            getSong,
            playSong,
            collectSong,
            pauseSong,
            setPlaylist,
            setPlayMode,
        };
    }, []);

    // mediaSession MediaMetadata
    // 目前 AudioContext 不支持 mediaSession
    // 现在通过一个无声的 audio 拿到 Audio Focus
    // AudioContext 可能要等很久以后的 Audio Focus API
    useEffect(() => {
        if (!navigator.mediaSession || !MediaMetadata) {
            return;
        }

        if (!state.playingItem) {
            return;
        }

        const { name, singers, cover, albumName } = state.playingItem;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: name,
            artist: singers.map((item) => item.name).join("/"),
            album: albumName,
            artwork: [
                {
                    src: `${cover}?param=96y96`,
                    sizes: "96x96",
                    type: "image/jpeg",
                },
                {
                    src: `${cover}?param=128y128`,
                    sizes: "128x128",
                    type: "image/jpeg",
                },
                {
                    src: `${cover}?param=192y192`,
                    sizes: "192x192",
                    type: "image/jpeg",
                },
                {
                    src: `${cover}?param=256y256`,
                    sizes: "256x256",
                    type: "image/jpeg",
                },
                {
                    src: `${cover}?param=384y384`,
                    sizes: "384x384",
                    type: "image/jpeg",
                },
                {
                    src: `${cover}?param=512y512`,
                    sizes: "512x512",
                    type: "image/jpeg",
                },
            ],
        });
    }, [state]);

    // mediaSession ActionHandler
    // 目前 AudioContext 不支持 mediaSession
    // 现在通过一个无声的 audio 拿到 Audio Focus
    // AudioContext 可能要等很久以后的 Audio Focus API
    useEffect(() => {
        if (!navigator.mediaSession || !MediaMetadata) {
            return;
        }
        // 播放
        navigator.mediaSession.setActionHandler("play", () => {
            const { playingItem } = state;
            globalFunc.playSong(playingItem);
        });
        // 暂停
        navigator.mediaSession.setActionHandler("pause", () => {
            globalFunc.pauseSong();
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
            const prevSong = globalFunc.getSong("prev", state);
            globalFunc.playSong(prevSong);
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
            const nextSong = globalFunc.getSong("next", state);
            globalFunc.playSong(nextSong);
        });
    }, [state]);

    // 设置播放结束触发的回调函数
    useEffect(() => {
        music().setOnEnded(() => {
            const { getSong, playSong } = globalFunc;
            // 播放下一首歌曲
            const nextSong = getSong("next", state);
            playSong(nextSong);
        });
    }, [state]);

    return (
        <FuncContext.Provider value={globalFunc}>
            <StateContext.Provider value={state}>
                <Layout>
                    <Controller />
                </Layout>
                {!!collectId && (
                    <Modal
                        title="收藏歌曲"
                        visible={visible}
                        onCancel={handleCancle}
                        noFooter
                    >
                        <CollectSong id={collectId} onCollect={handleCancle} />
                    </Modal>
                )}
            </StateContext.Provider>
        </FuncContext.Provider>
    );
}

export default AppContainer;
