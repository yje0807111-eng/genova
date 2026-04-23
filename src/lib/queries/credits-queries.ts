import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CreditTransactionRow = {
  id: string;
  userId: string;
  delta: number;
  balanceAfter: number | null;
  reason: string | null;
  createdAt: string;
};

function mapTx(row: {
  id: string;
  user_id: string;
  delta: number;
  balance_after: number | null;
  reason: string | null;
  created_at: string;
}): CreditTransactionRow {
  return {
    id: row.id,
    userId: row.user_id,
    delta: row.delta,
    balanceAfter: row.balance_after,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

/** Returns recent credit transactions for the user, or empty if the table is missing or RLS denies. */
export async function fetchCreditTransactionsForUser(userId: string, limit = 50): Promise<CreditTransactionRow[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("id, user_id, delta, balance_after, reason, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(mapTx);
}
