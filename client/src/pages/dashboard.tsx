import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  MoreVertical,
  Copy,
  QrCode,
  BarChart3,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Plus,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Link as LinkType } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: links, isLoading } = useQuery<LinkType[]>({
    queryKey: ["/api/links"],
  });

  const { data: stats } = useQuery<{
    totalLinks: number;
    activeLinks: number;
    totalClicks: number;
    clickRate: number;
  }>({
    queryKey: ["/api/links/stats"],
  });

  const copyToClipboard = async (shortCode: string) => {
    const url = `${window.location.origin}/${shortCode}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: "Kopiert!",
      description: "Link wurde in die Zwischenablage kopiert.",
    });
  };

  const getStatusBadge = (link: LinkType) => {
    if (!link.isActive) {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Inaktiv
        </Badge>
      );
    }
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Abgelaufen
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-success text-success-foreground">
        <CheckCircle className="h-3 w-3" />
        Aktiv
      </Badge>
    );
  };

  const filteredLinks = links?.filter(
    (link) =>
      link.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.destinationUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.customAlias?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Übersicht Ihrer verkürzten Links</p>
        </div>
        <Link href="/create">
          <Button data-testid="button-create-link" className="gap-2">
            <Plus className="h-4 w-4" />
            Neuer Link
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Links</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-2xl font-bold" data-testid="stat-total-links">
                {stats.totalLinks}
              </div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Links</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-2xl font-bold text-success" data-testid="stat-active-links">
                {stats.activeLinks}
              </div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Klicks</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-2xl font-bold" data-testid="stat-total-clicks">
                {stats.totalClicks}
              </div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Klickrate</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-2xl font-bold" data-testid="stat-click-rate">
                {stats.clickRate.toFixed(1)}%
              </div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Alle Links</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Links durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-links"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLinks && filteredLinks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kurz-URL</TableHead>
                    <TableHead>Ziel-URL</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Klicks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link.id} data-testid={`row-link-${link.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm font-medium">
                            /{link.customAlias || link.shortCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(link.customAlias || link.shortCode)}
                            data-testid={`button-copy-${link.id}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-md items-center gap-2">
                          <span className="truncate text-sm text-muted-foreground">
                            {link.destinationUrl}
                          </span>
                          <a
                            href={link.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(link.createdAt!), "dd. MMM yyyy", { locale: de })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium" data-testid={`text-clicks-${link.id}`}>
                          {link.clickCount}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(link)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-menu-${link.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setLocation(`/links/${link.id}`)}
                              data-testid={`button-view-${link.id}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              data-testid={`button-qr-${link.id}`}
                            >
                              <QrCode className="h-4 w-4" />
                              QR-Code anzeigen
                            </DropdownMenuItem>
                            <Link href={`/analytics?link=${link.id}`}>
                              <DropdownMenuItem className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Analytics
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              data-testid={`button-delete-${link.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Link className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Keine Links gefunden</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery
                  ? "Keine Links entsprechen Ihrer Suche."
                  : "Erstellen Sie Ihren ersten verkürzten Link."}
              </p>
              <Link href="/create">
                <Button>Ersten Link erstellen</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
