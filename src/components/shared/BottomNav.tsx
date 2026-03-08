import React from 'react';
import { Shirt, Sparkles, Luggage } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Tab = 'closet' | 'styler' | 'trip' | 'profile';

export const BottomNav = ({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void; }) => {
  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'closet', icon: Shirt, label: 'Closet' },
    { id: 'styler', icon: Sparkles, label: 'Styler' },
    { id: 'trip', icon: Luggage, label: 'Trip Kit' },
  ];

  return (
    <nav className="absolute bottom-0 w-full bg-white border-t z-30">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors w-full h-full",
              { "text-primary": activeTab === id }
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
