import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;

export type AdminAction =
  | "role_granted"
  | "role_removed"
  | "pro_granted"
  | "pro_removed"
  | "user_deleted"
  | "broadcast_sent"
  | "payment_approved"
  | "payment_rejected"
  | "csv_exported";

/**
 * Admin tomonidan bajarilgan muhim harakatni jurnalga (admin_audit_log) yozadi.
 * Xatolik yuz bersa ham asosiy amalni to'xtatmaslik uchun sokin (silent) ishlaydi.
 */
export const logAdminAction = async (
  action: AdminAction,
  targetUserId?: string | null,
  details?: Record<string, unknown>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_audit_log").insert({
      admin_id: user.id,
      action,
      target_user_id: targetUserId || null,
      details: details || null,
    });
  } catch (err) {
    console.error("Audit log yozishda xatolik:", err);
  }
};
