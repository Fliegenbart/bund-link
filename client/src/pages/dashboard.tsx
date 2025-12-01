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
  Link2,
  TrendingUp,
  MousePointer,
  Activity,
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
        <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5 py-0.5 font-medium">
          <XCircle className="h-3 w-3" />
          Inaktiv
        </Badge>
      );
    }
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return (
        <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5 py-0.5 font-medium">
          <Clock className="h-3 w-3" />
          Abgelaufen
        </Badge>
      );
    }
    return (
      <Badge className="gap-1.5 rounded-full px-2.5 py-0.5 font-medium bg-green-500/10 text-green-600 dark:text-green-400 border-0">
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
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Übersicht Ihrer verkürzten Links</p>
        </div>
        <Link href="/create">
          <Button data-testid="button-create-link" className="gap-2 rounded-xl h-11 px-5 shadow-sm">
            <Plus className="h-4 w-4" />
            Neuer Link
          </Button>
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt Links</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-3xl font-semibold tracking-tight" data-testid="stat-total-links">
                {stats.totalLinks}
              </div>
            ) : (
              <Skeleton className="h-9 w-16 rounded-lg" />
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktive Links</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10">
              <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-3xl font-semibold tracking-tight text-green-600 dark:text-green-400" data-testid="stat-active-links">
                {stats.activeLinks}
              </div>
            ) : (
              <Skeleton className="h-9 w-16 rounded-lg" />
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt Klicks</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
              <MousePointer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-3xl font-semibold tracking-tight" data-testid="stat-total-clicks">
                {stats.totalClicks}
              </div>
            ) : (
              <Skeleton className="h-9 w-16 rounded-lg" />
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Klickrate</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="text-3xl font-semibold tracking-tight" data-testid="stat-click-rate">
                {stats.clickRate.toFixed(1)}%
              </div>
            ) : (
              <Skeleton className="h-9 w-16 rounded-lg" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold">Alle Links</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Links durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20"
                data-testid="input-search-links"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredLinks && filteredLinks.length > 0 ? (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-6">Kurz-URL</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ziel-URL</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Erstellt</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Klicks</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
                    <TableHead className="w-[50px] pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow 
                      key={link.id} 
                      data-testid={`row-link-${link.id}`}
                      className="border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setLocation(`/links/${link.id}`)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm font-medium bg-muted/50 px-2 py-1 rounded-lg">
                            /{link.customAlias || link.shortCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(link.customAlias || link.shortCode);
                            }}
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
                            className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(link.createdAt!), "dd. MMM yyyy", { locale: de })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold tabular-nums" data-testid={`text-clicks-${link.id}`}>
                          {link.clickCount}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>{getStatusBadge(link)}</TableCell>
                      <TableCell className="pr-6" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              data-testid={`button-menu-${link.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-0 bg-popover/95 backdrop-blur-xl">
                            <DropdownMenuItem
                              className="gap-2 rounded-lg"
                              onClick={() => setLocation(`/links/${link.id}`)}
                              data-testid={`button-view-${link.id}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 rounded-lg"
                              data-testid={`button-qr-${link.id}`}
                            >
                              <QrCode className="h-4 w-4" />
                              QR-Code anzeigen
                            </DropdownMenuItem>
                            <Link href={`/analytics?link=${link.id}`}>
                              <DropdownMenuItem className="gap-2 rounded-lg">
                                <BarChart3 className="h-4 w-4" />
                                Analytics
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="gap-2 rounded-lg text-destructive focus:text-destructive"
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
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-muted to-muted/50">
                <Link2 className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Keine Links gefunden</h3>
              <p className="mb-6 text-sm text-muted-foreground text-center max-w-sm">
                {searchQuery
                  ? "Keine Links entsprechen Ihrer Suche."
                  : "Erstellen Sie Ihren ersten verkürzten Link."}
              </p>
              <Link href="/create">
                <Button className="rounded-xl h-11 px-6 shadow-sm">Ersten Link erstellen</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
