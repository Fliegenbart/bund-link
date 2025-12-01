import {
  LayoutDashboard,
  Link2,
  BarChart3,
  Settings,
  Shield,
  FileText,
  ChevronRight,
  Upload,
  LogOut,
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

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case "federal":
        return "bg-primary/12 text-primary border-0";
      case "state":
        return "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-0";
      default:
        return "bg-muted text-muted-foreground border-0";
    }
  };

  return (
    <Sidebar data-testid="sidebar-admin" className="border-r-0 bg-sidebar/50">
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] vestas-gradient shadow-md shadow-primary/15">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold tracking-tight">BundLink</span>
            <span className="text-[11px] text-muted-foreground tracking-wide uppercase">URL Verwaltung</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em] px-3 mb-1.5">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`rounded-[10px] h-10 px-3 transition-all duration-200 ${
                        isActive 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted/50 text-foreground/80"
                      }`}
                    >
                      <Link href={item.url} data-testid={`link-${item.url.slice(1)}`}>
                        <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="flex-1 text-[13px]">{item.title}</span>
                        {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/50" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 pt-2">
        <div className="flex items-center gap-3 rounded-[14px] bg-muted/40 p-3">
          <Avatar className="h-9 w-9 ring-2 ring-background/80 shadow-sm">
            <AvatarImage
              src={user?.profileImageUrl || ""}
              alt={user?.firstName || "User"}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/8 text-primary text-[13px] font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <p className="truncate text-[13px] font-medium" data-testid="text-username">
              {user?.firstName} {user?.lastName}
            </p>
            <Badge
              className={`w-fit mt-1 text-[10px] font-semibold px-2 py-0 h-[18px] ${getRoleBadgeClass(user?.role)}`}
              data-testid="badge-user-role"
            >
              {getRoleBadgeText(user?.role)}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-[10px] h-9 mt-2 text-[13px] text-muted-foreground hover:text-foreground gap-2"
          onClick={() => {
            window.location.href = "/api/logout";
          }}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
