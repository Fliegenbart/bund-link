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
        <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border-0">
          <XCircle className="h-3 w-3" />
          Inaktiv
        </Badge>
      );
    }
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return (
        <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border-0">
          <Clock className="h-3 w-3" />
          Abgelaufen
        </Badge>
      );
    }
    return (
      <Badge className="gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
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
    <div className="flex flex-1 flex-col gap-7 p-7 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Dashboard</h1>
          <p className="text-[15px] text-muted-foreground mt-0.5">Übersicht Ihrer verkürzten Links</p>
        </div>
        <Link href="/create">
          <Button data-testid="button-create-link" className="gap-2 rounded-full h-10 px-5 text-[13px] font-medium shadow-sm shadow-primary/15">
            <Plus className="h-4 w-4" />
            Neuer Link
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm rounded-[18px] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Gesamt Links</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/8">
              <Link2 className="h-[18px] w-[18px] text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {stats ? (
              <div className="text-[32px] font-semibold tracking-tight" data-testid="stat-total-links">
                {stats.totalLinks}
              </div>
            ) : (
              <Skeleton className="h-10 w-16 rounded-lg" />
            )}
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm rounded-[18px] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Aktive Links</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500/8">
              <Activity className="h-[18px] w-[18px] text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {stats ? (
              <div className="text-[32px] font-semibold tracking-tight text-emerald-600 dark:text-emerald-400" data-testid="stat-active-links">
                {stats.activeLinks}
              </div>
            ) : (
              <Skeleton className="h-10 w-16 rounded-lg" />
            )}
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm rounded-[18px] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Gesamt Klicks</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-500/8">
              <MousePointer className="h-[18px] w-[18px] text-amber-600 dark:text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {stats ? (
              <div className="text-[32px] font-semibold tracking-tight" data-testid="stat-total-clicks">
                {stats.totalClicks}
              </div>
            ) : (
              <Skeleton className="h-10 w-16 rounded-lg" />
            )}
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm rounded-[18px] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 pt-5 px-5">
            <CardTitle className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Klickrate</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-violet-500/8">
              <TrendingUp className="h-[18px] w-[18px] text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {stats ? (
              <div className="text-[32px] font-semibold tracking-tight" data-testid="stat-click-rate">
                {stats.clickRate.toFixed(1)}%
              </div>
            ) : (
              <Skeleton className="h-10 w-16 rounded-lg" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Links Table */}
      <Card className="border-0 shadow-sm rounded-[18px]">
        <CardHeader className="pb-4 px-5 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-[18px] font-semibold tracking-tight">Alle Links</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Links durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-full border-0 bg-muted/50 text-[13px] focus:bg-background focus:ring-2 focus:ring-primary/15"
                data-testid="input-search-links"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 px-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredLinks && filteredLinks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.06em] pl-5">Kurz-URL</TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.06em]">Ziel-URL</TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.06em]">Erstellt</TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.06em]">Klicks</TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.06em]">Status</TableHead>
                    <TableHead className="w-[50px] pr-5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow 
                      key={link.id} 
                      data-testid={`row-link-${link.id}`}
                      className="border-0 hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setLocation(`/links/${link.id}`)}
                    >
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-[13px] font-medium bg-muted/60 px-2.5 py-1 rounded-lg">
                            /{link.customAlias || link.shortCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <TableCell className="py-3.5">
                        <div className="flex max-w-sm items-center gap-2">
                          <span className="truncate text-[13px] text-muted-foreground">
                            {link.destinationUrl}
                          </span>
                          <a
                            href={link.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-[13px] text-muted-foreground">
                          {format(new Date(link.createdAt!), "dd. MMM yyyy", { locale: de })}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-[14px] font-semibold tabular-nums" data-testid={`text-clicks-${link.id}`}>
                          {link.clickCount}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5" onClick={(e) => e.stopPropagation()}>{getStatusBadge(link)}</TableCell>
                      <TableCell className="pr-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100"
                              data-testid={`button-menu-${link.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-[14px] shadow-lg border-0 bg-popover/95 backdrop-blur-xl p-1.5 min-w-[180px]">
                            <DropdownMenuItem
                              className="gap-2.5 rounded-[10px] text-[13px] py-2"
                              onClick={() => setLocation(`/links/${link.id}`)}
                              data-testid={`button-view-${link.id}`}
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2.5 rounded-[10px] text-[13px] py-2"
                              data-testid={`button-qr-${link.id}`}
                            >
                              <QrCode className="h-4 w-4 text-muted-foreground" />
                              QR-Code anzeigen
                            </DropdownMenuItem>
                            <Link href={`/analytics?link=${link.id}`}>
                              <DropdownMenuItem className="gap-2.5 rounded-[10px] text-[13px] py-2">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                Analytics
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="gap-2.5 rounded-[10px] text-[13px] py-2 text-destructive focus:text-destructive"
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
            <div className="flex flex-col items-center justify-center py-20 px-5">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[20px] bg-muted/60">
                <Link2 className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="mb-2 text-[17px] font-semibold">Keine Links gefunden</h3>
              <p className="mb-8 text-[14px] text-muted-foreground text-center max-w-xs leading-relaxed">
                {searchQuery
                  ? "Keine Links entsprechen Ihrer Suche."
                  : "Erstellen Sie Ihren ersten verkürzten Link."}
              </p>
              <Link href="/create">
                <Button className="rounded-full h-10 px-6 text-[13px] font-medium shadow-sm">Ersten Link erstellen</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
