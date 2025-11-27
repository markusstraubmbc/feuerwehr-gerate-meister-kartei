import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useCategories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CategoryNotificationSettings() {
  const { data: categories = [] } = useCategories();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kategorie-Verantwortliche</CardTitle>
        <CardDescription>
          Diese Personen werden automatisch bei Benachrichtigungen für ihre Kategorien einbezogen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {category.description || 'Keine Beschreibung'}
                  </div>
                </div>
                <div>
                  {category.responsible_person ? (
                    <Badge variant="secondary">
                      {category.responsible_person.first_name} {category.responsible_person.last_name}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Keine Person zugewiesen</Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Kategorien vorhanden
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Hinweis: Verantwortliche Personen können in den Kategorieeinstellungen zugewiesen werden.
          Sie werden automatisch in Benachrichtigungen für Ausrüstung ihrer Kategorie einbezogen.
        </p>
      </CardContent>
    </Card>
  );
}