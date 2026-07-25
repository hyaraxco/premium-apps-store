import { ViewTransition } from "react";
import type { ReactNode } from "react";

/**
 * Directional page shell for swipe-feel history.
 *
 * Types come from Link / router.push transitionTypes.
 * Browser Back/Forward: HistoryNav stamps depth + html[data-nav-dir]
 * (CSS root slide — no React module patch).
 *
 * Shared-element morphs (product-*) still run independently.
 */
export function NavShell({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
