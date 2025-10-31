import { Shield, Lock, Globe, BarChart3, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const features = [
    {
      icon: Shield,
      title: "Sicherheit & Vertrauen",
      description: "Offizielle Verifizierung, SSL-Verschlüsselung und BSI-zertifiziertes Hosting für maximale Sicherheit.",
    },
    {
      icon: Globe,
      title: "Intelligentes Routing",
      description: "Geografische und sprachbasierte Weiterleitung für optimale Benutzererfahrung.",
    },
    {
      icon: Lock,
      title: "DSGVO-konform",
      description: "Datenschutz durch Design mit automatischer Löschung und Einwilligungsverwaltung.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Datenschutzkonforme Analysen ohne Tracking-Cookies mit anonymisierten Daten.",
    },
    {
      icon: Zap,
      title: "Barrierefreiheit",
      description: "BITV 2.0-konform mit Screenreader-Optimierung und Tastaturnavigation.",
    },
    {
      icon: CheckCircle,
      title: "Verlässlich",
      description: "Für Bundesbehörden entwickelt mit höchsten Sicherheits- und Qualitätsstandards.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight">BundLink</h1>
              <p className="text-xs text-muted-foreground">Bundesbehörden</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={() => {
                window.location.href = "/api/login";
              }}
              data-testid="button-login"
            >
              Anmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-2 text-sm">
              <Shield className="h-4 w-4 text-success" />
              <span className="font-medium">Offizieller Dienst für Bundesbehörden</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Sicherer URL-Shortener für{" "}
              <span className="text-primary">deutsche Behörden</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              DSGVO-konformer URL-Verkürzungsdienst mit intelligenter Weiterleitung,
              Barrierefreiheit und höchsten Sicherheitsstandards für Bundes-, Landes- und
              Kommunalbehörden.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = "/api/login";
                }}
                data-testid="button-get-started"
              >
                Jetzt starten
              </Button>
              <Button size="lg" variant="outline" data-testid="button-learn-more">
                Mehr erfahren
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="container px-4">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-12 text-center text-3xl font-bold">Hauptmerkmale</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                  <Card key={feature.title} className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="container px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-4 text-3xl font-bold">Bereit anzufangen?</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Melden Sie sich an, um BundLink für Ihre Behörde zu nutzen.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = "/api/login";
                }}
                data-testid="button-signup"
              >
                Anmelden
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">BundLink</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              © 2025 BundLink. DSGVO-konform. BSI-zertifiziert.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
