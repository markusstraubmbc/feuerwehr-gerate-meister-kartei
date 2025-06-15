
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SELECT_ALL_VALUE } from "@/lib/constants";

export const useEquipmentFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [selectedPerson, setSelectedPerson] = useState<string | null>(searchParams.get('person'));
  const [selectedStatus, setSelectedStatus] = useState<string | null>(searchParams.get('status'));

  useEffect(() => {
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const person = searchParams.get('person');
    
    if (status) setSelectedStatus(status);
    if (category) setSelectedCategory(category);
    if (person) setSelectedPerson(person);
  }, [searchParams]);

  const handleFilterChange = (filters: {
    status?: string;
    category?: string;
    person?: string;
    search?: string;
  }) => {
    const newSearchParams = new URLSearchParams();
    
    if (filters.status && filters.status !== "status_all") {
      newSearchParams.set('status', filters.status);
      setSelectedStatus(filters.status);
    } else {
      setSelectedStatus(null);
    }
    
    if (filters.category && filters.category !== SELECT_ALL_VALUE) {
      newSearchParams.set('category', filters.category);
      setSelectedCategory(filters.category);
    } else {
      setSelectedCategory(null);
    }
    
    if (filters.person && filters.person !== SELECT_ALL_VALUE) {
      newSearchParams.set('person', filters.person);
      setSelectedPerson(filters.person);
    } else {
      setSelectedPerson(null);
    }
    
    if (filters.search !== undefined) {
      setSearchTerm(filters.search);
    }
    
    setSearchParams(newSearchParams);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus(null);
    setSelectedCategory(null);
    setSelectedPerson(null);
    setSelectedLocation(null);
    setSearchParams(new URLSearchParams());
  };

  return {
    searchTerm,
    selectedLocation,
    selectedCategory,
    selectedPerson,
    selectedStatus,
    setSelectedLocation: (locationId: string) => 
      setSelectedLocation(locationId === SELECT_ALL_VALUE ? null : locationId),
    handleFilterChange,
    resetFilters
  };
};
