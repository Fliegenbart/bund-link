import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Shield, ExternalLink, AlertTriangle, Clock, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/VerificationBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Link } from "@shared/schema";

// Extended type for preview response with external link detection
interface PreviewLink extends Link {
  isExternalLink?: boolean;
}
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Preview() {
  const [, params] = useRoute("/:shortCode");
  const shortCode = params?.shortCode || "";
  const [countdown, setCountdown] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: link, isLoading } = useQuery<PreviewLink>({
    queryKey: ["/api/links/preview", shortCode],
    enabled: !!shortCode,
  });

  // Set initial countdown based on external link status (10s for external, 5s for trusted)
  useEffect(() => {
    if (link && countdown === null) {
      setCountdown(link.isExternalLink ? 10 : 5);
    }
  }, [link, countdown]);

  const trackMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/links/${shortCode}/track`, {});
    },
  });

  useEffect(() => {
    if (countdown === 0 && link?.destinationUrl) {
      trackMutation.mutate();
      window.location.href = link.destinationUrl;
    }

    // Only start countdown when it's been initialized
    if (countdown === null) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, link]);

  const handleContinue = () => {
    if (link?.destinationUrl) {
      trackMutation.mutate();
      window.location.href = link.destinationUrl;
    }
  };

  const handleReport = () => {
    toast({
      title: "Danke für Ihre Meldung",
      description: "Wir werden den Link überprüfen.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-background">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">BundLink</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-background">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">BundLink</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold">Link nicht gefunden</h1>
            <p className="text-muted-foreground">
              Der angeforderte Link existiert nicht oder wurde entfernt.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight">BundLink</h1>
              <p className="text-xs text-muted-foreground">Vertrauenswürdiger Bundeslink</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <VerificationBadge agency={link.agency ?? undefined} size="lg" className="mb-4" />
            <h1 className="mb-2 text-3xl font-bold">Sie werden weitergeleitet zu:</h1>
            <p className="text-muted-foreground">
              Überprüfen Sie die Ziel-URL, bevor Sie fortfahren
            </p>
          </div>

          {isExpired && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Dieser Link ist am{" "}
                {format(new Date(link.expiresAt!), "dd. MMMM yyyy", { locale: de })} abgelaufen.
              </AlertDescription>
            </Alert>
          )}

          {link.isExternalLink && !isExpired && (
            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <Globe className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Externe Webseite:</strong> Dieser Link führt zu einer Seite außerhalb
                vertrauenswürdiger deutscher/europäischer Domains. Bitte prüfen Sie die Ziel-URL
                sorgfältig, bevor Sie fortfahren.
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Ziel-URL
                </label>
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-4">
                  <ExternalLink className="h-5 w-5 flex-shrink-0 text-primary" />
                  <code
                    className="flex-1 break-all font-mono text-sm"
                    data-testid="text-destination-url"
                  >
                    {link.destinationUrl}
                  </code>
                </div>
              </div>

              {link.title && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Titel
                  </label>
                  <p className="text-base font-medium">{link.title}</p>
                </div>
              )}

              {link.description && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Beschreibung
                  </label>
                  <p className="text-sm leading-relaxed">{link.description}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Erstellt
                  </label>
                  <p className="text-sm">
                    {format(new Date(link.createdAt!), "dd. MMMM yyyy", { locale: de })}
                  </p>
                </div>
                {link.agency && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Behörde
                    </label>
                    <p className="text-sm font-medium">{link.agency}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {!isExpired && countdown !== null && (
            <div className={`flex items-center justify-center gap-3 rounded-md border p-4 ${
              link.isExternalLink
                ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10"
                : "bg-muted/30"
            }`}>
              <Clock className={`h-5 w-5 ${
                link.isExternalLink ? "text-amber-600" : "text-muted-foreground"
              }`} />
              <span className="text-sm">
                Automatische Weiterleitung in <span className="font-bold">{countdown}</span>{" "}
                Sekunden
                {link.isExternalLink && " (verlängert für externe Seite)"}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
              data-testid="button-cancel"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!!isExpired}
              className="flex-1 gap-2"
              data-testid="button-continue"
            >
              Fortfahren
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <button
              onClick={handleReport}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              data-testid="button-report"
            >
              Verdächtigen Link melden
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t bg-muted/30 py-6">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Sichere Verbindung · DSGVO-konform · BSI-zertifiziert
          </p>
        </div>
      </footer>
    </div>
  );
}
