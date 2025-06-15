
<?php
/**
 * Cron Job Script für Feuerwehr Inventar System
 * 
 * Dieses Script führt automatisch folgende Aufgaben aus:
 * - Wartungserzeuger (maintenance-auto-generator)
 * - E-Mail Cron Job (email-cron)
 * 
 * Alle Aktionen werden im Cron-Job Monitor angezeigt
 * 
 * Aufruf: php cron.php
 * Oder als Cron-Job: 0 6 * * * /usr/bin/php /path/to/cron.php
 */

// Konfiguration
$SUPABASE_URL = 'https://pkhkswzixavvildtoxxt.supabase.co';
$SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBraGtzd3ppeGF2dmlsZHRveHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDYyMzgsImV4cCI6MjA2MDMyMjIzOH0.534s7M7d-iQ43VIDthJ3uBLxqJPRg5o7TsMyeP2VoJo';

// Logging-Funktion
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    echo "[$timestamp] $message\n";
    
    // Optional: In Datei loggen
    $logFile = dirname(__FILE__) . '/cron.log';
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// Funktion zum Aufrufen der Supabase Edge Functions
function callSupabaseFunction($functionName, $body = null) {
    global $SUPABASE_URL, $SUPABASE_ANON_KEY;
    
    $url = "$SUPABASE_URL/functions/v1/$functionName";
    
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $SUPABASE_ANON_KEY
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300); // 5 Minuten Timeout
    
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    } else {
        curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("CURL Error: $error");
    }
    
    if ($httpCode !== 200) {
        throw new Exception("HTTP Error $httpCode: $response");
    }
    
    return json_decode($response, true);
}

// Hauptausführung
try {
    logMessage("=== Cron Job gestartet ===");
    
    $totalErrors = 0;
    $results = [];
    
    // 1. Wartungserzeuger ausführen
    logMessage("Führe Wartungserzeuger aus...");
    try {
        $maintenanceResult = callSupabaseFunction('maintenance-auto-generator');
        $results['maintenance'] = $maintenanceResult;
        
        if (isset($maintenanceResult['errors']) && $maintenanceResult['errors'] > 0) {
            $totalErrors += $maintenanceResult['errors'];
            logMessage("Wartungserzeuger abgeschlossen mit {$maintenanceResult['errors']} Fehlern");
        } else {
            logMessage("Wartungserzeuger erfolgreich abgeschlossen");
        }
        
        if (isset($maintenanceResult['created'])) {
            logMessage("- {$maintenanceResult['created']} Wartungen erstellt");
        }
        if (isset($maintenanceResult['skipped'])) {
            logMessage("- {$maintenanceResult['skipped']} Wartungen übersprungen");
        }
        
    } catch (Exception $e) {
        logMessage("FEHLER bei Wartungserzeuger: " . $e->getMessage());
        $totalErrors++;
        $results['maintenance'] = ['error' => $e->getMessage()];
    }
    
    // 2. E-Mail Cron Job ausführen
    logMessage("Führe E-Mail Cron Job aus...");
    try {
        $emailResult = callSupabaseFunction('email-cron');
        $results['email'] = $emailResult;
        
        if (isset($emailResult['errors']) && $emailResult['errors'] > 0) {
            $totalErrors += $emailResult['errors'];
            logMessage("E-Mail Cron Job abgeschlossen mit {$emailResult['errors']} Fehlern");
        } else {
            logMessage("E-Mail Cron Job erfolgreich abgeschlossen");
        }
        
        // Details zu versendeten E-Mails
        if (isset($emailResult['upcomingNotifications']) && $emailResult['upcomingNotifications']) {
            $upcomingDetails = $emailResult['upcomingNotifications'];
            if (isset($upcomingDetails['details']) && is_array($upcomingDetails['details'])) {
                logMessage("- " . count($upcomingDetails['details']) . " anstehende Wartungsbenachrichtigungen versendet");
            }
        }
        
        if (isset($emailResult['monthlyReport']) && $emailResult['monthlyReport']) {
            $monthlyDetails = $emailResult['monthlyReport'];
            if (isset($monthlyDetails['details']) && is_array($monthlyDetails['details'])) {
                logMessage("- " . count($monthlyDetails['details']) . " Monatsberichte versendet");
            }
        }
        
    } catch (Exception $e) {
        logMessage("FEHLER bei E-Mail Cron Job: " . $e->getMessage());
        $totalErrors++;
        $results['email'] = ['error' => $e->getMessage()];
    }
    
    // Zusammenfassung
    logMessage("=== Cron Job beendet ===");
    logMessage("Gesamtergebnis: " . ($totalErrors === 0 ? "Erfolgreich" : "$totalErrors Fehler aufgetreten"));
    
    // Exit-Code setzen (0 = Erfolg, 1 = Fehler)
    exit($totalErrors > 0 ? 1 : 0);
    
} catch (Exception $e) {
    logMessage("KRITISCHER FEHLER: " . $e->getMessage());
    exit(1);
}
?>
