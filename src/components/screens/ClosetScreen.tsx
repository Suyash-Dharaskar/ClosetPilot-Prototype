import React, { useState, useMemo } from 'react';
import { Plus, X, Search, LayoutGrid, Filter, MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

type FilterState = { categories: string[], colors: string[], weather: string[] };

export const ClosetScreen = ({
    closetItems,
    totalItemsCount,
    activeFilters,
    onApplyFilters,
    availableColors,
    categoryOptions,
    onItemMoreClick,
    onProfileClick
}: {
    closetItems: any[],
    totalItemsCount: number,
    activeFilters: FilterState,
    onApplyFilters: (filters: FilterState) => void,
    availableColors: string[],
    categoryOptions: Array<{ label: string, value: string }>, // Updated type for categoryOptions
    onItemMoreClick: (item: any) => void,
    onProfileClick?: () => void
}) => {
    const [isFilterOpen, setFilterOpen] = useState(false);
    const [expandedFilter, setExpandedFilter] = useState<'categories' | 'colors' | 'weather' | null>(null);
    const [tempFilters, setTempFilters] = useState<FilterState>(activeFilters);
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(closetItems.length / ITEMS_PER_PAGE);
    const pagedItems = closetItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset to page 1 when filters change
    React.useEffect(() => { setCurrentPage(1); }, [activeFilters]);

    const handleOpenChange = (open: boolean) => {
        setFilterOpen(open);
        if (open) {
            setTempFilters(activeFilters);
            setExpandedFilter(null); // Collapse all filters when opening
        }
    };

    const handleTempFilterChange = (type: 'categories' | 'colors' | 'weather', value: string) => {
        setTempFilters(prev => {
            const currentValues = prev[type];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [type]: newValues };
        });
    };

    const handleApply = () => {
        onApplyFilters(tempFilters);
        setFilterOpen(false);
    };

    const handleClear = () => {
        setTempFilters({ categories: [], colors: [], weather: [] });
    };

    const totalActiveFilters = activeFilters.categories.length + activeFilters.colors.length + activeFilters.weather.length;
    const totalTempFilters = tempFilters.categories.length + tempFilters.colors.length + tempFilters.weather.length;

    const filterLabel = useMemo(() => {
        if (totalActiveFilters === 0) return 'Filter by...';
        if (totalActiveFilters === 1) return '1 filter applied';
        return `${totalActiveFilters} filters applied`;
    }, [totalActiveFilters]);

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

                <div className="flex justify-between items-center">
                    <DropdownMenu open={isFilterOpen} onOpenChange={handleOpenChange}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="justify-between bg-white">
                                {filterLabel}
                                <Filter className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="start" sideOffset={4} collisionPadding={16}>
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    handleClear();
                                }}
                                disabled={totalTempFilters === 0}
                            >
                                Clear Selections
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* CATEGORY FILTER - INLINE ACCORDION */}
                            <div className="flex flex-col">
                                <button
                                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm hover:bg-slate-100 rounded-sm outline-none"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setExpandedFilter(prev => prev === 'categories' ? null : 'categories');
                                    }}
                                >
                                    <span className="font-medium">Category</span>
                                    <div className="flex items-center gap-2">
                                        {tempFilters.categories.length > 0 && (
                                            <Badge variant="secondary" className="h-5 w-5 flex items-center justify-center p-0 rounded-full">
                                                {tempFilters.categories.length}
                                            </Badge>
                                        )}
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedFilter === 'categories' && "rotate-180")} />
                                    </div>
                                </button>
                                {expandedFilter === 'categories' && (
                                    <div className="pl-2 pr-1 py-1 max-h-48 overflow-y-auto flex flex-col gap-0.5">
                                        {categoryOptions.map(({ label, value }) => (
                                            <DropdownMenuCheckboxItem key={value}
                                                checked={tempFilters.categories.includes(value)}
                                                onCheckedChange={() => handleTempFilterChange('categories', value)}
                                                onSelect={(e) => e.preventDefault()}>
                                                {label}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <DropdownMenuSeparator />

                            {/* COLOR FILTER - INLINE ACCORDION */}
                            <div className="flex flex-col">
                                <button
                                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm hover:bg-slate-100 rounded-sm outline-none"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setExpandedFilter(prev => prev === 'colors' ? null : 'colors');
                                    }}
                                >
                                    <span className="font-medium">Color</span>
                                    <div className="flex items-center gap-2">
                                        {tempFilters.colors.length > 0 && (
                                            <Badge variant="secondary" className="h-5 w-5 flex items-center justify-center p-0 rounded-full">
                                                {tempFilters.colors.length}
                                            </Badge>
                                        )}
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedFilter === 'colors' && "rotate-180")} />
                                    </div>
                                </button>
                                {expandedFilter === 'colors' && (
                                    <div className="pl-2 pr-1 py-1 max-h-48 overflow-y-auto flex flex-col gap-0.5">
                                        {availableColors.map(color => (
                                            <DropdownMenuCheckboxItem key={color.toLowerCase()}
                                                checked={tempFilters.colors.includes(color.toLowerCase())}
                                                onCheckedChange={() => handleTempFilterChange('colors', color.toLowerCase())}
                                                onSelect={(e) => e.preventDefault()}>
                                                {color}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <DropdownMenuSeparator />

                            {/* WEATHER FILTER - INLINE ACCORDION */}
                            <div className="flex flex-col">
                                <button
                                    className="flex items-center justify-between w-full px-2 py-1.5 text-sm hover:bg-slate-100 rounded-sm outline-none"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setExpandedFilter(prev => prev === 'weather' ? null : 'weather');
                                    }}
                                >
                                    <span className="font-medium">Weather</span>
                                    <div className="flex items-center gap-2">
                                        {tempFilters.weather.length > 0 && (
                                            <Badge variant="secondary" className="h-5 w-5 flex items-center justify-center p-0 rounded-full">
                                                {tempFilters.weather.length}
                                            </Badge>
                                        )}
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedFilter === 'weather' && "rotate-180")} />
                                    </div>
                                </button>
                                {expandedFilter === 'weather' && (
                                    <div className="pl-2 pr-1 py-1 shrink-0 flex flex-col gap-0.5">
                                        {[
                                            { label: 'Cold/Layering', value: 'cold' },
                                            { label: 'Hot/Breathable', value: 'hot' },
                                            { label: 'Monsoon/Utility', value: 'monsoon' }
                                        ].map(({ label, value }) => (
                                            <DropdownMenuCheckboxItem key={value}
                                                checked={tempFilters.weather.includes(value)}
                                                onCheckedChange={() => handleTempFilterChange('weather', value)}
                                                onSelect={(e) => e.preventDefault()}>
                                                {label}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <DropdownMenuSeparator />
                            <div className="p-2">
                                <Button className="w-full" size="sm" onClick={handleApply}>Apply</Button>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Badge variant="secondary" className="bg-gray-200 text-gray-600 font-bold">{closetItems.length}/{totalItemsCount} ITEMS</Badge>
                </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
                {pagedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-8 fade-in-0 animate-in duration-500">
                        <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                            {activeFilters.categories.length > 0 || activeFilters.colors.length > 0 || activeFilters.weather.length > 0 ? (
                                <Search className="w-10 h-10 text-primary/40" />
                            ) : (
                                <LayoutGrid className="w-10 h-10 text-primary/40" />
                            )}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground/80 mb-2">
                            {activeFilters.categories.length > 0 || activeFilters.colors.length > 0 || activeFilters.weather.length > 0
                                ? "No items match your filters"
                                : "Your closet is empty"
                            }
                        </h3>
                        <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-[250px]">
                            {activeFilters.categories.length > 0 || activeFilters.colors.length > 0 || activeFilters.weather.length > 0
                                ? "Try adjusting your filters to see more results."
                                : <>Tap the <span className="font-bold text-primary px-1">+</span> button to scan and add your first clothing item.</>
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {pagedItems.map((item) => (
                                <Card key={item.src} className="bg-white rounded-lg overflow-hidden shadow-sm">
                                    <CardContent className="p-0">
                                        <div className="aspect-square w-full bg-white relative">
                                            <Image src={item.src} alt={item.name} fill className="object-contain" data-ai-hint={item.hint} />
                                        </div>
                                        <div className="p-3">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold truncate text-sm">{item.name}</h3>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1 shrink-0 text-muted-foreground" onClick={() => onItemMoreClick(item)}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex gap-1 mt-1 overflow-x-auto scrollbar-hide">
                                                {item.tags.map((tag: string) => <Badge key={tag} variant="outline" className="text-primary border-primary/50 bg-primary/10 shrink-0">{tag}</Badge>)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 pt-4 pb-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium text-muted-foreground">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    );
};
