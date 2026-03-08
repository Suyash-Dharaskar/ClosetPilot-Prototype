import React from 'react';
import { LayoutGrid, Sparkles, MapPin, Thermometer, LogOut, Shirt, Pencil } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

export interface ProfileScreenProps {
    totalItemsCount: number;
    totalCombosGenerated: number;
    userLocation: string;
    setUserLocation: (location: string) => void;
    temperatureUnit: 'C' | 'F';
    setTemperatureUnit: (unit: 'C' | 'F') => void;
    onLogout?: () => void;
}

export const ProfileScreen = ({
    totalItemsCount,
    totalCombosGenerated,
    userLocation,
    setUserLocation,
    temperatureUnit,
    setTemperatureUnit,
    onLogout
}: ProfileScreenProps) => {
    const [isEditingLocation, setIsEditingLocation] = React.useState(false);
    const [tempLocation, setTempLocation] = React.useState(userLocation);

    const handleSaveLocation = () => {
        if (tempLocation.trim()) {
            setUserLocation(tempLocation.trim());
        } else {
            setTempLocation(userLocation);
        }
        setIsEditingLocation(false);
    };

    return (
        <div className="bg-background flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 z-10 bg-background p-4 py-3 border-b shrink-0">
                <header className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6" style={{ color: '#0B2545' }} />
                        <h1 className="text-xl font-bold" style={{ color: '#0B2545' }}>ClosetPilot</h1>
                    </div>
                </header>
                <div className="flex justify-center items-center h-8">
                    <h2 className="text-base font-bold">Your Profile</h2>
                </div>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto animate-in fade-in duration-300">
                {/* Component 1: User Identity (Top Center) */}
                <div className="flex flex-col items-center justify-center mt-0 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/10 mb-2 block">
                        <Image src="https://picsum.photos/seed/user/80/80" alt="User Avatar" width={64} height={64} className="object-cover w-full h-full" />
                    </div>
                    <h2 className="text-base font-bold text-foreground leading-tight">Suyash S.</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Optimizer Level 1</p>
                </div>

                {/* Component 2: Closet Logistics (The Gamification Hook) */}
                <div>
                    <h3 className="text-[10px] tracking-wider text-slate-500 uppercase text-left font-bold mb-1.5">CLOSET LOGISTICS</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 mb-2">
                        <div className="grid grid-cols-2">
                            <div className="flex flex-col items-center justify-center p-1">
                                <Shirt className="w-5 h-5 text-primary/60 mb-1" />
                                <span className="text-2xl font-bold text-slate-800 leading-none">{totalItemsCount}</span>
                                <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tight">Items Digitized</span>
                            </div>

                            <div className="flex flex-col items-center justify-center border-l border-slate-100 p-1">
                                <Sparkles className="w-5 h-5 text-amber-500 mb-1" />
                                <span className="text-2xl font-bold text-slate-800 leading-none">{totalCombosGenerated}</span>
                                <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tight">Combos Generated</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Component 3: Regional Context (The Weather Engine) */}
                <div>
                    <h3 className="text-[10px] tracking-wider text-slate-500 uppercase text-left font-bold mb-1.5">REGIONAL CONTEXT</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-2">
                        {/* Row 1 */}
                        <div className="flex items-center justify-between p-3 border-b border-slate-100 min-h-[52px]">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-xs text-slate-700 font-medium">Home Base</span>
                            </div>
                            {isEditingLocation ? (
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        value={tempLocation}
                                        onChange={e => setTempLocation(e.target.value)}
                                        className="h-7 text-xs py-1 px-2 w-[140px]"
                                        autoFocus
                                        onBlur={handleSaveLocation}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLocation(); }}
                                    />
                                </div>
                            ) : (
                                <button onClick={() => { setTempLocation(userLocation); setIsEditingLocation(true); }} className="flex items-center gap-1.5 group text-right">
                                    <span className="text-xs font-semibold text-slate-900 border-b border-transparent group-hover:border-slate-300 transition-colors max-w-[140px] truncate">{userLocation}</span>
                                    <Pencil className="w-3 h-3 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                                </button>
                            )}
                        </div>
                        {/* Row 2 */}
                        <div className="flex items-center justify-between p-3 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-slate-400" />
                                <span className="text-xs text-slate-700 font-medium">Climate Unit</span>
                            </div>
                            <div className="flex bg-slate-200 rounded-lg overflow-hidden p-0.5">
                                <button
                                    onClick={() => setTemperatureUnit('C')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${temperatureUnit === 'C' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    °C
                                </button>
                                <button
                                    onClick={() => setTemperatureUnit('F')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${temperatureUnit === 'F' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    °F
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Component 4: Account Basics */}
                <div className="pb-16">
                    <h3 className="text-[10px] tracking-wider text-slate-500 uppercase text-left font-bold mb-1.5">ACCOUNT</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <button onClick={onLogout} className="w-full text-center py-3 text-red-500 font-semibold text-xs hover:bg-slate-50 transition-colors active:bg-slate-100">
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
