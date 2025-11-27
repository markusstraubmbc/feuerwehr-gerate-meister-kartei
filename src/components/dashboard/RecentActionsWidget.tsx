import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, User, Calendar, Tag } from "lucide-react";
import { useAllEquipmentComments } from "@/hooks/useEquipmentComments";
import { useEquipment } from "@/hooks/useEquipment";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { SELECT_ALL_VALUE } from "@/lib/constants";

interface RecentActionsWidgetProps {
  categoryFilter?: string;
  personFilter?: string;
  locationFilter?: string;
  yearFilter?: string;
}

export const RecentActionsWidget = ({
  categoryFilter,
  personFilter,
  locationFilter,
  yearFilter
}: RecentActionsWidgetProps) => {
  const { data: allComments = [] } = useAllEquipmentComments();
  const { data: equipment = [] } = useEquipment();

  // Apply filters
  const filteredComments = allComments.filter(comment => {
    const equipmentItem = equipment.find(item => item.id === comment.equipment_id);
    
    if (categoryFilter && categoryFilter !== SELECT_ALL_VALUE && equipmentItem?.category_id !== categoryFilter) {
      return false;
    }
    
    if (personFilter && personFilter !== SELECT_ALL_VALUE && comment.person_id !== personFilter) {
      return false;
    }
    
    if (locationFilter && locationFilter !== SELECT_ALL_VALUE && equipmentItem?.location_id !== locationFilter) {
      return false;
    }
    
    if (yearFilter && yearFilter !== "all") {
      const commentYear = new Date(comment.created_at).getFullYear().toString();
      if (commentYear !== yearFilter) {
        return false;
      }
    }
    
    return true;
  });

  // Get latest 10 actions
  const recentActions = filteredComments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Letzte Aktionen
        </CardTitle>
        <CardDescription>Die 10 zuletzt durchgeführten Aktionen</CardDescription>
      </CardHeader>
      <CardContent>
        {recentActions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Keine Aktionen gefunden
          </div>
        ) : (
          <div className="space-y-3">
            {recentActions.map((action) => {
              const equipmentItem = equipment.find(item => item.id === action.equipment_id);
              
              return (
                <div key={action.id} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">
                          {equipmentItem?.name || "Unbekannte Ausrüstung"}
                        </p>
                        {action.action && (
                          <Badge variant="outline" className="text-xs">
                            {action.action.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {action.comment}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{action.person.first_name} {action.person.last_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(action.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                        </div>
                        {equipmentItem?.category && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{equipmentItem.category.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
