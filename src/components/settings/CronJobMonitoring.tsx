
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Activity, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useCronJobLogs, useCronJobStats } from "@/hooks/useCronJobLogs";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export const CronJobMonitoring = () => {
  const [selectedJobName, setSelectedJobName] = useState<string>("all");
  const [logLimit, setLogLimit] = useState(50);
  
  const { data: logs = [], isLoading: logsLoading, refetch: refetchLogs } = useCronJobLogs(
    selectedJobName === "all" ? undefined : selectedJobName, 
    logLimit
  );
  const { data: stats = {}, isLoading: statsLoading, refetch: refetchStats } = useCronJobStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Erfolgreich</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Fehler</Badge>;
      case 'running':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Läuft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss', { locale: de });
  };

  const jobNames = Object.keys(stats);
  const totalJobs = Object.values(stats).reduce((sum: number, stat: any) => sum + stat.total, 0);
  const totalSuccess = Object.values(stats).reduce((sum: number, stat: any) => sum + stat.success, 0);
  const totalErrors = Object.values(stats).reduce((sum: number, stat: any) => sum + stat.error, 0);

  const handleRefresh = () => {
    refetchLogs();
    refetchStats();
  };

  if (statsLoading || logsLoading) {
    return <div>Lade Cron-Job Informationen...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Cron-Job Monitoring
            </CardTitle>
            <CardDescription>
              Übersicht über automatische Wartungsjobs und deren Ausführungsstatus
            </CardDescription>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="logs">Detaillierte Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-800">{totalJobs}</div>
                <div className="text-sm text-blue-600">Gesamt Ausführungen</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-800">{totalSuccess}</div>
                <div className="text-sm text-green-600">Erfolgreich</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="font-semibold text-red-800">{totalErrors}</div>
                <div className="text-sm text-red-600">Fehler</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-800">{jobNames.length}</div>
                <div className="text-sm text-purple-600">Verschiedene Jobs</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Job Status Übersicht</h4>
              {jobNames.map((jobName) => {
                const stat = stats[jobName];
                const successRate = stat.total > 0 ? Math.round((stat.success / stat.total) * 100) : 0;
                
                return (
                  <div key={jobName} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{jobName}</h5>
                      {getStatusBadge(stat.lastStatus)}
                    </div>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Letzte Ausführung:</span>
                        <div>{stat.lastRun ? formatDate(stat.lastRun) : 'Nie'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Erfolgsrate:</span>
                        <div className="flex items-center gap-2">
                          <span>{successRate}%</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ausführungen:</span>
                        <div>
                          {stat.success} / {stat.total} 
                          {stat.error > 0 && <span className="text-red-600 ml-2">({stat.error} Fehler)</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex gap-4 items-center">
              <Select value={selectedJobName} onValueChange={setSelectedJobName}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Job auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Jobs</SelectItem>
                  {jobNames.map((jobName) => (
                    <SelectItem key={jobName} value={jobName}>
                      {jobName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={logLimit.toString()} onValueChange={(value) => setLogLimit(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 Einträge</SelectItem>
                  <SelectItem value="50">50 Einträge</SelectItem>
                  <SelectItem value="100">100 Einträge</SelectItem>
                  <SelectItem value="200">200 Einträge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gestartet</TableHead>
                    <TableHead>Abgeschlossen</TableHead>
                    <TableHead>Dauer</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Keine Log-Einträge gefunden
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.job_name}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>{formatDate(log.started_at)}</TableCell>
                        <TableCell>
                          {log.completed_at ? formatDate(log.completed_at) : '-'}
                        </TableCell>
                        <TableCell>{formatDuration(log.duration_seconds)}</TableCell>
                        <TableCell className="max-w-xs">
                          {log.error_message && (
                            <div className="text-red-600 text-xs truncate" title={log.error_message}>
                              {log.error_message}
                            </div>
                          )}
                          {log.details && (
                            <div className="text-xs text-muted-foreground truncate" title={JSON.stringify(log.details)}>
                              {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
