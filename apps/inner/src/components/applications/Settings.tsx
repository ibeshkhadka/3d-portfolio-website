import React from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';
import { PHOTOS } from '../../lib/gallery';
import {
    DEFAULT_SETTINGS,
    OsSettings,
    STORAGE_KEYS,
    useSharedValue,
} from '../../lib/store';

export interface SettingsProps extends WindowAppProps {}

const WALLPAPER_COLORS = [
    { name: 'Turquoise (default)', value: Colors.turquoise },
    { name: 'Midnight', value: '#1d2e2f' },
    { name: 'Deep Blue', value: '#16305c' },
    { name: 'Plum', value: '#46265a' },
    { name: 'Forest', value: '#22392a' },
    { name: 'Slate', value: '#3a3f45' },
];

const ACCENTS = [
    { name: 'Classic Blue', value: Colors.blue },
    { name: 'Teal', value: '#0f6b6d' },
    { name: 'Crimson', value: '#8c1f1f' },
    { name: 'Indigo', value: '#3b2f8f' },
    { name: 'Charcoal', value: '#333333' },
];

const Settings: React.FC<SettingsProps> = (props) => {
    const [settings, setSettings] = useSharedValue<OsSettings>(
        STORAGE_KEYS.settings,
        DEFAULT_SETTINGS
    );

    const apply = (patch: Partial<OsSettings>) =>
        setSettings({ ...settings, ...patch });

    return (
        <Window
            top={40}
            left={80}
            width={760}
            height={560}
            windowTitle="Settings"
            windowBarIcon="settingsIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText="Saved in this browser"
        >
            <div style={styles.page}>
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Wallpaper</h3>
                    <div style={styles.swatchRow}>
                        {WALLPAPER_COLORS.map((option) => (
                            <div
                                key={option.name}
                                title={option.name}
                                style={Object.assign(
                                    {},
                                    styles.swatch,
                                    { backgroundColor: option.value },
                                    settings.wallpaperImage === '' &&
                                        settings.wallpaper === option.value &&
                                        styles.swatchOn
                                )}
                                onMouseDown={() =>
                                    apply({
                                        wallpaper: option.value,
                                        wallpaperImage: '',
                                    })
                                }
                            />
                        ))}
                    </div>
                    <p style={styles.help}>
                        Or use one of your own photos from the Photo Gallery:
                    </p>
                    <div style={styles.photoRow}>
                        {PHOTOS.slice(0, 6).map((photo) => (
                            <div
                                key={photo.name}
                                style={Object.assign(
                                    {},
                                    styles.photoSwatch,
                                    settings.wallpaperImage === photo.src &&
                                        styles.swatchOn
                                )}
                                onMouseDown={() =>
                                    apply({ wallpaperImage: photo.src })
                                }
                            >
                                <img
                                    src={photo.src}
                                    alt={photo.name}
                                    style={styles.photoThumb}
                                />
                            </div>
                        ))}
                    </div>
                </div>
<div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                        Window title bar colour
                    </h3>
                    <div style={styles.swatchRow}>
                        {ACCENTS.map((option) => (
                            <div
                                key={option.name}
                                title={option.name}
                                style={Object.assign(
                                    {},
                                    styles.swatch,
                                    { backgroundColor: option.value },
                                    settings.accent === option.value &&
                                        styles.swatchOn
                                )}
                                onMouseDown={() =>
                                    apply({ accent: option.value })
                                }
                            />
                        ))}
                    </div>
                </div>
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Preview</h3>
                    <div
                        style={Object.assign({}, styles.preview, {
                            backgroundColor: settings.wallpaper,
                            backgroundImage: settings.wallpaperImage
                                ? `url(${settings.wallpaperImage})`
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        })}
                    >
                        <div
                            style={Object.assign({}, styles.previewBar, {
                                backgroundColor: settings.accent,
                            })}
                        >
                            <p style={styles.previewBarText}>
                                A sample window
                            </p>
                        </div>
                        <div style={styles.previewBody} />
                    </div>
                </div>
                <div style={styles.footer}>
                    <button
                        className="site-button"
                        onMouseDown={() => setSettings(DEFAULT_SETTINGS)}
                    >
                        Reset to defaults
                    </button>
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
        padding: 10,
        boxSizing: 'border-box',
        overflowY: 'auto',
    },
    section: {
        flexDirection: 'column',
        marginBottom: 14,
    },
    sectionTitle: {
        margin: 0,
        marginBottom: 6,
    },
    swatchRow: {
        alignItems: 'center',
    },
    swatch: {
        width: 40,
        height: 40,
        marginRight: 8,
        cursor: 'pointer',
        boxSizing: 'border-box',
        border: `2px solid ${Colors.darkGray}`,
    },
    swatchOn: {
        border: `3px solid ${Colors.red}`,
    },
    photoRow: {
        alignItems: 'center',
        marginTop: 6,
    },
    photoSwatch: {
        width: 64,
        height: 48,
        marginRight: 8,
        cursor: 'pointer',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: `2px solid ${Colors.darkGray}`,
    },
    photoThumb: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    help: {
        margin: 0,
        marginTop: 10,
        fontSize: 12,
        fontFamily: 'MSSerif',
        color: Colors.darkGray,
    },
    preview: {
        height: 120,
        flexDirection: 'column',
        border: `1px solid ${Colors.darkGray}`,
        overflow: 'hidden',
    },
    previewBar: {
        height: 20,
        alignItems: 'center',
        paddingLeft: 6,
        boxSizing: 'border-box',
    },
    previewBarText: {
        margin: 0,
        fontSize: 11,
        fontFamily: 'MSSerif',
        color: Colors.white,
    },
    previewBody: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    footer: {
        alignItems: 'center',
        marginTop: 4,
    },
};

export default Settings;