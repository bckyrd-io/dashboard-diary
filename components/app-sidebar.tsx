"use client";
import useUserStore from '../app/store/zustand';
import { Calendar, Home, Users, PieChart, TableIcon, Tag, Building, Receipt, Bell, CreditCard } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

const items = [
    {
        title: 'Home',
        url: 'store/dashboard',
        icon: Home,
        roles: ['admin'],
    },
    {
        title: 'Items',
        url: 'store/items',
        icon: Tag,
        roles: ['admin', 'Staff', 'Cashier'],
    },
    {
        title: 'Branches',
        url: 'store/branches',
        icon: Building,
        roles: ['admin'],
    },
    {
        title: 'Events',
        url: 'store/events',
        icon: Receipt,
        roles: ['admin', 'Staff'],
    },
    {
        title: 'Schedule',
        url: 'store/schedule',
        icon: Calendar,
        roles: ['admin', 'Staff', 'Cashier'],
    },
    {
        title: 'Notifications',
        url: 'store/notifications',
        icon: Bell,
        roles: ['admin', 'Cashier'],
    },
    {
        title: 'Performance',
        url: 'store/performance',
        icon: PieChart,
        roles: ['admin'],
    },
    {
        title: 'Users',
        url: 'store/users',
        icon: Users,
        roles: ['admin'],
    },
    {
        title: 'Reports',
        url: 'store/reports',
        icon: TableIcon,
        roles: ['admin'],
    },
];

export function AppSidebar() {
    const { user, clearUser } = useUserStore();
    const pathname = usePathname();
    const router = useRouter();
    const avatarUrl = `https://github.com/shadcn.png`;

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        clearUser();
        router.push('/');
    };

    const isActive = (itemUrl: string) => pathname.startsWith(`/${itemUrl}`);

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu className="pb-4 border-b border-gray-200">
                    <SidebarMenuItem>
                        <div className="flex items-center gap-x-2 ">
                            <div className="flex items-center justify-center ">
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    width={20}
                                    height={20}
                                    className="size-8"
                                />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">The Sneaker Lounge</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    Home of Shoes and Other Accessories
                                </span>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {items
                        .filter((item) => item.roles.includes(user.role))
                        .map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <Link href={`/${item.url}`} className={isActive(item.url) ? 'text-primary ' : ''}>
                                        <item.icon className={isActive(item.url) ? 'text-primary' : 'text-gray-500'} />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                        <Avatar>
                            <AvatarImage src={avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{user.username}</span>
                    </div>
                    <Button onClick={handleLogout} variant="destructive" className="ml-2">
                        Logout
                    </Button>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
