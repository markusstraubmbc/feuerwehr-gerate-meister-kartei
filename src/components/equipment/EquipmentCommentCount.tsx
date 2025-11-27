
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

interface EquipmentCommentCountProps {
  count: number;
  onViewComments: () => void;
}

export function EquipmentCommentCount({ count, onViewComments }: EquipmentCommentCountProps) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0"
      onClick={onViewComments}
    >
      <div className="relative">
        <MessageSquare className="h-4 w-4" />
        {count > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
          >
            {count}
          </Badge>
        )}
      </div>
    </Button>
  );
}
