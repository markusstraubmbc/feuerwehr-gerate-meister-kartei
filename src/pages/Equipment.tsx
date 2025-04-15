
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Package, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle,
  ArrowUpDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Equipment {
  id: string;
  name: string;
  category: string;
  status: "einsatzbereit" | "wartung" | "defekt" | "prüfung fällig";
  lastChecked: string;
  nextCheck: string;
  location: string;
  responsiblePerson: string;
}

const Equipment = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>(equipmentData);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    const filtered = equipmentData.filter(
      (item) =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.category.toLowerCase().includes(value.toLowerCase()) ||
        item.id.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredEquipment(filtered);
  };

  const getStatusIndicator = (status: Equipment["status"]) => {
    switch (status) {
      case "einsatzbereit":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "wartung":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "defekt":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "prüfung fällig":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: Equipment["status"]) => {
    const styles = {
      einsatzbereit: "bg-green-100 text-green-800 border-green-200",
      wartung: "bg-blue-100 text-blue-800 border-blue-200",
      defekt: "bg-red-100 text-red-800 border-red-200",
      "prüfung fällig": "bg-amber-100 text-amber-800 border-amber-200",
    };

    return (
      <div className="flex items-center">
        {getStatusIndicator(status)}
        <span className={`ml-2 px-2 py-1 text-xs rounded-md border ${styles[status]}`}>
          {status}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ausrüstung</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Ausrüstungsübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Suche nach ID, Name oder Kategorie..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Button variant="outline" className="flex gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="ready">Einsatzbereit</TabsTrigger>
              <TabsTrigger value="maintenance">In Wartung</TabsTrigger>
              <TabsTrigger value="check">Prüfung fällig</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Letzte Prüfung</TableHead>
                      <TableHead>Nächste Prüfung</TableHead>
                      <TableHead>Verantwortlich</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.length > 0 ? (
                      filteredEquipment.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.lastChecked}
                          </TableCell>
                          <TableCell className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.nextCheck}
                          </TableCell>
                          <TableCell className="flex items-center">
                            <User className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.responsiblePerson}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          Keine Ergebnisse gefunden.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="ready">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Letzte Prüfung</TableHead>
                      <TableHead>Nächste Prüfung</TableHead>
                      <TableHead>Verantwortlich</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment
                      .filter((item) => item.status === "einsatzbereit")
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.lastChecked}
                          </TableCell>
                          <TableCell className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.nextCheck}
                          </TableCell>
                          <TableCell className="flex items-center">
                            <User className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.responsiblePerson}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Similar structure for other tabs - omitting for brevity */}
            <TabsContent value="maintenance" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Letzte Prüfung</TableHead>
                      <TableHead>Nächste Prüfung</TableHead>
                      <TableHead>Verantwortlich</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment
                      .filter((item) => item.status === "wartung")
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.lastChecked}
                          </TableCell>
                          <TableCell className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.nextCheck}
                          </TableCell>
                          <TableCell className="flex items-center">
                            <User className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.responsiblePerson}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="check" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Letzte Prüfung</TableHead>
                      <TableHead>Nächste Prüfung</TableHead>
                      <TableHead>Verantwortlich</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment
                      .filter((item) => item.status === "prüfung fällig")
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.lastChecked}
                          </TableCell>
                          <TableCell className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.nextCheck}
                          </TableCell>
                          <TableCell className="flex items-center">
                            <User className="mr-1 h-4 w-4 text-muted-foreground" />
                            {item.responsiblePerson}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Sample data
const equipmentData: Equipment[] = [
  {
    id: "ASG-001",
    name: "Atemschutzgerät Dräger PSS",
    category: "Atemschutzgeräte",
    status: "einsatzbereit",
    lastChecked: "10.03.2025",
    nextCheck: "10.09.2025",
    location: "Fahrzeug HLF 20",
    responsiblePerson: "M. Schmidt",
  },
  {
    id: "ASG-002",
    name: "Atemschutzgerät MSA G1",
    category: "Atemschutzgeräte",
    status: "einsatzbereit",
    lastChecked: "05.03.2025",
    nextCheck: "05.09.2025",
    location: "Fahrzeug HLF 20",
    responsiblePerson: "M. Schmidt",
  },
  {
    id: "ASG-003",
    name: "Atemschutzgerät Dräger PA94",
    category: "Atemschutzgeräte",
    status: "prüfung fällig",
    lastChecked: "12.09.2024",
    nextCheck: "12.03.2025",
    location: "Fahrzeug HLF 20",
    responsiblePerson: "M. Schmidt",
  },
  {
    id: "SCH-001",
    name: "Schlauch B 20m",
    category: "Schläuche & Armaturen",
    status: "einsatzbereit",
    lastChecked: "15.02.2025",
    nextCheck: "15.02.2026",
    location: "Fahrzeug LF 10",
    responsiblePerson: "S. Weber",
  },
  {
    id: "SCH-002",
    name: "Schlauch C 15m",
    category: "Schläuche & Armaturen",
    status: "wartung",
    lastChecked: "10.01.2025",
    nextCheck: "10.01.2026",
    location: "Werkstatt",
    responsiblePerson: "S. Weber",
  },
  {
    id: "SCH-003",
    name: "Verteiler B-CBC",
    category: "Schläuche & Armaturen",
    status: "einsatzbereit",
    lastChecked: "05.02.2025",
    nextCheck: "05.02.2026",
    location: "Fahrzeug LF 10",
    responsiblePerson: "S. Weber",
  },
  {
    id: "HYD-001",
    name: "Hydraulikschere Weber",
    category: "Hydraulische Rettungsgeräte",
    status: "einsatzbereit",
    lastChecked: "20.03.2025",
    nextCheck: "20.09.2025",
    location: "Fahrzeug RW",
    responsiblePerson: "R. Müller",
  },
  {
    id: "HYD-002",
    name: "Hydraulikspreizer Holmatro",
    category: "Hydraulische Rettungsgeräte",
    status: "defekt",
    lastChecked: "15.03.2025",
    nextCheck: "15.09.2025",
    location: "Werkstatt",
    responsiblePerson: "R. Müller",
  },
  {
    id: "FNK-001",
    name: "Funkgerät Motorola 4200",
    category: "Funkgeräte",
    status: "einsatzbereit",
    lastChecked: "25.03.2025",
    nextCheck: "25.03.2026",
    location: "Gebäude",
    responsiblePerson: "K. Fischer",
  },
  {
    id: "FNK-002",
    name: "Funkgerät Motorola 4200",
    category: "Funkgeräte",
    status: "prüfung fällig",
    lastChecked: "10.03.2024",
    nextCheck: "10.03.2025",
    location: "Gebäude",
    responsiblePerson: "K. Fischer",
  },
];

export default Equipment;
