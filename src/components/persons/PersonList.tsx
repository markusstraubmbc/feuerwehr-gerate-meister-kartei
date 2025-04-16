
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DeletePersonDialog } from "./DeletePersonDialog";
import { type Person } from "@/hooks/usePersons";

interface PersonListProps {
  persons: Person[];
  onEdit: (person: Person) => void;
}

export function PersonList({ persons, onEdit }: PersonListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);

  const handleDelete = (person: Person) => {
    setCurrentPerson(person);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vorname</TableHead>
              <TableHead>Nachname</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefonnummer</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {persons.length > 0 ? (
              persons.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>{person.first_name}</TableCell>
                  <TableCell>{person.last_name}</TableCell>
                  <TableCell>{person.email || "-"}</TableCell>
                  <TableCell>{person.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(person)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(person)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  Keine Personen gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {currentPerson && (
        <DeletePersonDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          person={currentPerson}
        />
      )}
    </>
  );
}
