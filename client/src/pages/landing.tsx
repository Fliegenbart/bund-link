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
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      icon: Globe,
      title: "Intelligentes Routing",
      description: "Geografische und sprachbasierte Weiterleitung für optimale Benutzererfahrung.",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/8",
    },
    {
      icon: Lock,
      title: "DSGVO-konform",
      description: "Datenschutz durch Design mit automatischer Löschung und Einwilligungsverwaltung.",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/8",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Datenschutzkonforme Analysen ohne Tracking-Cookies mit anonymisierten Daten.",
      color: "text-amber-600 dark:text-amber-500",
      bg: "bg-amber-500/8",
    },
    {
      icon: Zap,
      title: "Barrierefreiheit",
      description: "BITV 2.0-konform mit Screenreader-Optimierung und Tastaturnavigation.",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/8",
    },
    {
      icon: CheckCircle,
      title: "Verlässlich",
      description: "Für Bundesbehörden entwickelt mit höchsten Sicherheits- und Qualitätsstandards.",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/8",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header - Apple-style with frosted glass */}
      <header className="sticky top-0 z-50 h-16 glass border-b border-border/30">
        <div className="container flex h-full items-center justify-between px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] vestas-gradient shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-semibold tracking-tight text-foreground">BundLink</span>
              <span className="text-[11px] text-muted-foreground tracking-wide uppercase">Bundesbehörden</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              onClick={() => {
                window.location.href = "/api/login";
              }}
              className="rounded-full h-9 px-5 text-[13px] font-medium shadow-sm shadow-primary/20"
              data-testid="button-login"
            >
              Anmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Clean Apple-Vestas style */}
        <section className="py-28 md:py-36 lg:py-44">
          <div className="container px-6 max-w-5xl mx-auto text-center">
            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full bg-primary/6 border border-primary/12 px-5 py-2.5">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-medium text-foreground/90 tracking-tight">Offizieller Dienst für Bundesbehörden</span>
            </div>
            <h1 className="mb-7 text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[56px] lg:text-[64px]">
              Sicherer URL-Shortener{" "}
              <br className="hidden sm:block" />
              <span className="vestas-text-gradient">für deutsche Behörden</span>
            </h1>
            <p className="mb-12 text-[17px] leading-[1.65] text-muted-foreground md:text-[19px] max-w-2xl mx-auto">
              DSGVO-konformer URL-Verkürzungsdienst mit intelligenter Weiterleitung,
              Barrierefreiheit und höchsten Sicherheitsstandards.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = "/api/login";
                }}
                className="rounded-full h-12 px-8 text-[15px] font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                data-testid="button-get-started"
              >
                Jetzt starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full h-12 px-8 text-[15px] font-medium border-border/60"
                data-testid="button-learn-more"
              >
                Mehr erfahren
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/40">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-[32px] font-semibold tracking-[-0.025em] md:text-[40px]">Hauptmerkmale</h2>
              <p className="mt-5 text-[17px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Entwickelt für maximale Sicherheit, Datenschutz und Benutzerfreundlichkeit
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card 
                  key={feature.title} 
                  className="p-7 border-0 shadow-sm rounded-[20px] bg-background hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] ${feature.bg}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2.5 text-[17px] font-semibold tracking-tight">{feature.title}</h3>
                  <p className="text-[14px] leading-[1.6] text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-28">
          <div className="container px-6 max-w-3xl mx-auto text-center">
            <div className="rounded-[28px] vestas-gradient-light p-14 md:p-18 border border-primary/8">
              <h2 className="mb-5 text-[28px] font-semibold tracking-[-0.02em] md:text-[36px]">Bereit anzufangen?</h2>
              <p className="mb-10 text-[17px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                Melden Sie sich an, um BundLink für Ihre Behörde zu nutzen.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = "/api/login";
                }}
                className="rounded-full h-12 px-9 text-[15px] font-medium shadow-lg shadow-primary/25"
                data-testid="button-signup"
              >
                Jetzt starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-border/40 py-8 bg-muted/20">
        <div className="container px-6 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] vestas-gradient shadow-sm">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-[14px] font-semibold tracking-tight">BundLink</span>
            </div>
            <p className="text-center text-[13px] text-muted-foreground">
              © 2025 BundLink · DSGVO-konform · BSI-zertifiziert
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
