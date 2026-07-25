"use client";

import { useEffect } from "react";
import { getTabId } from "@/lib/tab-id";

/** History entry stamp (per navigation entry, not shared across tabs). */
const IDX = "__sbIdx";
const TAB = "__sbTab";

/** sessionStorage — per-tab only (never localStorage). */
const SS_CURSOR = "stackbay-hist-cursor";

const ATTR = "data-nav-dir";
const TAB_ATTR = "data-sb-tab";
const BC_NAME = "stackbay-history";

type NavType = "nav-forward" | "nav-back";

type Stamp = {
  [IDX]?: number;
  [TAB]?: string;
  [key: string]: unknown;
};

function readNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asStamp(state: unknown): Stamp {
  return state && typeof state === "object"
    ? { ...(state as Stamp) }
    : {};
}

function saveCursor(tabId: string, depth: number) {
  try {
    sessionStorage.setItem(
      SS_CURSOR,
      JSON.stringify({ tabId, depth, at: Date.now() }),
    );
  } catch {
    // ignore
  }
}

function loadCursor(tabId: string): number | null {
  try {
    const raw = sessionStorage.getItem(SS_CURSOR);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { tabId?: string; depth?: number };
    if (parsed.tabId !== tabId) return null;
    return readNum(parsed.depth);
  } catch {
    return null;
  }
}

/**
 * Per-tab history depth for directional Back/Forward slides.
 *
 * Multi-window model:
 * - Browser history stacks are always per-tab (cannot merge stacks).
 * - Each tab owns a sessionStorage tab id + cursor.
 * - History entries stamped with { __sbIdx, __sbTab } so foreign/restored
 *   entries do not steal another tab's depth.
 * - BroadcastChannel announces cursor to siblings (debug / future peers);
 *   depth is never written to localStorage.
 * - pageshow (bfcache) rehydrates depth from history.state or session cursor.
 */
export function HistoryNav() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tabId = getTabId();
    document.documentElement.setAttribute(TAB_ATTR, tabId);

    const resolveDepth = (): number => {
      const st = asStamp(history.state);
      const idx = readNum(st[IDX]);
      const owner = typeof st[TAB] === "string" ? st[TAB] : null;
      if (idx != null && owner === tabId) return idx;
      // Same tab session after soft reload — trust session cursor if present
      const cursor = loadCursor(tabId);
      if (cursor != null) return cursor;
      return idx ?? 0;
    };

    let depth = resolveDepth();

    let clearTimer: ReturnType<typeof setTimeout> | null = null;
    let bc: BroadcastChannel | null = null;

    try {
      bc = new BroadcastChannel(BC_NAME);
    } catch {
      bc = null;
    }

    const publish = (reason: string) => {
      if (!bc) return;
      try {
        bc.postMessage({
          type: "cursor",
          tabId,
          depth,
          href: location.href,
          reason,
          t: Date.now(),
        });
      } catch {
        // ignore
      }
    };

    const setDir = (dir: NavType | null) => {
      if (dir) document.documentElement.setAttribute(ATTR, dir);
      else document.documentElement.removeAttribute(ATTR);
    };

    const scheduleClear = () => {
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => setDir(null), 700);
    };

    const mergeStamp = (state: unknown, mode: "push" | "replace"): Stamp => {
      const base = asStamp(state);
      if (mode === "push") depth += 1;
      // Always claim this entry for this tab
      base[IDX] = depth;
      base[TAB] = tabId;
      return base;
    };

    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = (state, title, url) => {
      setDir(null);
      const next = mergeStamp(state, "push");
      const result = origPush(next, title, url);
      saveCursor(tabId, depth);
      publish("push");
      return result;
    };

    history.replaceState = (state, title, url) => {
      const next = mergeStamp(state, "replace");
      const result = origReplace(next, title, url);
      saveCursor(tabId, depth);
      publish("replace");
      return result;
    };

    // Claim current entry for this tab (preserves Next __NA / tree fields)
    try {
      origReplace(mergeStamp(history.state, "replace"), "", location.href);
      saveCursor(tabId, depth);
      publish("init");
    } catch {
      // ignore
    }

    const onPopState = (event: PopStateEvent) => {
      const st = asStamp(event.state);
      const nextIdx = readNum(st[IDX]);
      const owner = typeof st[TAB] === "string" ? st[TAB] : null;

      let dir: NavType | null = null;

      if (nextIdx != null && (owner === tabId || owner == null)) {
        // owner null = legacy stamp before multi-tab — still usable by idx
        if (nextIdx < depth) dir = "nav-back";
        else if (nextIdx > depth) dir = "nav-forward";
        depth = nextIdx;
      } else if (nextIdx != null && owner !== tabId) {
        // Entry from another tab's duplicated session — re-claim, treat as back
        depth = nextIdx;
        dir = "nav-back";
        try {
          origReplace(mergeStamp(event.state, "replace"), "", location.href);
        } catch {
          // ignore
        }
      } else {
        dir = "nav-back";
      }

      setDir(dir);
      scheduleClear();
      saveCursor(tabId, depth);
      publish("popstate");
    };

    /** bfcache restore: JS heap was frozen — re-sync depth from history */
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      depth = resolveDepth();
      setDir(null);
      saveCursor(tabId, depth);
      publish("bfcache");
    };

    const onPageHide = () => {
      saveCursor(tabId, depth);
      publish("pagehide");
    };

    // Sibling tabs: history stacks stay isolated (cart peers use stackbay-cart)
    const onBroadcast = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { tabId?: string }).tabId === tabId) return;
    };

    window.addEventListener("popstate", onPopState, true);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);
    bc?.addEventListener("message", onBroadcast);

    return () => {
      window.removeEventListener("popstate", onPopState, true);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
      history.pushState = origPush;
      history.replaceState = origReplace;
      if (clearTimer) clearTimeout(clearTimer);
      setDir(null);
      document.documentElement.removeAttribute(TAB_ATTR);
      try {
        bc?.removeEventListener("message", onBroadcast);
        bc?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  return null;
}
