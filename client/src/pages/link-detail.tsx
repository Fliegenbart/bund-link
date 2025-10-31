import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Copy, QrCode, BarChart, Globe, Trash2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RoutingRulesManager } from "@/components/RoutingRulesManager";
import type { Link } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function LinkDetail() {
  const [, params] = useRoute("/links/:id");
  const linkId = params?.id || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: link, isLoading } = useQuery<Link>({
    queryKey: ["/api/links", linkId],
    enabled: !!linkId,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/links/${linkId}`, {
        isActive: !link?.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links", linkId] });
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: link?.isActive ? "Link deaktiviert" : "Link aktiviert",
        description: link?.isActive
          ? "Der Link ist jetzt inaktiv und leitet nicht mehr weiter."
          : "Der Link ist jetzt aktiv und funktioniert.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/links/${linkId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link gelöscht",
        description: "Der Link wurde erfolgreich gelöscht.",
      });
      setLocation("/dashboard");
    },
  });

  const handleCopyLink = () => {
    if (link) {
      const shortUrl = `${window.location.origin}/${link.shortCode}`;
      navigator.clipboard.writeText(shortUrl);
      toast({
        title: "Link kopiert",
        description: "Der verkürzte Link wurde in die Zwischenablage kopiert.",
      });
    }
  };

  const handleDelete = () => {
    if (confirm("Möchten Sie diesen Link wirklich dauerhaft löschen?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <h2 className="text-2xl font-bold">Link nicht gefunden</h2>
        <Button onClick={() => setLocation("/dashboard")}>Zurück zum Dashboard</Button>
      </div>
    );
  }

  const shortUrl = `${window.location.origin}/${link.shortCode}`;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{link.title || link.shortCode}</h1>
          <p className="text-muted-foreground">Link-Details und Verwaltung</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={link.isActive ? "outline" : "default"}
            onClick={() => toggleActiveMutation.mutate()}
            disabled={toggleActiveMutation.isPending}
            data-testid="button-toggle-active"
          >
            {link.isActive ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Deaktivieren
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Aktivieren
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            data-testid="button-delete"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Link-Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Kurz-URL
                </label>
                <div className="flex gap-2">
                  <code className="flex-1 rounded-md border bg-muted/30 p-3 font-mono text-sm">
                    {shortUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    data-testid="button-copy"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Ziel-URL
                </label>
                <code className="block truncate rounded-md border bg-muted/30 p-3 font-mono text-sm">
                  {link.destinationUrl}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <Badge variant={link.isActive ? "default" : "secondary"}>
                    {link.isActive ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Klicks
                  </label>
                  <p className="text-2xl font-bold">{link.clickCount}</p>
                </div>
              </div>

              {link.description && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Beschreibung
                  </label>
                  <p className="text-sm">{link.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Erstellt
                  </label>
                  <p className="text-sm">
                    {format(new Date(link.createdAt!), "dd. MMM yyyy", { locale: de })}
                  </p>
                </div>
                {link.expiresAt && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Läuft ab
                    </label>
                    <p className="text-sm">
                      {format(new Date(link.expiresAt), "dd. MMM yyyy", { locale: de })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" data-testid="button-qr">
                <QrCode className="mr-2 h-4 w-4" />
                QR-Code generieren
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation(`/analytics`)}
                data-testid="button-analytics"
              >
                <BarChart className="mr-2 h-4 w-4" />
                Analytics anzeigen
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <RoutingRulesManager linkId={linkId} />
        </div>
      </div>
    </div>
  );
}
