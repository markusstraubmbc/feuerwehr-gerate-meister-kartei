import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { MaintenanceTable } from "@/components/maintenance/MaintenanceTable";
import { 
  FileText, 
  Calendar,
  Package,
  Warehouse,
  Plus,
  Search
} from "lucide-react";

const Maintenance = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Wartung & Verwaltung</h1>
      </div>
      
      <Tabs defaultValue="wartungen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wartungen">Wartungen</TabsTrigger>
          <TabsTrigger value="artikel">Artikel</TabsTrigger>
          <TabsTrigger value="lager">Lager</TabsTrigger>
          <TabsTrigger value="berichte">Berichte</TabsTrigger>
        </TabsList>

        <TabsContent value="wartungen">
          <Card>
            <CardHeader>
              <CardTitle>Wartungsübersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="flex gap-2">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Wartung
                  </Button>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Prüfprotokoll
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <MaintenanceTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artikel">
          <Card>
            <CardHeader>
              <CardTitle>Artikelverwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Artikel
                </Button>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artikelnummer</TableHead>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Lagerort</TableHead>
                    <TableHead>Bestand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Keine Artikel vorhanden
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lager">
          <Card>
            <CardHeader>
              <CardTitle>Lagerverwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="flex gap-2">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Lager
                  </Button>
                  <Button variant="outline">
                    <Package className="h-4 w-4 mr-2" />
                    Umlagern
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lager-ID</TableHead>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Standort</TableHead>
                    <TableHead>Artikel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Keine Lager vorhanden
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="berichte">
          <Card>
            <CardHeader>
              <CardTitle>Berichtsverwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-32 flex flex-col items-center justify-center">
                  <FileText className="h-8 w-8 mb-2" />
                  Wartungsberichte
                </Button>
                <Button variant="outline" className="h-32 flex flex-col items-center justify-center">
                  <Package className="h-8 w-8 mb-2" />
                  Artikelberichte
                </Button>
                <Button variant="outline" className="h-32 flex flex-col items-center justify-center">
                  <Warehouse className="h-8 w-8 mb-2" />
                  Lagerberichte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Maintenance;
