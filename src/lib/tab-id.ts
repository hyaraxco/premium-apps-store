/** Per-tab id (sessionStorage). Shared by history + cart peer bus. */
const SS_TAB = "stackbay-tab-id";

export function getTabId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = sessionStorage.getItem(SS_TAB);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SS_TAB, id);
    return id;
  } catch {
    return `ephemeral-${Date.now().toString(36)}`;
  }
}
