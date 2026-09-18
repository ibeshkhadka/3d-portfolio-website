/**
 * Loads every image placed in `src/assets/pictures/gallery/` at build time, so
 * adding photos needs no code change — just drop files into that folder.
 */
const galleryContext = (require as any).context(
    '../assets/pictures/gallery',
    false,
    /\.(png|jpe?g|gif|webp|bmp)$/i
) as {
    keys: () => string[];
    (id: string): any;
};

export interface Photo {
    name: string;
    src: string;
}

/** CRA asset modules can resolve to a string or to `{ default: string }`. */
const resolveSrc = (mod: any): string =>
    mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;

export const PHOTOS: Photo[] = galleryContext
    .keys()
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((key) => ({
        name: key.replace(/^\.\//, '').replace(/\.[^.]+$/, ''),
        src: resolveSrc(galleryContext(key)),
    }));
