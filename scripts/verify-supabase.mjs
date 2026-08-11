/**
 * Quick Supabase connectivity + schema check.
 * Run: node scripts/verify-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.error("Could not read .env.local");
    process.exit(1);
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tables = ["calls", "transcripts", "summaries"];
const views = ["call_dashboard"];

async function checkTable(name) {
  const { error, count } = await supabase
    .from(name)
    .select("*", { count: "exact", head: true });

  if (error) {
    return { name, ok: false, error: error.message };
  }
  return { name, ok: true, count: count ?? 0 };
}

console.log("Verifying Supabase connection...\n");
console.log(`Project: ${url}\n`);

let allOk = true;

for (const table of tables) {
  const result = await checkTable(table);
  if (result.ok) {
    console.log(`  ✓ ${table} table — ${result.count} row(s)`);
  } else {
    console.log(`  ✗ ${table} table — ${result.error}`);
    allOk = false;
  }
}

for (const view of views) {
  const result = await checkTable(view);
  if (result.ok) {
    console.log(`  ✓ ${view} view — ${result.count ?? 0} row(s)`);
  } else {
    console.log(`  ✗ ${view} view — ${result.error}`);
    allOk = false;
  }
}

console.log("");
if (allOk) {
  console.log("Supabase is connected and schema looks good.");
  process.exit(0);
} else {
  console.log("Some checks failed. Re-run supabase/run-schema.sql or npm run db:seed");
  process.exit(1);
}
