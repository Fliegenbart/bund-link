import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RoutingRule } from "@shared/schema";

interface RoutingRulesManagerProps {
  linkId: string;
}

export function RoutingRulesManager({ linkId }: RoutingRulesManagerProps) {
  const { toast } = useToast();
  const [ruleType, setRuleType] = useState<"geographic" | "language">("geographic");
  const [condition, setCondition] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  const { data: rules, isLoading } = useQuery<RoutingRule[]>({
    queryKey: ["/api/links", linkId, "routing-rules"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let conditionObj;
      if (ruleType === "geographic") {
        conditionObj = { country: condition.toUpperCase() };
      } else {
        conditionObj = { language: condition.toLowerCase() };
      }

      await apiRequest("POST", `/api/links/${linkId}/routing-rules`, {
        ruleType,
        condition: conditionObj,
        targetUrl,
        priority: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links", linkId, "routing-rules"] });
      setCondition("");
      setTargetUrl("");
      toast({
        title: "Routing-Regel hinzugefügt",
        description: "Die Regel wurde erfolgreich erstellt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Regel konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const handleAddRule = () => {
    if (!condition || !targetUrl) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intelligentes Routing</CardTitle>
        <CardDescription>
          Leiten Sie Benutzer basierend auf Standort oder Sprache zu verschiedenen Zielen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Routing-Typ</Label>
            <Select
              value={ruleType}
              onValueChange={(value: "geographic" | "language") => setRuleType(value)}
            >
              <SelectTrigger data-testid="select-routing-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geographic">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Geografisch (Land)</span>
                  </div>
                </SelectItem>
                <SelectItem value="language">
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    <span>Sprache</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {ruleType === "geographic" ? "Ländercode (z.B. DE, AT, CH)" : "Sprachcode (z.B. de, en, tr)"}
            </Label>
            <Input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder={ruleType === "geographic" ? "DE" : "de"}
              data-testid="input-routing-condition"
            />
          </div>

          <div className="space-y-2">
            <Label>Ziel-URL für diese Bedingung</Label>
            <Input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://beispiel.de/seite-de"
              type="url"
              data-testid="input-routing-target"
            />
          </div>

          <Button
            onClick={handleAddRule}
            disabled={createMutation.isPending}
            className="w-full"
            data-testid="button-add-rule"
          >
            <Plus className="mr-2 h-4 w-4" />
            Regel hinzufügen
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground">Lade Regeln...</div>
        ) : rules && rules.length > 0 ? (
          <div className="space-y-2">
            <Label>Aktive Routing-Regeln</Label>
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-md border p-3"
                  data-testid={`rule-${rule.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {rule.ruleType === "geographic" ? (
                        <Globe className="h-4 w-4 text-primary" />
                      ) : (
                        <Languages className="h-4 w-4 text-primary" />
                      )}
                      <span>
                        {rule.ruleType === "geographic" ? "Land" : "Sprache"}:{" "}
                        {typeof rule.condition === "object" && rule.condition !== null
                          ? (rule.condition as any).country || (rule.condition as any).language
                          : ""}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      → {rule.targetUrl}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Noch keine Routing-Regeln definiert
          </div>
        )}
      </CardContent>
    </Card>
  );
}
