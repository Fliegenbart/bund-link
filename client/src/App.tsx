import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CreateLink from "@/pages/create";
import LinkDetail from "@/pages/link-detail";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Preview from "@/pages/preview";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/:shortCode" component={Preview} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/create" component={CreateLink} />
          <Route path="/links/:id" component={LinkDetail} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route path="/:shortCode" component={Preview} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <ThemeProvider>
      <TooltipProvider>
        {!isLoading && isAuthenticated ? (
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-1 flex-col">
                <header className="flex items-center justify-between border-b p-2">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex flex-1 overflow-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
        ) : (
          <Router />
        )}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedApp />
    </QueryClientProvider>
  );
}

export default App;
