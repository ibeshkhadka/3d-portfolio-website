import React, { useCallback, useEffect, useState } from 'react';
import Colors from '../../constants/colors';
import ShowcaseExplorer from '../applications/ShowcaseExplorer';
import Gallery from '../applications/Gallery';
import Notepad from '../applications/Notepad';
import Files from '../applications/Files';
import Settings from '../applications/Settings';
import Trash from '../applications/Trash';
import About from '../applications/About';
import MusicPlayerApp from '../applications/MusicPlayerApp';
import ShutdownSequence from './ShutdownSequence';
// import ThisComputer from '../applications/ThisComputer';
import Toolbar from './Toolbar';
import DesktopShortcut, { DesktopShortcutProps } from './DesktopShortcut';
import { IconName } from '../../assets/icons';
import Credits from '../applications/Credits';
import {
    DEFAULT_SETTINGS,
    OsSettings,
    STORAGE_KEYS,
    useSharedValue,
} from '../../lib/store';

/**
 * Explicit grid positions (col, row) for each desktop shortcut.
 * Tools stack down the left column; gallery/about/credits sit in one
 * horizontal line directly below the trash; showcase is in the second column.
 */
const DESKTOP_LAYOUT: { key: string; col: number; row: number }[] = [
    { key: 'files', col: 0, row: 0 },
    { key: 'gallery', col: 0, row: 1 },
    { key: 'notepad', col: 0, row: 2 },
    { key: 'settings', col: 0, row: 3 },
    { key: 'trash', col: 0, row: 4 },
    { key: 'about', col: 0, row: 5 },
    { key: 'credits', col: 0, row: 6 },
    { key: 'music', col: 0, row: 7 },
    { key: 'showcase', col: 1, row: 0 },
];

export interface DesktopProps {}

type ExtendedWindowAppProps<T> = T & WindowAppProps;

const APPLICATIONS: {
    [key in string]: {
        key: string;
        name: string;
        shortcutIcon: IconName;
        component: React.FC<ExtendedWindowAppProps<any>>;
    };
} = {
    // computer: {
    //     key: 'computer',
    //     name: 'This Computer',
    //     shortcutIcon: 'computerBig',
    //     component: ThisComputer,
    // },
    showcase: {
        key: 'showcase',
        name: 'My Showcase',
        shortcutIcon: 'showcaseIcon',
        component: ShowcaseExplorer,
    },
    gallery: {
        key: 'gallery',
        name: 'Photo Gallery',
        shortcutIcon: 'galleryIcon',
        component: Gallery,
    },
    notepad: {
        key: 'notepad',
        name: 'Notepad',
        shortcutIcon: 'notepadIcon',
        component: Notepad,
    },
    files: {
        key: 'files',
        name: 'Files',
        shortcutIcon: 'filesIcon',
        component: Files,
    },
    settings: {
        key: 'settings',
        name: 'Settings',
        shortcutIcon: 'settingsIcon',
        component: Settings,
    },
    trash: {
        key: 'trash',
        name: 'Trash',
        shortcutIcon: 'trashIcon',
        component: Trash,
    },
    about: {
        key: 'about',
        name: 'About',
        shortcutIcon: 'aboutIcon',
        component: About,
    },
    credits: {
        key: 'credits',
        name: 'Credits',
        shortcutIcon: 'credits',
        component: Credits,
    },
    music: {
        key: 'music',
        name: 'Music Player',
        shortcutIcon: 'cd',
        component: MusicPlayerApp,
    },
};

const Desktop: React.FC<DesktopProps> = (props) => {
    const [windows, setWindows] = useState<DesktopWindows>({});
    const [settings] = useSharedValue<OsSettings>(
        STORAGE_KEYS.settings,
        DEFAULT_SETTINGS
    );

    const [shortcuts, setShortcuts] = useState<DesktopShortcutProps[]>([]);

    const [shutdown, setShutdown] = useState(false);
    const [numShutdowns, setNumShutdowns] = useState(1);

    useEffect(() => {
        if (shutdown === true) {
            rebootDesktop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shutdown]);

    useEffect(() => {
        const newShortcuts: DesktopShortcutProps[] = [];
        DESKTOP_LAYOUT.forEach(({ key, col, row }) => {
            const app = APPLICATIONS[key];
            newShortcuts.push({
                shortcutName: app.name,
                icon: app.shortcutIcon,
                col,
                row,
                onOpen: () => {
                    addWindow(
                        app.key,
                        <app.component
                            onInteract={() => onWindowInteract(app.key)}
                            onMinimize={() => minimizeWindow(app.key)}
                            onClose={() => removeWindow(app.key)}
                            key={app.key}
                        />
                    );
                },
            });
        });

        setShortcuts(newShortcuts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rebootDesktop = useCallback(() => {
        setWindows({});
    }, []);

    const removeWindow = useCallback((key: string) => {
        // Absolute hack and a half
        setTimeout(() => {
            setWindows((prevWindows) => {
                const newWindows = { ...prevWindows };
                delete newWindows[key];
                return newWindows;
            });
        }, 100);
    }, []);

    const minimizeWindow = useCallback((key: string) => {
        setWindows((prevWindows) => {
            const newWindows = { ...prevWindows };
            newWindows[key].minimized = true;
            return newWindows;
        });
    }, []);

    const getHighestZIndex = useCallback((): number => {
        let highestZIndex = 0;
        Object.keys(windows).forEach((key) => {
            const window = windows[key];
            if (window) {
                if (window.zIndex > highestZIndex)
                    highestZIndex = window.zIndex;
            }
        });
        return highestZIndex;
    }, [windows]);

    const toggleMinimize = useCallback(
        (key: string) => {
            const newWindows = { ...windows };
            const highestIndex = getHighestZIndex();
            if (
                newWindows[key].minimized ||
                newWindows[key].zIndex === highestIndex
            ) {
                newWindows[key].minimized = !newWindows[key].minimized;
            }
            newWindows[key].zIndex = getHighestZIndex() + 1;
            setWindows(newWindows);
        },
        [windows, getHighestZIndex]
    );

    const onWindowInteract = useCallback(
        (key: string) => {
            setWindows((prevWindows) => ({
                ...prevWindows,
                [key]: {
                    ...prevWindows[key],
                    zIndex: 1 + getHighestZIndex(),
                },
            }));
        },
        [setWindows, getHighestZIndex]
    );

    const startShutdown = useCallback(() => {
        setTimeout(() => {
            setShutdown(true);
            setNumShutdowns(numShutdowns + 1);
        }, 600);
    }, [numShutdowns]);

    const addWindow = useCallback(
        (key: string, element: JSX.Element) => {
            setWindows((prevState) => ({
                ...prevState,
                [key]: {
                    zIndex: getHighestZIndex() + 1,
                    minimized: false,
                    component: element,
                    name: APPLICATIONS[key].name,
                    icon: APPLICATIONS[key].shortcutIcon,
                },
            }));
        },
        [getHighestZIndex]
    );

    /** Let other apps open one of our windows (used by the Terminal). */
    useEffect(() => {
        const onOpenApp = (event: Event) => {
            const key = (event as CustomEvent).detail as string;
            const app = APPLICATIONS[key];
            if (!app) return;
            addWindow(
                app.key,
                <app.component
                    onInteract={() => onWindowInteract(app.key)}
                    onMinimize={() => minimizeWindow(app.key)}
                    onClose={() => removeWindow(app.key)}
                    key={app.key}
                />
            );
        };
        window.addEventListener('ibesh-os-open-app', onOpenApp);
        return () =>
            window.removeEventListener('ibesh-os-open-app', onOpenApp);
    }, [addWindow, onWindowInteract, minimizeWindow, removeWindow]);

    return !shutdown ? (
        <div
            style={Object.assign({}, styles.desktop, {
                backgroundColor: settings.wallpaper,
                backgroundImage: settings.wallpaperImage
                    ? `url(${settings.wallpaperImage})`
                    : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            })}
        >
            {/* For each window in windows, loop over and render  */}
            {Object.keys(windows).map((key) => {
                const element = windows[key].component;
                if (!element) return <div key={`win-${key}`}></div>;
                return (
                    <div
                        key={`win-${key}`}
                        style={Object.assign(
                            {},
                            { zIndex: windows[key].zIndex },
                            windows[key].minimized && styles.minimized
                        )}
                    >
                        {React.cloneElement(element, {
                            key,
                            onInteract: () => onWindowInteract(key),
                            onClose: () => removeWindow(key),
                        })}
                    </div>
                );
            })}
            <div style={styles.shortcuts}>
                {shortcuts.map((shortcut) => {
                    const column = shortcut.col ?? 0;
                    const row = shortcut.row ?? 0;
                    return (
                        <div
                            style={Object.assign({}, styles.shortcutContainer, {
                                top: row * 104,
                                left: column * 84,
                            })}
                            key={shortcut.shortcutName}
                        >
                            <DesktopShortcut
                                icon={shortcut.icon}
                                shortcutName={shortcut.shortcutName}
                                onOpen={shortcut.onOpen}
                            />
                        </div>
                    );
                })}
            </div>
            <Toolbar
                windows={windows}
                toggleMinimize={toggleMinimize}
                shutdown={startShutdown}
            />
        </div>
    ) : (
        <ShutdownSequence
            setShutdown={setShutdown}
            numShutdowns={numShutdowns}
        />
    );
};

const styles: StyleSheetCSS = {
    desktop: {
        minHeight: '100%',
        flex: 1,
        backgroundColor: Colors.turquoise,
    },
    shutdown: {
        minHeight: '100%',
        flex: 1,
        backgroundColor: '#1d2e2f',
    },
    shortcutContainer: {
        position: 'absolute',
    },
    shortcuts: {
        position: 'absolute',
        top: 16,
        left: 6,
    },
    minimized: {
        pointerEvents: 'none',
        opacity: 0,
    },
};

export default Desktop;
