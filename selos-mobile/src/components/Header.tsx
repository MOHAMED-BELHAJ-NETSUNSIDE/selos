import { SyncIndicator } from './SyncIndicator';

interface HeaderProps {
  title: string;
  showSync?: boolean;
}

export function Header({ title, showSync = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-white/80 backdrop-blur-xl shadow-minimal">
      <div className="container flex h-16 items-center justify-between px-5 safe-area-top">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {showSync && <SyncIndicator />}
      </div>
    </header>
  );
}

