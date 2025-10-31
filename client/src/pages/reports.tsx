import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Report } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Reports() {
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Ausstehend
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="default" className="gap-1">
            <FileText className="h-3 w-3" />
            Überprüft
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="gap-1 bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3" />
            Gelöst
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "broken":
        return <Badge variant="destructive">Defekt</Badge>;
      case "suspicious":
        return (
          <Badge variant="default" className="bg-warning text-warning-foreground">
            Verdächtig
          </Badge>
        );
      case "other":
        return <Badge variant="outline">Sonstiges</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Berichte</h1>
        <p className="text-muted-foreground">
          Gemeldete Links von Bürgern und Behördenmitarbeitern
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending-reports">
              {reports?.filter((r) => r.status === "pending").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Überprüft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports?.filter((r) => r.status === "reviewed").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gelöst</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {reports?.filter((r) => r.status === "resolved").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Berichte</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link-ID</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Gemeldet am</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                      <TableCell>
                        <code className="text-xs">{report.linkId.slice(0, 8)}...</code>
                      </TableCell>
                      <TableCell>{getTypeBadge(report.reportType)}</TableCell>
                      <TableCell>
                        <p className="max-w-md truncate text-sm">
                          {report.description || "Keine Beschreibung"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(report.createdAt!), "dd. MMM yyyy", { locale: de })}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-view-${report.id}`}
                        >
                          Ansehen
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <AlertTriangle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Keine Berichte</h3>
              <p className="text-sm text-muted-foreground">
                Es wurden noch keine Links gemeldet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
