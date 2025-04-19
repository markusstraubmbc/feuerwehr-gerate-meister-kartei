
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { usePersons } from "@/hooks/usePersons";
import { SELECT_ALL_VALUE } from "@/lib/constants";

interface EquipmentFiltersProps {
  searchTerm: string;
  selectedCategory: string | null;
  selectedPerson: string | null;
  selectedStatus: string | null;
  onFilterChange: (filters: {
    status?: string;
    category?: string;
    person?: string;
    search?: string;
  }) => void;
  onReset: () => void;
}

export const EquipmentFilters = ({
  searchTerm,
  selectedCategory,
  selectedPerson,
  selectedStatus,
  onFilterChange,
  onReset
}: EquipmentFiltersProps) => {
  const { data: categories = [] } = useCategories();
  const { data: persons = [] } = usePersons();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
      <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
        <Input
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="w-full sm:w-60"
        />
        
        <Select 
          value={selectedCategory || SELECT_ALL_VALUE} 
          onValueChange={(value) => onFilterChange({ category: value })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_ALL_VALUE}>Alle Kategorien</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={selectedPerson || SELECT_ALL_VALUE} 
          onValueChange={(value) => onFilterChange({ person: value })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_ALL_VALUE}>Alle Personen</SelectItem>
            {persons.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.first_name} {person.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={selectedStatus || ''} 
          onValueChange={(value) => onFilterChange({ status: value })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status_all">Alle Status</SelectItem>
            <SelectItem value="einsatzbereit">Einsatzbereit</SelectItem>
            <SelectItem value="prüfung fällig">Prüfung fällig</SelectItem>
            <SelectItem value="wartung">Wartung</SelectItem>
            <SelectItem value="defekt">Defekt</SelectItem>
            <SelectItem value="aussortiert">Aussortiert</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onReset}
        className="min-w-[100px]"
      >
        <Filter className="h-4 w-4 mr-2" />
        Zurücksetzen
      </Button>
    </div>
  );
};
