import React, { useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';
import { MusicPlayer } from '../general';
// @ts-ignore
import house from '../../assets/audio/house_master.mp3';
// @ts-ignore
import edge from '../../assets/audio/edge_unmastered.mp3';
// @ts-ignore
import dnb from '../../assets/audio/break.mp3';
// @ts-ignore
import dnbDrums from '../../assets/audio/dnb_drop_drums.mp3';

export interface MusicPlayerAppProps extends WindowAppProps {}

interface Track {
    src: string;
    title: string;
    subtitle: string;
}

const TRACKS: Track[] = [
    {
        src: house,
        title: 'Timeless',
        subtitle: 'Ibesh Khadka - 2022',
    },
    {
        src: edge,
        title: 'Edge [W.I.P.]',
        subtitle: 'Ibesh Khadka - 2021',
    },
    {
        src: dnb,
        title: 'Break [Demo]',
        subtitle: 'Ibesh Khadka - 2019/2022',
    },
    {
        src: dnbDrums,
        title: 'Break [Drums and Sub]',
        subtitle: 'Ibesh Khadka - 2019/2022',
    },
];

const MusicPlayerApp: React.FC<MusicPlayerAppProps> = (props) => {
    const [currentSong, setCurrentSong] = useState<string>('');

    return (
        <Window
            top={32}
            left={48}
            width={640}
            height={480}
            windowTitle="Music Player"
            windowBarIcon="cd"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${TRACKS.length} track${
                TRACKS.length === 1 ? '' : 's'
            }`}
        >
            <div style={styles.page}>
                <div style={styles.header}>
                    <p style={styles.headerText}>
                        My Music — tracks produced by Ibesh Khadka
                    </p>
                </div>
                <div style={styles.trackList}>
                    {TRACKS.map((track) => (
                        <div key={track.title} style={styles.trackRow}>
                            <MusicPlayer
                                src={track.src}
                                title={track.title}
                                subtitle={track.subtitle}
                                currentSong={currentSong}
                                setCurrentSong={setCurrentSong}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    page: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'column',
        backgroundColor: Colors.lightGray,
    },
    header: {
        flexShrink: 0,
        padding: 6,
        paddingLeft: 8,
        paddingRight: 8,
        borderBottom: `1px solid ${Colors.darkGray}`,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 12,
        fontFamily: 'MSSerif',
    },
    trackList: {
        flex: 1,
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 8,
        boxSizing: 'border-box',
        backgroundColor: Colors.white,
    },
    trackRow: {
        flexShrink: 0,
        marginBottom: 8,
    },
};

export default MusicPlayerApp;
