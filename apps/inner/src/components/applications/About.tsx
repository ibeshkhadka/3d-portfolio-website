import React from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';
import { requestAppOpen } from '../../lib/store';

export interface AboutProps extends WindowAppProps {}

const GITHUB = 'https://github.com/ibeshkhadka';
const EMAIL = 'ibeshkhadka35@gmail.com';

const About: React.FC<AboutProps> = (props) => {
    const screenSize = `${window.screen.width} x ${window.screen.height}`;
    const viewport = `${window.innerWidth} x ${window.innerHeight}`;

    return (
        <Window
            top={48}
            left={104}
            width={640}
            height={520}
            windowTitle="About"
            windowBarIcon="aboutIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText="About this desktop"
        >
            <div style={styles.page}>
                <div style={styles.header}>
                    <h1 style={styles.name}>Ibesh Khadka</h1>
                    <p style={styles.tagline}>Portfolio desktop</p>
                </div>
                <div style={styles.block}>
                    <p style={styles.paragraph}>
                        You are looking at a 3D room rendered with Three.js,
                        with this 2D desktop operating system living on the
                        screen of the monitor. Both parts are one project,
                        served by a single server, and the desktop is a
                        same-origin page so the monitor can display it.
                    </p>
                </div>
                <div style={styles.block}>
                    <h3 style={styles.heading}>Everything here works</h3>
                    <ul style={styles.list}>
                        <li>
                            <p style={styles.paragraph}>
                                Calc does real arithmetic, including formulas
                                like =A1+B2 and =SUM(A1:A5).
                            </p>
                        </li>
                        <li>
                            <p style={styles.paragraph}>
                                Terminal is a working shell over this machine's
                                folders. Try 'open gallery'.
                            </p>
                        </li>
                        <li>
                            <p style={styles.paragraph}>
                                Notepad saves as you type, and Trash can bring
                                back what you delete.
                            </p>
                        </li>
                        <li>
                            <p style={styles.paragraph}>
                                Nothing depends on an outside service. No
                                accounts, no logins, no tracking.
                            </p>
                        </li>
                    </ul>
                </div>
                <div style={styles.block}>
                    <h3 style={styles.heading}>This session</h3>
                    <p style={styles.mono}>Screen: {screenSize}</p>
                    <p style={styles.mono}>Window: {viewport}</p>
                    <p style={styles.mono}>Local time: {new Date().toLocaleString()}</p>
                </div>
                <div style={styles.buttons}>
                    <button
                        className="site-button"
                        onMouseDown={() => requestAppOpen('showcase')}
                    >
                        Open Showcase
                    </button>
                    <button
                        className="site-button"
                        onMouseDown={() => requestAppOpen('gallery')}
                    >
                        Open Photo Gallery
                    </button>
                    <a
                        rel="noreferrer"
                        target="_blank"
                        href={GITHUB}
                        style={styles.linkWrap}
                    >
                        <button className="site-button">GitHub</button>
                    </a>
                    <a
                        href={`mailto:${EMAIL}`}
                        style={styles.linkWrap}
                    >
                        <button className="site-button">Email me</button>
                    </a>
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
        padding: 14,
        boxSizing: 'border-box',
        overflowY: 'auto',
    },
    header: {
        flexDirection: 'column',
        marginBottom: 14,
    },
    name: {
        margin: 0,
        fontSize: 42,
        lineHeight: 1,
    },
    tagline: {
        margin: 0,
        marginTop: 6,
        fontSize: 14,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
    },
    block: {
        flexDirection: 'column',
        marginBottom: 14,
    },
    heading: {
        margin: 0,
        marginBottom: 8,
    },
    paragraph: {
        margin: 0,
        fontSize: 14,
        fontFamily: 'MSSerif',
        lineHeight: 1.4,
    },
    list: {
        margin: 0,
        paddingLeft: 18,
        flexDirection: 'column',
    },
    mono: {
        margin: 0,
        fontSize: 12,
        fontFamily: 'Terminal, monospace',
    },
    buttons: {
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    linkWrap: {
        display: 'flex',
        marginLeft: 8,
        marginTop: 4,
    },
};

export default About;