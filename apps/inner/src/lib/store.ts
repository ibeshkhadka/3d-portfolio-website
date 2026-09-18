import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tiny shared store: localStorage plus a pub/sub, so open windows can react to
 * changes made by other apps (Trash <-> Notepad, Settings <-> Desktop/Window).
 */

const listeners: { [key: string]: Array<() => void> } = {};

export function subscribe(key: string, listener: () => void): () => void {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(listener);
    return () => {
        listeners[key] = (listeners[key] || []).filter((l) => l !== listener);
    };
}

function emit(key: string): void {
    (listeners[key] || []).forEach((listener) => listener());
}

export function readValue<T>(key: string, fallback: T): T {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch (e) {
        return fallback;
    }
}

export function writeValue<T>(key: string, value: T): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // storage unavailable — the value simply stays in memory
    }
    emit(key);
}

/** Read a key and stay in sync whenever any app writes to it. */
export function useSharedValue<T>(key: string, fallback: T) {
    const fallbackRef = useRef(fallback);
    fallbackRef.current = fallback;

    const [value, setValue] = useState<T>(() => readValue(key, fallback));

    useEffect(() => {
        const sync = () => setValue(readValue(key, fallbackRef.current));
        sync();
        return subscribe(key, sync);
    }, [key]);

    const update = useCallback(
        (next: T | ((prev: T) => T)) => {
            const resolved =
                typeof next === 'function'
                    ? (next as (prev: T) => T)(readValue(key, fallbackRef.current))
                    : next;
            writeValue(key, resolved);
        },
        [key]
    );

    return [value, update] as const;
}

export const STORAGE_KEYS = {
    notes: 'ibesh-os-notepad-v1',
    trash: 'ibesh-os-trash-v1',
    settings: 'ibesh-os-settings-v1',
    sheet: 'ibesh-os-calc-v1',
};

export interface OsSettings {
    wallpaper: string;
    wallpaperImage: string;
    accent: string;
}

export const DEFAULT_SETTINGS: OsSettings = {
    wallpaper: '#3e9697',
    wallpaperImage: '',
    accent: '#0000a3',
};

export interface TrashItem {
    id: string;
    title: string;
    body: string;
    deletedAt: number;
}

/** Ask the desktop to open one of its apps by key (used by the Terminal). */
export function requestAppOpen(appKey: string): void {
    window.dispatchEvent(new CustomEvent('ibesh-os-open-app', { detail: appKey }));
}
