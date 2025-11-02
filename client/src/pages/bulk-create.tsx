import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Download, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BulkLinkResult } from "@shared/schema";

export default function BulkCreate() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [results, setResults] = useState<BulkLinkResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const bulkCreateMutation = useMutation<BulkLinkResult[], Error, any[]>({
    mutationFn: async (links: any[]) => {
      const response = await apiRequest("POST", "/api/links/bulk", links);
      const data = await response.json();
      return data as BulkLinkResult[];
    },
    onSuccess: (data) => {
      setResults(data);
      const successCount = data.filter(r => r.success).length;
      const failCount = data.filter(r => !r.success).length;
      
      // Invalidate links cache so dashboard updates
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      
      toast({
        title: "Massenverarbeitung abgeschlossen",
        description: `${successCount} Links erfolgreich erstellt, ${failCount} fehlgeschlagen`,
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Massenverarbeitung fehlgeschlagen",
        variant: "destructive",
      });
    },
  });

  const downloadTemplate = () => {
    const template = `destinationUrl,customAlias,title,description,agency,expiresAt
https://www.bundesregierung.de/beispiel1,beispiel1,Beispiel Link 1,Beschreibung für Link 1,Bundesministerium für Beispiele,
https://www.bundesregierung.de/beispiel2,beispiel2,Beispiel Link 2,Beschreibung für Link 2,Bundesministerium für Beispiele,2025-12-31T23:59:59Z`;
    
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bundlink_template.csv";
    link.click();
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV muss mindestens eine Kopfzeile und eine Datenzeile enthalten");
    }

    const headers = lines[0].split(",").map(h => h.trim());
    const requiredHeaders = ["destinationUrl"];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Fehlende erforderliche Spalten: ${missingHeaders.join(", ")}`);
    }

    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (value && value !== "") {
          row[header] = value;
        }
      });

      if (row.destinationUrl) {
        data.push(row);
      }
    }

    return data;
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setCsvData(parsed);
      setResults([]);
      toast({
        title: "CSV hochgeladen",
        description: `${parsed.length} Links zum Erstellen gefunden`,
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Lesen der CSV",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      handleFileUpload(file);
    } else {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte laden Sie eine CSV-Datei hoch",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleCreateLinks = () => {
    if (csvData.length === 0) {
      toast({
        title: "Keine Daten",
        description: "Bitte laden Sie zuerst eine CSV-Datei hoch",
        variant: "destructive",
      });
      return;
    }
    bulkCreateMutation.mutate(csvData);
  };

  const exportResults = () => {
    if (results.length === 0) return;

    const successRows = results.filter(r => r.success);
    const csvContent = `row,shortCode,destinationUrl,error\n${results.map(r => 
      `${r.row},${r.shortCode || ""},${r.link?.destinationUrl || ""},${r.error || ""}`
    ).join("\n")}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bundlink_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Massen-Link-Erstellung</h1>
        <p className="text-muted-foreground mt-2">
          Erstellen Sie mehrere verkürzte Links gleichzeitig mit CSV-Upload
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Vorlage herunterladen</CardTitle>
          <CardDescription>
            Laden Sie die CSV-Vorlage herunter und füllen Sie sie mit Ihren Link-Daten aus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" data-testid="button-download-template">
            <Download className="mr-2 h-4 w-4" />
            CSV-Vorlage herunterladen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. CSV-Datei hochladen</CardTitle>
          <CardDescription>
            Laden Sie Ihre ausgefüllte CSV-Datei hoch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-md p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Ziehen Sie eine CSV-Datei hierher oder klicken Sie zum Hochladen
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
              data-testid="input-csv-file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              data-testid="button-select-file"
            >
              <FileText className="mr-2 h-4 w-4" />
              Datei auswählen
            </Button>
          </div>

          {csvData.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {csvData.length} Links zum Erstellen bereit
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Links erstellen</CardTitle>
          <CardDescription>
            Starten Sie die Massenverarbeitung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleCreateLinks}
            disabled={csvData.length === 0 || bulkCreateMutation.isPending}
            className="w-full"
            data-testid="button-create-bulk"
          >
            {bulkCreateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Erstelle {csvData.length} Links...
              </>
            ) : (
              `${csvData.length} Links erstellen`
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ergebnisse</CardTitle>
                <CardDescription>
                  {results.filter(r => r.success).length} erfolgreich, {results.filter(r => !r.success).length} fehlgeschlagen
                </CardDescription>
              </div>
              <Button onClick={exportResults} variant="outline" data-testid="button-export-results">
                <Download className="mr-2 h-4 w-4" />
                Exportieren
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.row}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    result.success ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" : "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"
                  }`}
                  data-testid={`result-row-${result.row}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">Zeile {result.row}</p>
                      {result.success && result.shortCode && (
                        <p className="text-xs text-muted-foreground">
                          Code: {result.shortCode}
                        </p>
                      )}
                      {!result.success && result.error && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
