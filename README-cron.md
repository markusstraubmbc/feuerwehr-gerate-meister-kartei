
# Cron Job Setup für Feuerwehr Inventar System

## Beschreibung
Das `cron.php` Script führt automatisch folgende Aufgaben aus:
- **Wartungserzeuger**: Erstellt automatisch neue Wartungsaufgaben basierend auf Templates
- **E-Mail Versendung**: Versendet anstehende Wartungsbenachrichtigungen und Monatsberichte

Alle Ausführungen werden im Cron-Job Monitor der Systemeinstellungen angezeigt.

## Installation und Konfiguration

### 1. Manuelle Ausführung (zum Testen)
```bash
php cron.php
```

### 2. Automatische Ausführung einrichten

#### Linux/Unix (crontab)
```bash
# Crontab bearbeiten
crontab -e

# Täglich um 6:00 Uhr ausführen
0 6 * * * /usr/bin/php /pfad/zum/cron.php >> /pfad/zum/cron.log 2>&1

# Oder stündlich (für Tests)
0 * * * * /usr/bin/php /pfad/zum/cron.php >> /pfad/zum/cron.log 2>&1
```

#### Windows (Aufgabenplanung)
1. Aufgabenplanung öffnen (`taskschd.msc`)
2. "Einfache Aufgabe erstellen" wählen
3. Name: "Feuerwehr Inventar Cron"
4. Trigger: Täglich um 6:00 Uhr
5. Aktion: "Programm starten"
6. Programm: `C:\xampp\php\php.exe` (Pfad anpassen)
7. Argumente: `C:\pfad\zum\cron.php` (Pfad anpassen)

### 3. Hosting-Provider
Die meisten Hosting-Provider bieten Cron-Job Verwaltung im Control Panel:
- **cPanel**: Unter "Cron Jobs"
- **Plesk**: Unter "Geplante Aufgaben"
- **DirectAdmin**: Unter "Cronjobs"

Beispiel-Befehl für Hosting:
```
/usr/local/bin/php /home/username/public_html/cron.php
```

## Monitoring

### Log-Datei
Das Script erstellt automatisch eine `cron.log` Datei im gleichen Verzeichnis mit detaillierten Ausführungsinformationen.

### Cron-Job Monitor
Alle Ausführungen sind im Systemeinstellungen → Cron-Job Monitoring einsehbar:
- Status (Erfolgreich/Fehler)
- Ausführungszeit und Dauer
- Detaillierte Ergebnisse
- Fehlermeldungen

### E-Mail Benachrichtigungen
Bei Fehlern können Sie zusätzlich E-Mail-Benachrichtigungen einrichten:
```bash
# In crontab: Bei Fehlern E-Mail senden
MAILTO="admin@ihre-domain.de"
0 6 * * * /usr/bin/php /pfad/zum/cron.php
```

## Zeitpläne

### Empfohlene Ausführungszeiten
- **Wartungserzeuger**: Täglich früh morgens (z.B. 6:00 Uhr)
- **E-Mail Versendung**: Täglich (wird intern gesteuert - Anstehende täglich, Berichte monatlich)

### Beispiel-Zeitpläne
```bash
# Täglich um 6:00 Uhr
0 6 * * * /usr/bin/php /pfad/zum/cron.php

# Jeden Montag um 7:00 Uhr
0 7 * * 1 /usr/bin/php /pfad/zum/cron.php

# Zweimal täglich (6:00 und 18:00)
0 6,18 * * * /usr/bin/php /pfad/zum/cron.php
```

## Problembehandlung

### Häufige Probleme
1. **Script läuft nicht**: PHP-Pfad prüfen (`which php`)
2. **Keine Berechtigung**: Dateirechte prüfen (`chmod +x cron.php`)
3. **Timeout**: Script-Timeout in der `cron.php` erhöhen
4. **Logs fehlen**: Schreibberechtigung im Verzeichnis prüfen

### Debug-Modus
Für detaillierte Ausgaben das Script manuell ausführen:
```bash
php cron.php 2>&1 | tee debug.log
```

### Status prüfen
- **System-Monitor**: `/settings/system` → "Cron-Job Monitoring"
- **Log-Datei**: `cron.log` im Script-Verzeichnis
- **Supabase Logs**: Edge Function Logs im Supabase Dashboard

## Sicherheit

### Wichtige Hinweise
- **API-Keys**: Niemals in öffentlich zugänglichen Verzeichnissen speichern
- **Log-Dateien**: Regelmäßig bereinigen (Log-Rotation einrichten)
- **Dateiberechtigungen**: Nur notwendige Rechte vergeben

### Log-Rotation (empfohlen)
```bash
# /etc/logrotate.d/feuerwehr-cron
/pfad/zum/cron.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
```
