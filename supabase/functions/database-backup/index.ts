
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TABLES = [
  "categories",
  "locations",
  "equipment",
  "persons",
  "maintenance_templates",
  "maintenance_records",
  "missions",
  "mission_equipment",
  "settings",
  "equipment_comments"
];

async function getAllData(supabase: any) {
  const backup: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw new Error(`Fehler beim Export von ${table}: ${error.message}`);
    backup[table] = data;
  }
  return backup;
}

async function restoreAllData(supabase: any, allData: Record<string, unknown[]>) {
  // Optional: Vorher alles löschen oder nur updaten (hier: truncate & bulk insert)
  for (const table of TABLES.reverse()) { // Rückwärts wg. Foreign Keys
    await supabase.rpc('truncate_table', { table_name: table }).throwOnError();
  }
  for (const table of TABLES) {
    const rows = allData[table];
    if (rows && rows.length > 0) {
      const { error } = await supabase.from(table).insert(rows);
      if (error) throw new Error(`Fehler beim Importieren in ${table}: ${error.message}`);
    }
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  try {
    if (req.method === "GET") {
      // Backup-Modus
      const result = await getAllData(supabase);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (req.method === "POST") {
      // Restore-Modus
      const json = await req.json();
      await restoreAllData(supabase, json);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: corsHeaders,
      });
    } else {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
