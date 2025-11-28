# Feuerwehr Inventar System - Database Backup

Dieses Verzeichnis enthält vollständige Datenbank-Backups des Feuerwehr Inventar Systems.

## Dateien

### Schema
- **schema.sql** - Vollständiges Datenbankschema inkl. Tabellen, Indizes, Funktionen, Trigger und RLS-Policies

### Daten
Die Daten sind in thematische JSON-Dateien aufgeteilt:

- **data-master-tables.json** - Stammdaten (Kategorien, Standorte, Personen, Aktionen, Wartungsvorlagen)
- **data-equipment.json** - Ausrüstungsinventar
- **data-maintenance.json** - Wartungsdatensätze und Benachrichtigungshistorie
- **data-missions.json** - Einsätze, Übungen und zugeordnete Ausrüstung
- **data-comments-logs.json** - Ausrüstungsaktionen/-kommentare und Cronjob-Logs

## Wiederherstellung

### 1. Schema wiederherstellen
```sql
psql -h your-host -U your-user -d your-database -f schema.sql
```

### 2. Daten wiederherstellen
Verwenden Sie die Backup & Restore-Funktion im System unter:
- Einstellungen → Systemeinstellungen → System-Daten Backup & Wiederherstellung

Oder nutzen Sie die Edge Function `/functions/v1/database-backup` mit POST-Request und den JSON-Daten.

## Backup-Strategie

### Automatisches Backup
Das System bietet eine integrierte Backup-Funktion:
- Manuelles Backup über UI (Einstellungen → Systemeinstellungen)
- Export erfolgt als JSON-Datei mit allen Tabellendaten

### Manuelles Backup
```bash
# Schema exportieren
pg_dump -h your-host -U your-user -d your-database --schema-only > schema.sql

# Daten exportieren (via Edge Function)
curl -X GET https://your-project.supabase.co/functions/v1/database-backup \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  > backup-$(date +%Y%m%d-%H%M%S).json
```

## Tabellen-Übersicht

### Stammdaten
- **categories** - Ausrüstungskategorien mit Benachrichtigungsintervallen
- **locations** - Standorte/Räume
- **persons** - Personen mit Rollen und Kontaktdaten
- **equipment_actions** - Vordefinierte Aktionstypen

### Ausrüstung
- **equipment** - Ausrüstungsgegenstände
- **equipment_comments** - Aktionen/Kommentare zu Ausrüstung

### Wartung
- **maintenance_templates** - Wartungsvorlagen mit Intervallen
- **maintenance_records** - Durchgeführte/geplante Wartungen
- **maintenance_notification_history** - Benachrichtigungshistorie

### Einsätze & Übungen
- **missions** - Einsätze und Übungen
- **mission_equipment** - Zugeordnete Ausrüstung
- **mission_equipment_templates** - Ausrüstungsvorlagen
- **template_equipment_items** - Vorlagenzuordnungen
- **template_inventory_checks** - Inventurprüfungen
- **inventory_check_items** - Inventurprüfungsdetails

### System
- **settings** - Systemeinstellungen (JSONB)
- **cron_job_logs** - Protokolle automatischer Jobs

## Wichtige Hinweise

⚠️ **Sicherheit**
- Service Role Keys niemals in der Anwendung hardcoden
- Backups sicher aufbewahren (enthalten alle Unternehmensdaten)
- Regelmäßige Backups erstellen (mindestens wöchentlich)

⚠️ **Wiederherstellung**
- Beim Wiederherstellen werden ALLE aktuellen Daten überschrieben
- Vor Wiederherstellung immer aktuellen Stand sichern
- Testwiederherstellung in Entwicklungsumgebung durchführen

## Edge Function

Die Edge Function `database-backup` unter `/functions/v1/database-backup` bietet:

### GET - Backup erstellen
Exportiert alle Tabellendaten als JSON
```bash
curl -X GET https://your-project.supabase.co/functions/v1/database-backup \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### POST - Backup wiederherstellen
Importiert Tabellendaten aus JSON
```bash
curl -X POST https://your-project.supabase.co/functions/v1/database-backup \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d @backup.json
```

## Support

Bei Fragen zum Backup/Restore-System:
- Siehe Systemeinstellungen → Hilfe & Kontakt
- Dokumentation im Code unter `supabase/functions/database-backup/`
