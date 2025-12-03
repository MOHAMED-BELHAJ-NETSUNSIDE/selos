import { Link, useLocation } from 'react-router-dom';
import { Home, Package, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/stock', icon: Package, label: 'Stock' },
  { path: '/delivery-notes', icon: FileText, label: 'BL' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-border/40 shadow-minimal-lg">
      <div className="flex items-center justify-around px-4 py-3 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-2xl px-5 py-2 transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className={cn("text-xs font-medium", isActive && "font-semibold")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

