
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting automatic maintenance generation...');

    // Get all equipment
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('*');

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      throw equipmentError;
    }

    // Get all templates
    const { data: templates, error: templatesError } = await supabase
      .from('maintenance_templates')
      .select('*');

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      throw templatesError;
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 180); // Next 180 days

    for (const item of equipment) {
      try {
        // Find matching template based on category
        const template = templates.find(t => t.category_id === item.category_id);
        
        if (!template) {
          console.log(`No template found for equipment ${item.name}`);
          skipped++;
          continue;
        }

        // Calculate all missing maintenance dates for the next 180 days
        const baseDate = item.last_check_date 
          ? new Date(item.last_check_date)
          : item.purchase_date 
          ? new Date(item.purchase_date)
          : new Date();

        let currentDate = new Date(baseDate);
        const maintenanceDates = [];

        // Generate all needed dates within the next 180 days
        while (currentDate <= endDate) {
          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + template.interval_months);
          
          if (currentDate <= endDate) {
            maintenanceDates.push(new Date(currentDate));
          }
        }

        // Check existing records for each date and create missing ones
        for (const dueDate of maintenanceDates) {
          const startOfDay = new Date(dueDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(dueDate);
          endOfDay.setHours(23, 59, 59, 999);

          const { data: existingRecords } = await supabase
            .from('maintenance_records')
            .select('id')
            .eq('equipment_id', item.id)
            .eq('template_id', template.id)
            .gte('due_date', startOfDay.toISOString())
            .lte('due_date', endOfDay.toISOString());

          if (existingRecords && existingRecords.length > 0) {
            console.log(`Maintenance already exists for ${item.name} on ${dueDate.toDateString()}`);
            skipped++;
            continue;
          }

          // Create new maintenance record
          const { error } = await supabase
            .from('maintenance_records')
            .insert({
              equipment_id: item.id,
              template_id: template.id,
              due_date: dueDate.toISOString(),
              status: 'ausstehend',
              performed_by: template.responsible_person_id
            });

          if (error) {
            console.error(`Error creating maintenance for ${item.name} on ${dueDate.toDateString()}:`, error);
            errors++;
          } else {
            console.log(`Created maintenance for ${item.name} on ${dueDate.toDateString()}`);
            created++;
          }
        }
      } catch (error) {
        console.error(`Error processing equipment ${item.name}:`, error);
        errors++;
      }
    }

    const report = { created, skipped, errors, timestamp: new Date().toISOString() };
    console.log('Maintenance generation completed:', report);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in maintenance auto-generator:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
