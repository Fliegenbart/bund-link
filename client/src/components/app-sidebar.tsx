import {
  LayoutDashboard,
  Link2,
  BarChart3,
  Settings,
  Shield,
  FileText,
  ChevronRight,
  Upload,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Links erstellen",
    url: "/create",
    icon: Link2,
  },
  {
    title: "Massen-Upload",
    url: "/bulk-create",
    icon: Upload,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Berichte",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "Einstellungen",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const getRoleBadgeText = (role?: string) => {
    switch (role) {
      case "federal":
        return "Bund";
      case "state":
        return "Land";
      case "local":
        return "Lokal";
      default:
        return "Lokal";
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "federal":
        return "default";
      case "state":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Sidebar data-testid="sidebar-admin">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight">BundLink</h1>
            <p className="text-xs text-muted-foreground">URL Verwaltung</p>
          </div>
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`link-${item.url.slice(1)}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-md border bg-card p-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.profileImageUrl || ""}
              alt={user?.firstName || "User"}
              className="object-cover"
            />
            <AvatarFallback>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <p className="truncate text-sm font-medium" data-testid="text-username">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant={getRoleBadgeVariant(user?.role) as any}
                className="text-xs"
                data-testid="badge-user-role"
              >
                {getRoleBadgeText(user?.role)}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            window.location.href = "/api/logout";
          }}
          data-testid="button-logout"
        >
          Abmelden
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
