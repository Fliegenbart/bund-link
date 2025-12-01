import { Shield, Lock, Globe, BarChart3, Zap, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const features = [
    {
      icon: Shield,
      title: "Sicherheit & Vertrauen",
      description: "Offizielle Verifizierung, SSL-Verschlüsselung und BSI-zertifiziertes Hosting für maximale Sicherheit.",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Globe,
      title: "Intelligentes Routing",
      description: "Geografische und sprachbasierte Weiterleitung für optimale Benutzererfahrung.",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
    },
    {
      icon: Lock,
      title: "DSGVO-konform",
      description: "Datenschutz durch Design mit automatischer Löschung und Einwilligungsverwaltung.",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Datenschutzkonforme Analysen ohne Tracking-Cookies mit anonymisierten Daten.",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: Zap,
      title: "Barrierefreiheit",
      description: "BITV 2.0-konform mit Screenreader-Optimierung und Tastaturnavigation.",
      color: "text-yellow-600 dark:text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      icon: CheckCircle,
      title: "Verlässlich",
      description: "Für Bundesbehörden entwickelt mit höchsten Sicherheits- und Qualitätsstandards.",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 h-14 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="container flex h-full items-center justify-between px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold tracking-tight">BundLink</h1>
              <p className="text-xs text-muted-foreground">Bundesbehörden</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              onClick={() => {
                window.location.href = "/api/login";
              }}
              className="rounded-xl h-10 px-5 shadow-sm"
              data-testid="button-login"
            >
              Anmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 md:py-32 lg:py-40">
          <div className="container px-6 max-w-5xl mx-auto text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/10 px-4 py-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground/80">Offizieller Dienst für Bundesbehörden</span>
            </div>
            <h1 className="mb-6 text-5xl font-semibold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
              Sicherer URL-Shortener für{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">deutsche Behörden</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-muted-foreground md:text-xl max-w-3xl mx-auto">
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
                className="rounded-xl h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                data-testid="button-get-started"
              >
                Jetzt starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-xl h-12 px-8 text-base border-border/50 hover:bg-muted/50"
                data-testid="button-learn-more"
              >
                Mehr erfahren
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Hauptmerkmale</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Entwickelt für maximale Sicherheit, Datenschutz und Benutzerfreundlichkeit
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card 
                  key={feature.title} 
                  className="p-6 border-0 shadow-sm rounded-2xl bg-background hover:shadow-md transition-all duration-300"
                >
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container px-6 max-w-4xl mx-auto text-center">
            <div className="rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-12 md:p-16">
              <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">Bereit anzufangen?</h2>
              <p className="mb-8 text-lg text-muted-foreground max-w-xl mx-auto">
                Melden Sie sich an, um BundLink für Ihre Behörde zu nutzen.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = "/api/login";
                }}
                className="rounded-xl h-12 px-8 text-base shadow-lg shadow-primary/25"
                data-testid="button-signup"
              >
                Anmelden
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 bg-muted/20">
        <div className="container px-6 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md">
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
