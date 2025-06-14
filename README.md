
# Wartungsmanagement System

Ein umfassendes System zur Verwaltung von Ausrüstung und Wartungen mit automatischen E-Mail-Benachrichtigungen.

## Features

- Ausrüstungsverwaltung mit Barcodes
- Wartungsplanung und -verfolgung
- Automatische E-Mail-Benachrichtigungen
- PDF-Export von Checklisten
- Anpassbare Systemeinstellungen

## Automatischer Cron-Job für E-Mail-Benachrichtigungen

Das System unterstützt automatische E-Mail-Benachrichtigungen über einen Cron-Job, der extern aufgerufen werden kann.

### Einrichtung des Cron-Jobs

1. **Edge Function konfigurieren**: Die `email-cron` Funktion ist bereits konfiguriert und kann über folgende URL aufgerufen werden:
   ```
   https://pkhkswzixavvildtoxxt.supabase.co/functions/v1/email-cron
   ```

2. **Cron-Job URL**: Verwenden Sie diese URL in Ihrem externen Cron-Service (z.B. crontab, GitHub Actions, oder einem Cron-Service):
   ```bash
   curl -X POST https://pkhkswzixavvildtoxxt.supabase.co/functions/v1/email-cron \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBraGtzd3ppeGF2dmlsZHRveHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDYyMzgsImV4cCI6MjA2MDMyMjIzOH0.534s7M7d-iQ43VIDthJ3uBLxqJPRg5o7TsMyeP2VoJo"
   ```

3. **Empfohlene Cron-Frequenz**: Täglich um 8:00 Uhr
   ```
   0 8 * * * curl -X POST https://pkhkswzixavvildtoxxt.supabase.co/functions/v1/email-cron [...]
   ```

### Funktionsweise

Der Cron-Job prüft:
- **Wartungsbenachrichtigungen**: Sendet E-Mails für anstehende Wartungen basierend auf den konfigurierten Vorlaufzeiten
- **Monatliche Berichte**: Sendet am konfigurierten Tag des Monats einen Wartungsbericht

### E-Mail-Einstellungen

Die Benachrichtigungsintervalle können in der Anwendung unter "Einstellungen > E-Mail-Einstellungen" konfiguriert werden:
- Vorlaufzeit für Wartungsbenachrichtigungen (1-30 Tage)
- Tag des Monats für monatliche Berichte (1-28)

## Supabase SQL Setup

Zur Wiederherstellung der Datenbank verwenden Sie folgende SQL-Befehle:

### Tabellen erstellen

```sql
-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT
);

-- Locations table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT
);

-- Persons table
CREATE TABLE IF NOT EXISTS public.persons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT
);

-- Equipment status enum
CREATE TYPE equipment_status AS ENUM (
    'einsatzbereit',
    'wartung_erforderlich',
    'defekt',
    'ausser_betrieb'
);

-- Equipment table
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    inventory_number TEXT,
    barcode TEXT,
    category_id UUID REFERENCES public.categories(id),
    location_id UUID REFERENCES public.locations(id),
    responsible_person_id UUID REFERENCES public.persons(id),
    status equipment_status NOT NULL DEFAULT 'einsatzbereit',
    purchase_date DATE,
    replacement_date DATE,
    last_check_date TIMESTAMP WITH TIME ZONE,
    next_check_date TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Maintenance templates table
CREATE TABLE IF NOT EXISTS public.maintenance_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    interval_months INTEGER NOT NULL,
    estimated_minutes INTEGER,
    category_id UUID REFERENCES public.categories(id),
    responsible_person_id UUID REFERENCES public.persons(id),
    checklist_url TEXT,
    checks TEXT
);

-- Maintenance status enum
CREATE TYPE maintenance_status AS ENUM (
    'ausstehend',
    'geplant',
    'in_bearbeitung',
    'abgeschlossen'
);

-- Maintenance records table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id),
    template_id UUID REFERENCES public.maintenance_templates(id),
    status maintenance_status NOT NULL DEFAULT 'ausstehend',
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    performed_date TIMESTAMP WITH TIME ZONE,
    performed_by UUID REFERENCES public.persons(id),
    minutes_spent INTEGER,
    notes TEXT,
    documentation_image_url TEXT
);

-- Equipment comments table
CREATE TABLE IF NOT EXISTS public.equipment_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id),
    person_id UUID NOT NULL REFERENCES public.persons(id),
    comment TEXT NOT NULL
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL
);
```

### Funktionen erstellen

```sql
-- Function to add equipment comments
CREATE OR REPLACE FUNCTION public.add_equipment_comment(
    equipment_id_param UUID,
    person_id_param UUID,
    comment_param TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO equipment_comments (equipment_id, person_id, comment)
    VALUES (equipment_id_param, person_id_param, comment_param);
END;
$$;

-- Function to get equipment comments
CREATE OR REPLACE FUNCTION public.get_equipment_comments(equipment_id_param UUID)
RETURNS SETOF JSON
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        json_build_object(
            'id', c.id,
            'equipment_id', c.equipment_id,
            'person_id', c.person_id,
            'comment', c.comment,
            'created_at', c.created_at,
            'person', json_build_object(
                'id', p.id,
                'first_name', p.first_name,
                'last_name', p.last_name
            )
        )
    FROM 
        equipment_comments c
        JOIN persons p ON c.person_id = p.id
    WHERE 
        c.equipment_id = equipment_id_param
    ORDER BY 
        c.created_at DESC;
END;
$$;
```

### Cron-Job Setup in Supabase (optional)

Falls Sie den Cron-Job direkt in Supabase ausführen möchten, aktivieren Sie die Extensions und erstellen Sie einen Cron-Job:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job (runs daily at 8:00 AM)
SELECT cron.schedule(
    'maintenance-email-notifications',
    '0 8 * * *',
    $$
    SELECT
        net.http_post(
            url := 'https://pkhkswzixavvildtoxxt.supabase.co/functions/v1/email-cron',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBraGtzd3ppeGF2dmlsZHRveHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDYyMzgsImV4cCI6MjA2MDMyMjIzOH0.534s7M7d-iQ43VIDthJ3uBLxqJPRg5o7TsMyeP2VoJo"}'::jsonb,
            body := '{"source": "cron"}'::jsonb
        ) AS request_id;
    $$
);
```

## Umgebungsvariablen

Folgende Secrets müssen in Supabase konfiguriert werden:
- `RESEND_API_KEY`: API-Schlüssel für den E-Mail-Versand über Resend
- `SUPABASE_URL`: Supabase Projekt-URL
- `SUPABASE_ANON_KEY`: Supabase Anonymous Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key

## Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build für Produktion
npm run build
```

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.
