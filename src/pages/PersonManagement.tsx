
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  ArrowLeft,
  User
} from "lucide-react";
import { usePersons } from "@/hooks/usePersons";
import { PersonList } from "@/components/persons/PersonList";
import { PersonForm } from "@/components/persons/PersonForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PersonManagement = () => {
  const { data: persons, isLoading, error } = usePersons();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<{id: string, first_name: string, last_name: string, email?: string, phone?: string} | null>(null);
  const navigate = useNavigate();
  
  const filteredPersons = persons?.filter(
    (person) => !searchTerm || 
      person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (person: {id: string, first_name: string, last_name: string, email?: string, phone?: string}) => {
    setEditingPerson(person);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPerson(null);
  };
  
  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>Fehler beim Laden der Personen</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Personenverwaltung</h1>
        </div>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Person
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personen verwalten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex-1 mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Nach Personen suchen..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <PersonList 
            persons={filteredPersons || []} 
            onEdit={handleEdit} 
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPerson ? "Person bearbeiten" : "Neue Person erstellen"}
            </DialogTitle>
            <DialogDescription>
              Bitte geben Sie die Details für die Person ein.
            </DialogDescription>
          </DialogHeader>
          <PersonForm 
            initialData={editingPerson}
            onSuccess={handleFormClose} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonManagement;
