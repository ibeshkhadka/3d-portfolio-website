import { PHOTOS } from './gallery';
import Resume from '../assets/resume/Ibesh_Khadka_Resume.pdf';

export type NodeKind = 'folder' | 'image' | 'text' | 'pdf';

export interface FsNode {
    name: string;
    kind: NodeKind;
    children?: FsNode[];
    src?: string;
    text?: string;
    size?: string;
}

const PORTFOLIO_TXT = [
    'This portfolio website',
    '======================',
    '',
    'The site you are looking at is two apps in one folder:',
    '',
    '  apps/outer  - a 3D room rendered with Three.js. It draws the desk,',
    '                the CRT monitor and the camera moves, and embeds the',
    '                2D site on the monitor screen.',
    '',
    '  apps/inner  - this desktop OS, a Create React App, served same-origin',
    '                at /os so the monitor can iframe it with no CORS worries.',
    '',
    'A single Express server (server/index.js) serves the 3D site at /, this',
    'OS at /os, and a contact endpoint at POST /api/send-email.',
    '',
].join('\n');

const README_TXT = [
    'Welcome to this desktop.',
    '',
    '  Gallery   - your photos, with a built-in viewer.',
    '  Files     - browse the folders of this machine.',
    '  Notepad   - notes that save as you type.',
    '  Settings  - change the wallpaper and the window title bar colour.',
    '  Trash     - notes you delete in Notepad land here. Restore them if',
    '              you change your mind.',
    '  About     - who made this and what it runs on.',
    '',
    'Everything here is self-contained: no outside services, nothing to',
    'log into. Your notes and settings are saved in this browser.',
    '',
].join('\n');

export const FILE_SYSTEM: FsNode = {
    name: 'Home',
    kind: 'folder',
    children: [
        {
            name: 'Photos',
            kind: 'folder',
            children: PHOTOS.map((photo) => ({
                name: photo.name,
                kind: 'image' as NodeKind,
                src: photo.src,
            })),
        },
        {
            name: 'Documents',
            kind: 'folder',
            children: [
                {
                    name: 'Ibesh_Khadka_Resume.pdf',
                    kind: 'pdf',
                    src: Resume,
                    size: '482 KB',
                },
                { name: 'README.txt', kind: 'text', text: README_TXT },
            ],
        },
        {
            name: 'Projects',
            kind: 'folder',
            children: [
                {
                    name: 'Portfolio Website.txt',
                    kind: 'text',
                    text: PORTFOLIO_TXT,
                },
            ],
        },
    ],
};

/** Walk a path such as ['Photos'] down from the root. */
export function nodeAtPath(path: string[]): FsNode | null {
    let node: FsNode = FILE_SYSTEM;
    for (const part of path) {
        const next = (node.children || []).find((child) => child.name === part);
        if (!next) return null;
        node = next;
    }
    return node;
}

export function listPath(path: string[]): FsNode[] {
    return nodeAtPath(path)?.children || [];
}

/** Absolute path of a node, e.g. for breadcrumbs. */
export function pathToString(path: string[]): string {
    return path.length === 0 ? '~' : `~/${path.join('/')}`;
}

/** Every image in the tree, in order, for previews and slideshows. */
export const ALL_IMAGES: FsNode[] = FILE_SYSTEM.children!.find(
    (child) => child.name === 'Photos'
)!.children!;
