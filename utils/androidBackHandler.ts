/**
 * Android hardware back: overlay handlers run first (LIFO), then the root handler.
 * Return true if the press was consumed; false to allow {@link App.exitApp} (root dashboard).
 */

type BackFn = () => boolean;

const overlayStack: BackFn[] = [];
let rootHandler: BackFn | null = null;

/** Register inner UI (e.g. chapter tray). Returns unregister. */
export function pushAndroidBackOverlay(handler: BackFn): () => void {
  overlayStack.push(handler);
  return () => {
    const i = overlayStack.lastIndexOf(handler);
    if (i >= 0) overlayStack.splice(i, 1);
  };
}

/** Main navigation (App.tsx). Replaces previous root handler. */
export function setAndroidBackHandler(handler: BackFn | null): void {
  rootHandler = handler;
}

export function notifyAndroidBack(): boolean {
  for (let i = overlayStack.length - 1; i >= 0; i--) {
    try {
      if (overlayStack[i]()) return true;
    } catch {
      /* ignore */
    }
  }
  if (rootHandler) {
    try {
      if (rootHandler()) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}
