import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { ArrowLeft, Globe, Languages, Smartphone, Clock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Switch } from "@/components/ui/switch";

const createLinkSchema = z.object({
  destinationUrl: z.string().url({ message: "Bitte geben Sie eine gültige URL ein" }),
  customAlias: z
    .string()
    .regex(/^[a-zA-Z0-9-_]*$/, "Nur Buchstaben, Zahlen, Bindestriche und Unterstriche erlaubt")
    .optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  agency: z.string().optional(),
  expiresAt: z.string().optional(),
  enableGeographic: z.boolean().default(false),
  enableLanguage: z.boolean().default(false),
});

type CreateLinkForm = z.infer<typeof createLinkSchema>;

export default function CreateLink() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [routingRules, setRoutingRules] = useState<
    Array<{ type: string; condition: any; targetUrl: string }>
  >([]);

  const form = useForm<CreateLinkForm>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: {
      destinationUrl: "",
      customAlias: "",
      title: "",
      description: "",
      agency: "",
      expiresAt: "",
      enableGeographic: false,
      enableLanguage: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateLinkForm) => {
      const response = await apiRequest("POST", "/api/links", {
        destinationUrl: data.destinationUrl,
        customAlias: data.customAlias || undefined,
        title: data.title || undefined,
        description: data.description || undefined,
        agency: data.agency || undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        isActive: true,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link erstellt!",
        description: "Ihr verkürzter Link wurde erfolgreich erstellt.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nicht autorisiert",
          description: "Sie werden erneut angemeldet...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fehler",
        description: "Link konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateLinkForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/dashboard")}
          className="rounded-xl"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Neuer Link erstellen</h1>
          <p className="text-muted-foreground mt-1">Erstellen Sie einen verkürzten Link mit erweiterten Optionen</p>
        </div>
      </div>

      <div className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Grundlegende Informationen</CardTitle>
                <CardDescription>
                  Geben Sie die Ziel-URL und optionale Details ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="destinationUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ziel-URL *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://beispiel.de/seite"
                          {...field}
                          data-testid="input-destination-url"
                        />
                      </FormControl>
                      <FormDescription>
                        Die vollständige URL, zu der weitergeleitet werden soll
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customAlias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Benutzerdefinierter Alias (optional)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">/</span>
                          <Input
                            placeholder="impftermin"
                            {...field}
                            data-testid="input-custom-alias"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Beispiel: impftermin, steuererklarung-2025
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titel (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Impftermin Buchung"
                          {...field}
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Beschreibung des Links..."
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Behörde (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Bundesministerium für Gesundheit"
                          {...field}
                          data-testid="input-agency"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ablaufdatum (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          data-testid="input-expires-at"
                        />
                      </FormControl>
                      <FormDescription>
                        Der Link wird nach diesem Datum automatisch deaktiviert
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Erweiterte Optionen</CardTitle>
                <CardDescription>
                  Intelligente Weiterleitungen basierend auf Standort, Sprache und mehr
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="geographic">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Geografisches Routing</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="enableGeographic"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Geografisches Routing aktivieren
                              </FormLabel>
                              <FormDescription>
                                Leiten Sie Benutzer basierend auf ihrem Standort zu regionalen Diensten um
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-geographic"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <p className="text-sm text-muted-foreground">
                        Weitere Routing-Regeln können nach der Link-Erstellung hinzugefügt werden.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="language">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        <span>Spracherkennung</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="enableLanguage"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Sprachbasiertes Routing aktivieren
                              </FormLabel>
                              <FormDescription>
                                Automatische Weiterleitung zu deutschen/englischen/türkischen Versionen
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-language"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="rounded-xl h-11 px-6"
                data-testid="button-cancel"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
                className="flex-1 rounded-xl h-11 shadow-sm"
              >
                {createMutation.isPending ? "Wird erstellt..." : "Link erstellen"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
