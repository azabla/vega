// Anything can open the palette (navbar button, mobile button, shortcut)
const EVENT = "command-palette:open";

export const openCommandPalette = () => window.dispatchEvent(new Event(EVENT));

export const onOpenCommandPalette = (handler) => {
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
};

export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const shortcutLabel = isMac ? "⌘K" : "Ctrl K";
