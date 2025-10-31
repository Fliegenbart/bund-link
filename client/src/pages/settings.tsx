import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Building2, User } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();

  const getRoleText = (role?: string) => {
    switch (role) {
      case "federal":
        return "Bundesebene";
      case "state":
        return "Landesebene";
      case "local":
        return "Kommunalebene";
      default:
        return "Kommunalebene";
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalten Sie Ihr Konto und Ihre Präferenzen</p>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Ihre Kontoinformationen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={user?.profileImageUrl || ""}
                  alt={user?.firstName || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  value={user?.firstName || ""}
                  readOnly
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  value={user?.lastName || ""}
                  readOnly
                  data-testid="input-last-name"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">E-Mail</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    data-testid="input-email"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Berechtigungen</CardTitle>
            <CardDescription>Ihre Zugriffsstufe und Berechtigungen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Zugriffsstufe</p>
                  <p className="text-sm text-muted-foreground">{getRoleText(user?.role)}</p>
                </div>
              </div>
              <Badge variant="default" data-testid="badge-role">
                {user?.role?.toUpperCase()}
              </Badge>
            </div>

            {user?.agency && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Behörde</p>
                    <p className="text-sm text-muted-foreground">{user.agency}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="mb-2 font-medium">Berechtigungen</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Links erstellen und verwalten</li>
                <li>✓ Analytics einsehen</li>
                <li>✓ QR-Codes generieren</li>
                {user?.role === "federal" && (
                  <>
                    <li>✓ Alle Behörden-Links einsehen</li>
                    <li>✓ Erweiterte Routing-Optionen</li>
                    <li>✓ Berichte verwalten</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sicherheit</CardTitle>
            <CardDescription>Sicherheitseinstellungen und Datenschutz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-success/10 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-success">Konto gesichert</p>
                  <p className="text-sm text-muted-foreground">
                    Ihr Konto ist durch Replit Auth geschützt mit SSL-Verschlüsselung.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Datenschutz</h4>
              <p className="text-sm text-muted-foreground">
                Ihre Daten werden gemäß DSGVO verarbeitet. Alle Analytics-Daten sind anonymisiert.
                Es werden keine Tracking-Cookies verwendet.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konto</CardTitle>
            <CardDescription>Kontoverwaltung</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    "Möchten Sie sich wirklich abmelden?"
                  )
                ) {
                  window.location.href = "/api/logout";
                }
              }}
              data-testid="button-logout-settings"
            >
              Abmelden
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
