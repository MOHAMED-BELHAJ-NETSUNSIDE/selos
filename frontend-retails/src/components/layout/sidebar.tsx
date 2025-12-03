'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { navigationGroups, type NavGroup } from '@/lib/navigation';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupTitle)) {
        next.delete(groupTitle);
      } else {
        next.add(groupTitle);
      }
      return next;
    });
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-20 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:relative lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">Selos Retails</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
            {navigationGroups.map((group) => {
              const totalItems = group.items?.length || 0;
              const isExpanded = expandedGroups.has(group.title) || totalItems === 1;
              const GroupIcon = group.icon;
              
              return (
                <div key={group.title} className="space-y-1">
                  {totalItems > 1 ? (
                    <>
                      <button
                        onClick={() => toggleGroup(group.title)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
                      >
                        <div className="flex items-center">
                          {GroupIcon && <GroupIcon className="mr-2 h-4 w-4" />}
                          <span>{group.title}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="ml-2 pl-4 border-l border-sidebar-border space-y-1">
                          {group.items?.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                  isActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                )}
                                onClick={() => setIsOpen(false)}
                              >
                                <item.icon className="mr-3 h-4 w-4" />
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    // Si un seul item, pas besoin de groupe repliable
                    <>
                      {group.items?.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })}
          </nav>

          <Separator />

          {/* User info */}
          <div className="p-4">
            <div className="text-sm text-sidebar-foreground">
              <p className="font-medium">Selos Retails</p>
              <p className="text-xs text-muted-foreground">Version 1.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

