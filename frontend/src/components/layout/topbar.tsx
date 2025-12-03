'use client';

import { useState, useEffect, useMemo } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings, User, Search, Bell, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { searchModules, type NavItem } from '@/lib/navigation';

export function Topbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userPermissions: string[] = useMemo(() => {
    const sess: any = session as any;
    const direct = sess?.user?.permissions;
    if (Array.isArray(direct)) return direct as string[];
    if (typeof direct === 'string') {
      try { return JSON.parse(direct); } catch { /* fallthrough */ }
    }
    const rolePerms = sess?.user?.role?.permissions;
    if (Array.isArray(rolePerms)) return rolePerms as string[];
    if (typeof rolePerms === 'string') {
      try { return JSON.parse(rolePerms); } catch { return []; }
    }
    return [];
  }, [session]);

  const searchResults = useMemo(() => {
    return searchModules(searchQuery, userPermissions);
  }, [searchQuery, userPermissions]);

  const handleSearchSelect = (item: NavItem) => {
    router.push(item.href);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/auth/signin' });
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const toggleTheme = () => {
    if (setTheme) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo/Branding */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-foreground">Selos</h1>
        </div>

        {/* Center Section - Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
            <Input
              type="text"
              placeholder="Rechercher un module..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setIsSearchOpen(true);
                }
              }}
              onBlur={() => {
                // Delay to allow clicking on results
                setTimeout(() => setIsSearchOpen(false), 200);
              }}
              className="pl-10 w-full bg-muted border-border"
            />
            {isSearchOpen && searchResults.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {searchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSearchSelect(item)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="w-full flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {isSearchOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 p-4 text-sm text-muted-foreground text-center"
                onMouseDown={(e) => e.preventDefault()}
              >
                Aucun module trouvé
              </div>
            )}
          </div>
        </div>

        {/* Right Section - User info and icons */}
        <div className="flex items-center space-x-4">
          {/* User Name */}
          <span className="text-sm font-medium text-foreground hidden md:block">
            {session?.user?.firstName} {session?.user?.lastName}
          </span>

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
          </Button>

          {/* User Avatar/Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {session?.user?.firstName && session?.user?.lastName
                      ? getInitials(session.user.firstName, session.user.lastName)
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.firstName} {session?.user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.role?.name}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}



