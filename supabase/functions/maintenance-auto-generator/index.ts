
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const jobName = 'maintenance-auto-generator'
  const startTime = new Date()
  
  try {
    // Log job start
    const { data: logEntry } = await supabase
      .from('cron_job_logs')
      .insert({
        job_name: jobName,
        status: 'running',
        started_at: startTime.toISOString()
      })
      .select()
      .single()

    console.log('Starting maintenance auto-generator job...')
    
    let created = 0
    let skipped = 0
    let errors = 0

    // Get all equipment with categories
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        *,
        categories (*)
      `)

    if (equipmentError) {
      throw equipmentError
    }

    // Get all maintenance templates
    const { data: templates, error: templatesError } = await supabase
      .from('maintenance_templates')
      .select('*')

    if (templatesError) {
      throw templatesError
    }

    const now = new Date()
    const endDate = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000)) // 180 days from now

    for (const item of equipment || []) {
      try {
        // Find matching template based on category
        const template = templates?.find(t => t.category_id === item.category_id)
        
        if (!template) {
          console.log(`No template found for equipment ${item.name}`)
          skipped++
          continue
        }

        // Calculate maintenance dates
        const baseDate = item.last_check_date 
          ? new Date(item.last_check_date)
          : item.purchase_date 
          ? new Date(item.purchase_date)
          : new Date()

        const maintenanceDates = []
        let currentDate = new Date(baseDate)

        // Generate all needed dates within the next 180 days
        while (currentDate <= endDate) {
          currentDate = new Date(currentDate)
          currentDate.setMonth(currentDate.getMonth() + template.interval_months)
          
          if (currentDate <= endDate) {
            maintenanceDates.push(new Date(currentDate))
          }
        }

        // Check existing records for each date and create missing ones
        for (const dueDate of maintenanceDates) {
          const startOfDay = new Date(dueDate)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(dueDate)
          endOfDay.setHours(23, 59, 59, 999)

          const { data: existingRecords } = await supabase
            .from('maintenance_records')
            .select('id')
            .eq('equipment_id', item.id)
            .eq('template_id', template.id)
            .gte('due_date', startOfDay.toISOString())
            .lte('due_date', endOfDay.toISOString())

          if (existingRecords && existingRecords.length > 0) {
            console.log(`Maintenance already exists for ${item.name} on ${dueDate.toDateString()}`)
            skipped++
            continue
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
            })

          if (error) {
            console.error(`Error creating maintenance for ${item.name} on ${dueDate.toDateString()}:`, error)
            errors++
          } else {
            created++
          }
        }
      } catch (error) {
        console.error(`Error processing equipment ${item.name}:`, error)
        errors++
      }
    }

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    
    const result = { created, skipped, errors }
    
    // Update log entry with completion info
    if (logEntry) {
      await supabase
        .from('cron_job_logs')
        .update({
          status: errors > 0 ? 'error' : 'success',
          completed_at: endTime.toISOString(),
          duration_seconds: duration,
          details: result,
          error_message: errors > 0 ? `${errors} errors occurred during processing` : null
        })
        .eq('id', logEntry.id)
    }

    console.log(`Job completed: ${created} created, ${skipped} skipped, ${errors} errors`)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in maintenance auto-generator:', error)
    
    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    
    // Log error
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: jobName,
        status: 'error',
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString(),
        duration_seconds: duration,
        error_message: error.message,
        details: { error: error.message }
      })

    return new Response(
      JSON.stringify({ 
        error: error.message,
        created: 0,
        skipped: 0,
        errors: 1
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
