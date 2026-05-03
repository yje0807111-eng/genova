import { createServiceSupabaseClient } from "@/lib/supabase/service";
import fs from "fs";
import path from "path";

async function runMigration() {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    console.error("No Supabase client");
    return;
  }

  const sql = fs.readFileSync(
    path.join(process.cwd(), "src/lib/migrations/create_messages_table.sql"),
    "utf-8",
  );

  const { error } = await supabase.rpc("exec_sql", { sql });
  if (error) console.error("Migration error:", error);
  else console.log("Migration successful!");
}

runMigration();
