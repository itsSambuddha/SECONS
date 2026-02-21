import Meeting from "@/models/Meeting";
import {
    LayoutDashboard,
    CalendarDays,
    Trophy,
    Medal,
    Banknote,
    MessageSquare,
    Megaphone,
    Calendar,
    MoreHorizontal,
    Music,
    Users,
    Settings,
    FileText,
    Video,
    Wind
} from "lucide-react";

export interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    description?: string;
}

export const mainNav: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Events",
        href: "/events",
        icon: CalendarDays,
    },
    {
        label: "Sports",
        href: "/sports",
        icon: Trophy,
    },
    {
        label: "Leaderboard",
        href: "/leaderboard",
        icon: Medal,
    },
    {
        label: "Finance",
        href: "/finance",
        icon: Banknote,
    },
    {
        label: "Chat",
        href: "/chat",
        icon: MessageSquare,
    },
    {
        label: "Announcements",
        href: "/announcements",
        icon: Megaphone,
    },
    {
        label: "Calendar",
        href: "/calendar",
        icon: Calendar,
    },
    {
        label: "Meetings",
        href: "/meetings",
        icon: Video,
    }
];

export const bottomNav: NavItem[] = [
    {
        label: "Home",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Events",
        href: "/events",
        icon: CalendarDays,
    },
    {
        label: "Sports",
        href: "/sports",
        icon: Trophy,
    },
    {
        label: "Chat",
        href: "/chat",
        icon: MessageSquare,
    },
    {
        label: "More",
        href: "#",
        icon: MoreHorizontal,
    },
];

export const secondaryNav: NavItem[] = [
    {
        label: "Team",
        href: "/team",
        icon: Users,
    },
    {
        label: "Take a Breath",
        href: "/breath",
        icon: Wind,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    }
];
