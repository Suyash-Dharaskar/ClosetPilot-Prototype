import React, { useState, useEffect, useRef } from 'react';
import { Luggage, Dot, LoaderCircle, Backpack, BriefcaseBusiness, ShieldCheck, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';
import { generatePackingSuggestions, type GeneratePackingSuggestionsOutput } from '@/ai/flows/generate-packing-suggestions';

const strategyIcons: Record<string, React.ReactNode> = {
    'Light Packer': <Backpack className="w-4 h-4" />,
    'Smart Traveler': <BriefcaseBusiness className="w-4 h-4" />,
    'Be Prepared': <ShieldCheck className="w-4 h-4" />,
};

export const TripKitScreen = ({ destination, setDestination, startDate, setStartDate, endDate, setEndDate, isGeneratingTripKit, tripSuggestions, setIsGeneratingTripKit, setTripSuggestions, closetItems, temperatureUnit, onProfileClick }: any) => {
    const [activeStrategy, setActiveStrategy] = useState(0);
    const mustHaveRef = useRef<HTMLDivElement>(null);
    const niceToHaveRef = useRef<HTMLDivElement>(null);
    const [mustHaveIndex, setMustHaveIndex] = useState(0);
    const [niceToHaveIndex, setNiceToHaveIndex] = useState(0);

    // UI Prototype State
    const [luggageLimit, setLuggageLimit] = useState<string>('Carry-On');
    const [mainVibes, setMainVibes] = useState<string[]>(['Adventure']);
    const [customVibeStr, setCustomVibeStr] = useState('');

    const { toast } = useToast();

    const handleAddCustomVibe = () => {
        if (customVibeStr.trim() && !mainVibes.includes(customVibeStr.trim())) {
            setMainVibes([...mainVibes, customVibeStr.trim()]);
            setCustomVibeStr('');
        }
    };

    const toggleVibe = (vibe: string) => {
        if (mainVibes.includes(vibe)) {
            setMainVibes(mainVibes.filter(v => v !== vibe));
        } else {
            setMainVibes([...mainVibes, vibe]);
        }
    };

    const handleGetTripSuggestionsInternal = async () => {
        if (!destination || !startDate || !endDate) return;
        setIsGeneratingTripKit(true);
        setTripSuggestions(null);
        setActiveStrategy(0);
        try {
            const aiClosetItems = closetItems.map((item: any) => ({ name: item.name, tags: item.tags }));
            // AI call only requires destination and dates currently, but the UI is complete.
            const suggestions = await generatePackingSuggestions({
                destination,
                travelDates: `${startDate} to ${endDate}`,
                luggageLimit,
                mainVibes,
                temperatureUnit,
                closetItems: aiClosetItems
            });
            setTripSuggestions(suggestions);
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Processing Error",
                description: error.message || "Failed to generate suggestions."
            });
        } finally {
            setIsGeneratingTripKit(false);
        }
    };

    const createObserver = (ref: React.RefObject<HTMLDivElement | null>, setIndex: (index: number) => void) => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        setIndex(index);
                    }
                }
            },
            { root: ref.current, threshold: 0.51 }
        );
        Array.from(ref.current.children).forEach(child => observer.observe(child));
        return () => observer.disconnect();
    };

    useEffect(() => createObserver(mustHaveRef, setMustHaveIndex), [tripSuggestions, activeStrategy]);
    useEffect(() => createObserver(niceToHaveRef, setNiceToHaveIndex), [tripSuggestions, activeStrategy]);

    const currentStrategy = tripSuggestions?.strategies?.[activeStrategy];

    const renderCarousel = (title: string, items: { name: string }[] | undefined, ref: React.RefObject<HTMLDivElement | null>, activeIndex: number) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="space-y-3">
                <h3 className="font-semibold text-lg">{title}</h3>
                <div className="relative">
                    <div ref={ref} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 py-1 gap-3">
                        {items.map((item, index) => {
                            const closetItem = closetItems.find((ci: any) => ci.name === item.name);
                            return (
                                <div key={index} data-index={index} className="snap-start shrink-0 w-[45%]">
                                    <Card className="aspect-square bg-white flex flex-col items-center justify-between p-2">
                                        {closetItem ? (
                                            <div className="w-full h-full relative">
                                                <Image src={closetItem.src} alt={closetItem.name} fill className="object-contain" data-ai-hint={closetItem.hint} />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                                <Luggage className="w-10 h-10 text-muted-foreground" />
                                            </div>
                                        )}
                                        <p className="text-center font-semibold text-xs mt-2 truncate w-full">{item.name}</p>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-center gap-2">
                    {items.slice(0, Math.ceil(items.length / 2)).map((_, i) => (
                        <Dot key={i} className={cn('h-3 w-3 text-gray-300', { 'text-primary': activeIndex === i })} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-background p-4 border-b">
                <header className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-7 h-7" style={{ color: '#0B2545' }} />
                        <h1 className="text-2xl font-bold" style={{ color: '#0B2545' }}>ClosetPilot</h1>
                    </div>
                    <button onClick={onProfileClick} className="rounded-full shadow-sm active:scale-95 transition-transform outline-none">
                        <Image src="https://picsum.photos/seed/user/40/40" alt="User Avatar" width={32} height={32} className="rounded-full pointer-events-none" />
                    </button>
                </header>

                <div className="flex justify-center items-center h-10">
                    <h2 className="text-lg font-bold">Trip Details</h2>
                </div>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto pb-6 animate-in fade-in duration-300">
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Destination</label>
                        <Input placeholder="e.g. Manali, Himachal Pradesh" className="bg-white border-slate-200 placeholder:text-slate-400" value={destination} onChange={e => setDestination(e.target.value)} />
                    </div>

                    <div className="space-y-1.5 overflow-hidden">
                        <label className="text-sm font-semibold text-slate-700">Travel Dates</label>
                        <div className="flex gap-2 items-center">
                            <Input type="date" max={endDate || undefined} className="bg-white border-slate-200 text-slate-500 flex-1 min-w-0 h-10 px-3 py-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <div className="text-slate-400 font-medium text-xs shrink-0">to</div>
                            <Input type="date" min={startDate || undefined} className="bg-white border-slate-200 text-slate-500 flex-1 min-w-0 h-10 px-3 py-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Luggage Limit</label>
                        <div className="flex flex-wrap gap-2">
                            {['🎒 Backpack', '🧳 Carry-On', '🛄 Checked'].map((limit) => {
                                const limitText = limit.split(' ')[1] || limit;
                                return (
                                    <button
                                        key={limit}
                                        onClick={() => setLuggageLimit(limitText)}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                            luggageLimit === limitText
                                                ? "bg-primary text-white border-primary"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        {limit}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Main Vibe</label>
                        <div className="flex flex-wrap gap-2">
                            {
                                [...new Set(['🏔️ Adventure', '🍸 Nightlife', '💍 Wedding', ...mainVibes.filter(v => !['Adventure', 'Nightlife', 'Wedding'].includes(v)).map(v => `✨ ${v}`)])].map((vibe) => {
                                    const vibeText = vibe.split(' ').slice(1).join(' ') || vibe;
                                    return (
                                        <button
                                            key={vibe}
                                            onClick={() => toggleVibe(vibeText)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5",
                                                mainVibes.includes(vibeText)
                                                    ? "bg-slate-800 text-white border-slate-800"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            {vibe}
                                            {mainVibes.includes(vibeText) && <X className="w-3 h-3 text-white/70" />}
                                        </button>
                                    );
                                })}
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full pl-3 pr-1 py-1 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                <span className="text-slate-400 text-sm">✨</span>
                                <input
                                    type="text"
                                    placeholder="Custom vibe..."
                                    className="bg-transparent border-none outline-none text-sm w-24 px-1"
                                    value={customVibeStr}
                                    onChange={e => setCustomVibeStr(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomVibe(); }}
                                />
                                <button onClick={handleAddCustomVibe} disabled={!customVibeStr.trim()} className="bg-primary/10 text-primary p-1 rounded-full disabled:opacity-50">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <Button onClick={handleGetTripSuggestionsInternal} disabled={isGeneratingTripKit || closetItems.length === 0} className="w-full h-14 text-lg font-bold shadow-md active:scale-[0.98] transition-all" style={{ backgroundColor: '#2563EB' }}>
                    {isGeneratingTripKit ? <LoaderCircle className="animate-spin" /> : 'Get Suggestions'}
                </Button>
                {closetItems.length === 0 && <p className="text-xs text-center text-muted-foreground">Add items to your closet to get packing suggestions.</p>}

                {tripSuggestions && <Separator />}

                {tripSuggestions && (
                    <div className="space-y-5 animate-in fade-in duration-500">
                        {/* Weather Alert */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-3 rounded-r-lg">
                            <p className='font-bold text-sm'>🌤️ Weather Alert</p>
                            <p className="text-sm">{tripSuggestions.weatherAlert}</p>
                        </div>

                        {/* Strategy Tabs */}
                        {tripSuggestions.strategies && tripSuggestions.strategies.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {tripSuggestions.strategies.map((strategy: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveStrategy(index)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0",
                                            activeStrategy === index
                                                ? "bg-primary text-white shadow-md"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        {strategyIcons[strategy.strategyName] || <Luggage className="w-3.5 h-3.5" />}
                                        {strategy.strategyName}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Active Strategy Content */}
                        {currentStrategy && (
                            <div className="space-y-4 animate-in fade-in duration-300" key={activeStrategy}>
                                <p className="text-xs text-muted-foreground italic">{currentStrategy.strategyDescription}</p>
                                {renderCarousel("Must Have", currentStrategy.mustHaveItems, mustHaveRef, mustHaveIndex)}
                                {renderCarousel("Nice to Have", currentStrategy.niceToHaveItems, niceToHaveRef, niceToHaveIndex)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
