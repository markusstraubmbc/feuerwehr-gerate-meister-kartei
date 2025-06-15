
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface EquipmentCommentCountProps {
  count: number;
  onViewComments: () => void;
}

export function EquipmentCommentCount({ count, onViewComments }: EquipmentCommentCountProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{count}</span>
      {count > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewComments}
          className="h-6 px-2 text-xs"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Anzeigen
        </Button>
      )}
    </div>
  );
}
