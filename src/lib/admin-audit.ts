export interface AuditLogPayload {
  action: string; // e.g. "order.mark_paid", "fulfillment.submit", "product.toggle_active", "stock.update_pool", "settings.update"
  actor?: string; // e.g. "admin"
  details: Record<string, unknown>;
}

export function logAdminAudit({ action, actor = "admin", details }: AuditLogPayload) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    actor,
    action,
    details,
  };

  // Structured operational log
  console.info(`[ADMIN_AUDIT] ${JSON.stringify(entry)}`);
}
