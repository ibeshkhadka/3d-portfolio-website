import React, { useCallback, useEffect, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface GalleryProps extends WindowAppProps {}

interface Photo {
    name: string;
    src: string;
}

/**
 * Every image placed in `src/assets/pictures/gallery/` is discovered
 * automatically when the app is built, so adding photos needs no code change —
 * just drop files into that folder and the dev server picks them up.
 */
const galleryContext = (require as any).context(
    '../../assets/pictures/gallery',
    false,
    /\.(png|jpe?g|gif|webp|bmp)$/i
) as {
    keys: () => string[];
    (id: string): any;
};

/** CRA asset modules can resolve to a string or to `{ default: string }`. */
const resolveSrc = (mod: any): string =>
    mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;

const PHOTOS: Photo[] = galleryContext
    .keys()
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((key) => ({
        name: key.replace(/^\.\//, '').replace(/\.[^.]+$/, ''),
        src: resolveSrc(galleryContext(key)),
    }));

const Gallery: React.FC<GalleryProps> = (props) => {
    const [selected, setSelected] = useState<number | null>(null);

    const closeViewer = useCallback(() => {
        setSelected(null);
    }, []);

    const step = useCallback((delta: number) => {
        setSelected((current) => {
            if (current === null || PHOTOS.length === 0) return current;
            const next = current + delta;
            if (next < 0) return PHOTOS.length - 1;
            if (next >= PHOTOS.length) return 0;
            return next;
        });
    }, []);

    useEffect(() => {
        if (selected === null) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') step(1);
            if (event.key === 'ArrowLeft') step(-1);
            if (event.key === 'Escape') closeViewer();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selected, step, closeViewer]);

    const photo = selected === null ? null : PHOTOS[selected];
    const count = PHOTOS.length;

    return (
        <Window
            top={40}
            left={64}
            width={900}
            height={620}
            windowTitle="Photo Gallery"
            windowBarIcon="galleryIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={
                count > 0
                    ? `${count} photo${count === 1 ? '' : 's'}`
                    : 'No photos found'
            }
        >
<div style={styles.page}>
                <div style={styles.strip}>
                    <p style={styles.stripText}>
                        {count} photo{count === 1 ? '' : 's'}
                    </p>
                    <p style={styles.stripText}>
                        Click a photo to open it &middot; use arrow keys to
                        browse
                    </p>
                </div>

                {count === 0 ? (
                    <div style={styles.empty}>
                        <h3>No photos yet</h3>
                        <br />
                        <p>Drop image files into</p>
                        <p>
                            <b>apps/inner/src/assets/pictures/gallery/</b>
                        </p>
                        <br />
                        <p>
                            They are picked up automatically — no code changes
                            needed.
                        </p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {PHOTOS.map((item, index) => (
                            <div
                                key={item.name}
                                className="big-button-container"
                                style={styles.cell}
                                onMouseDown={() => setSelected(index)}
                            >
                                <div style={styles.thumbFrame}>
                                    <img
                                        src={item.src}
                                        alt={item.name}
                                        style={styles.thumb}
                                    />
                                </div>
                                <p style={styles.cellLabel}>{item.name}</p>
                            </div>
                        ))}
                    </div>
                )}

                {photo && (
                    <div style={styles.viewer}>
                        <div style={styles.viewerBar}>
                            <p style={styles.viewerTitle}>{photo.name}</p>
                            <p style={styles.viewerCounter}>
                                {(selected as number) + 1} / {count}
                            </p>
                        </div>
                        <div style={styles.viewerStage}>
                            <img
                                src={photo.src}
                                alt={photo.name}
                                style={styles.viewerImage}
                            />
                        </div>
                        <div style={styles.viewerControls}>
                            <button
                                className="site-button"
                                style={styles.viewerButton}
                                onClick={() => step(-1)}
                            >
                                &#9664; Previous
                            </button>
                            <button
                                className="site-button"
                                style={styles.viewerButton}
                                onClick={closeViewer}
                            >
                                Close
                            </button>
                            <button
                                className="site-button"
                                style={styles.viewerButton}
                                onClick={() => step(1)}
                            >
                                Next &#9654;
                            </button>
                        </div>
                    </div>
                )}
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
    strip: {
        flexShrink: 0,
        padding: 6,
        paddingLeft: 8,
        paddingRight: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stripText: {
        fontSize: 12,
        fontFamily: 'MSSerif',
    },
    grid: {
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 4,
        boxSizing: 'border-box',
        backgroundColor: Colors.white,
    },
    cell: {
        width: 150,
        margin: 6,
        padding: 6,
        boxSizing: 'border-box',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
    },
    thumbFrame: {
        width: '100%',
        height: 104,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        border: `1px solid ${Colors.darkGray}`,
    },
    thumb: {
        maxWidth: '100%',
        maxHeight: '100%',
    },
    cellLabel: {
        fontSize: 12,
        fontFamily: 'MSSerif',
        marginTop: 4,
        textAlign: 'center',
        maxWidth: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    empty: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: 32,
        backgroundColor: Colors.white,
    },
    viewer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'column',
        backgroundColor: '#1b1b1b',
        padding: 8,
        boxSizing: 'border-box',
    },
    viewerBar: {
        flexShrink: 0,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 6,
    },
    viewerTitle: {
        color: Colors.white,
        fontSize: 14,
        fontFamily: 'MSSerif',
    },
    viewerCounter: {
        color: Colors.white,
        fontSize: 14,
        fontFamily: 'MSSerif',
    },
    viewerStage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: Colors.black,
    },
    viewerImage: {
        maxWidth: '100%',
        maxHeight: '100%',
    },
    viewerControls: {
        flexShrink: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 8,
    },
    viewerButton: {
        marginLeft: 4,
        marginRight: 4,
        minWidth: 104,
    },
};

export default Gallery;
