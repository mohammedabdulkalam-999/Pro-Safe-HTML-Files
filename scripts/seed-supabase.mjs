/**
 * Seed demo data into Supabase.
 * Run: npm run db:seed
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
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
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_CALLS = [
  {
    call_id: "call_demo_001",
    customer_name: "John Smith",
    phone_number: "+15555555555",
    status: "completed",
    duration_seconds: 135,
    assistant_name: "Sarah",
    transcript: [
      { speaker: "assistant", message: "Hello John, this is Sarah from Pro-Vigil. Do you currently have CCTV on site?" },
      { speaker: "customer", message: "Yes, we have about 20 cameras across our construction yard." },
      { speaker: "assistant", message: "Great. Are they actively monitored or recording only?" },
      { speaker: "customer", message: "Recording only right now. We had a theft last month." },
      { speaker: "assistant", message: "I understand. Would you be open to a consultation on remote video monitoring?" },
      { speaker: "customer", message: "Yes, please schedule something for tomorrow at 10 AM." },
    ],
    raw_transcript: "Sarah: Hello John... Customer: Yes, 20 cameras...",
    summary: {
      lead_qualified: true,
      consultation_requested: true,
      company_name: "ABC Construction",
      callback_date: "Tomorrow",
      callback_time: "10:00 AM",
      summary: "Customer has 20 cameras, recording only. Security incident last month. Requested consultation tomorrow at 10 AM.",
      structured_output: {
        industry: "Construction",
        cameraInstalled: true,
        monitoring: "Recording Only",
        securityIncident: "Yes",
        interestLevel: "High",
        nextAction: "Schedule Demo",
      },
    },
  },
  {
    call_id: "call_demo_002",
    customer_name: "Mike Johnson",
    phone_number: "+15555551234",
    status: "in-progress",
    duration_seconds: 48,
    assistant_name: "Sarah",
    transcript: [
      { speaker: "assistant", message: "Hello Mike, this is Sarah from Pro-Vigil." },
      { speaker: "customer", message: "Hi, yes I have a few minutes." },
    ],
    raw_transcript: "Sarah: Hello Mike... Customer: Hi, yes I have a few minutes.",
  },
  {
    call_id: "call_demo_003",
    customer_name: "Jane Smith",
    phone_number: "+15555559876",
    status: "completed",
    duration_seconds: 62,
    assistant_name: "Sarah",
    transcript: [
      { speaker: "assistant", message: "Hello Jane, this is Sarah from Pro-Vigil." },
      { speaker: "customer", message: "Not interested, please remove me from your list." },
    ],
    raw_transcript: "Sarah: Hello Jane... Customer: Not interested.",
    summary: {
      lead_qualified: false,
      consultation_requested: false,
      summary: "Customer declined interest. Requested removal from contact list.",
      structured_output: { interestLevel: "None", nextAction: "Do Not Contact" },
    },
  },
  {
    call_id: "call_demo_004",
    customer_name: "Bob Johnson",
    phone_number: "+15555554321",
    status: "failed",
    duration_seconds: 0,
    assistant_name: "Sarah",
  },
  {
    call_id: "call_demo_005",
    customer_name: "David Lee",
    phone_number: "+15555556789",
    status: "ringing",
    duration_seconds: 0,
    assistant_name: "Sarah",
  },
];

async function seed() {
  console.log("Seeding demo data into Supabase...\n");

  let inserted = 0;
  let skipped = 0;

  for (const demo of DEMO_CALLS) {
    const { data: existing } = await supabase
      .from("calls")
      .select("id")
      .eq("call_id", demo.call_id)
      .maybeSingle();

    let callUuid;

    if (existing) {
      console.log(`  ↷ ${demo.call_id} already exists — skipping`);
      skipped += 1;
      callUuid = existing.id;
    } else {
      const { data: call, error: callError } = await supabase
        .from("calls")
        .insert({
          call_id: demo.call_id,
          customer_name: demo.customer_name,
          phone_number: demo.phone_number,
          status: demo.status,
          duration_seconds: demo.duration_seconds,
          assistant_name: demo.assistant_name,
        })
        .select("id")
        .single();

      if (callError) {
        console.error(`  ✗ Failed to insert ${demo.call_id}:`, callError.message);
        continue;
      }

      callUuid = call.id;
      inserted += 1;
      console.log(`  ✓ Inserted call: ${demo.customer_name} (${demo.status})`);
    }

    if (demo.transcript && callUuid) {
      const { data: existingTx } = await supabase
        .from("transcripts")
        .select("id")
        .eq("call_id", callUuid)
        .maybeSingle();

      if (!existingTx) {
        const { error: txError } = await supabase.from("transcripts").insert({
          call_id: callUuid,
          transcript: demo.transcript,
          raw_transcript: demo.raw_transcript ?? null,
        });

        if (txError) {
          console.error(`    ✗ Transcript for ${demo.call_id}:`, txError.message);
        } else {
          console.log(`    ✓ Transcript added`);
        }
      }
    }

    if (demo.summary && callUuid) {
      const { data: existingSum } = await supabase
        .from("summaries")
        .select("id")
        .eq("call_id", callUuid)
        .maybeSingle();

      if (!existingSum) {
        const { error: sumError } = await supabase.from("summaries").insert({
          call_id: callUuid,
          ...demo.summary,
        });

        if (sumError) {
          console.error(`    ✗ Summary for ${demo.call_id}:`, sumError.message);
        } else {
          console.log(`    ✓ Summary added`);
        }
      }
    }
  }

  const { count } = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true });

  console.log(`\nDone. ${inserted} new call(s), ${skipped} skipped. Total calls: ${count ?? 0}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
