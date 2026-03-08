import React, { useRef, useState, useEffect } from 'react';
import { Shirt, LoaderCircle, ArrowRight, SkipForward, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { generateOutfitSuggestions, type GenerateOutfitSuggestionsOutput } from '@/ai/flows/generate-outfit-suggestions';
import { generateClarifyingQuestions, type GenerateClarifyingQuestionsOutput } from '@/ai/flows/generate-clarifying-questions';

type StylerStep = 'input' | 'clarify' | 'results';

export const StylerScreen = ({ occasion, setOccasion, isGeneratingFit, fitSuggestions, setIsGeneratingFit, setFitSuggestions, closetItems, onProfileClick, onFitGenerated }: any) => {
    const { toast } = useToast();
    const carouselRef = useRef<HTMLDivElement>(null);
    const [activeCombo, setActiveCombo] = useState(0);
    const [step, setStep] = useState<StylerStep>('input');
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [clarifyingQuestions, setClarifyingQuestions] = useState<GenerateClarifyingQuestionsOutput | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [additionalNotes, setAdditionalNotes] = useState('');

    const handleGetClarifyingQuestions = async () => {
        if (!occasion) return;
        setIsLoadingQuestions(true);
        setClarifyingQuestions(null);
        setSelectedAnswers({});
        setAdditionalNotes('');
        try {
            const questions = await generateClarifyingQuestions({ occasion });
            setClarifyingQuestions(questions);
            setStep('clarify');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to generate questions. Generating fits directly..." });
            // Fallback: skip to generating fits directly
            handleGenerateFit();
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    const buildClarifyingContext = (): string | undefined => {
        const parts: string[] = [];
        if (clarifyingQuestions?.questions) {
            for (const q of clarifyingQuestions.questions) {
                const answer = selectedAnswers[q.id];
                if (answer) {
                    parts.push(`${q.question}: ${answer}`);
                }
            }
        }
        if (additionalNotes.trim()) {
            parts.push(`Additional preference: ${additionalNotes.trim()}`);
        }
        return parts.length > 0 ? parts.join('. ') : undefined;
    };

    const handleGenerateFit = async () => {
        if (!occasion) return;
        setIsGeneratingFit(true);
        setFitSuggestions(null);
        setActiveCombo(0);
        setStep('results');
        try {
            const aiClosetItems = closetItems.map((item: any) => ({ name: item.name, tags: item.tags }));
            const context = buildClarifyingContext();
            const suggestions = await generateOutfitSuggestions({
                occasion,
                clarifyingContext: context,
                closetItems: aiClosetItems,
            });
            setFitSuggestions(suggestions);
            if (onFitGenerated) onFitGenerated();
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to generate fit." });
            setStep('clarify');
        } finally {
            setIsGeneratingFit(false);
        }
    };

    const handleStartOver = () => {
        setStep('input');
        setFitSuggestions(null);
        setClarifyingQuestions(null);
        setSelectedAnswers({});
        setAdditionalNotes('');
        setActiveCombo(0);
    };

    // Observe scroll position to update active combo index
    useEffect(() => {
        const container = carouselRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const cardWidth = container.offsetWidth;
            const index = Math.round(scrollLeft / cardWidth);
            setActiveCombo(index);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [fitSuggestions]);

    const combinations = fitSuggestions?.combinations ?? [];

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

                <div className="flex justify-center items-center h-10 relative">
                    <h2 className="text-lg font-bold">
                        {step === 'input' && "What's the occasion?"}
                        {step === 'clarify' && "Help me style you"}
                        {step === 'results' && "Your AI Fit"}
                    </h2>
                    {step === 'clarify' && <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700 max-w-[100px] truncate absolute right-0">{occasion}</Badge>}
                </div>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                {/* Step 1: Occasion Input */}
                {step === 'input' && (
                    <>
                        <Textarea
                            placeholder="e.g., Coffee date, Job interview, Night out..."
                            className="bg-white min-h-[100px]"
                            value={occasion}
                            onChange={(e) => setOccasion(e.target.value)}
                        />
                        <Button
                            onClick={handleGetClarifyingQuestions}
                            disabled={isLoadingQuestions || !occasion || closetItems.length < 3}
                            className="w-full h-12 text-lg"
                            style={{ backgroundColor: '#2563EB' }}
                        >
                            {isLoadingQuestions ? <LoaderCircle className="animate-spin" /> : (
                                <>Next <ArrowRight className="ml-2 h-5 w-5" /></>
                            )}
                        </Button>
                        {closetItems.length < 3 && <p className="text-xs text-center text-muted-foreground">Add at least 3 items to your closet (a top, a bottom, and footwear) to use the Styler.</p>}
                    </>
                )}

                {/* Step 2: Clarifying Questions */}
                {step === 'clarify' && clarifyingQuestions && (
                    <>
                        <p className="text-sm text-muted-foreground -mt-2">Tap to select (optional)</p>

                        <div className="space-y-5">
                            {clarifyingQuestions.questions.map((q) => (
                                <div key={q.id} className="space-y-2">
                                    <p className="font-medium text-sm">{q.emoji} {q.question}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {q.options.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => setSelectedAnswers(prev => ({
                                                    ...prev,
                                                    [q.id]: prev[q.id] === option ? '' : option,
                                                }))}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedAnswers[q.id] === option
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="space-y-2">
                                <p className="font-medium text-sm">💬 Anything else?</p>
                                <Input
                                    placeholder="e.g., I want to look trendy..."
                                    className="bg-white"
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleGenerateFit}
                                className="flex-1 h-12"
                            >
                                <SkipForward className="mr-2 h-4 w-4" /> Skip & Generate
                            </Button>
                            <Button
                                onClick={handleGenerateFit}
                                disabled={isGeneratingFit}
                                className="flex-1 h-12 text-lg"
                                style={{ backgroundColor: '#2563EB' }}
                            >
                                {isGeneratingFit ? <LoaderCircle className="animate-spin" /> : '✨ Generate Fit'}
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 3: Results */}
                {step === 'results' && (
                    <>
                        {isGeneratingFit && !fitSuggestions && (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <LoaderCircle className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Curating your perfect outfits...</p>
                            </div>
                        )}

                        {combinations.length > 0 && (
                            <>
                                <div className="flex gap-3 -mt-2">
                                    <Button variant="outline" onClick={handleStartOver} className="flex-1 shrink-0 bg-white">
                                        New Occasion
                                    </Button>
                                </div>

                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Carousel Container */}
                                    <div className="relative w-full overflow-hidden">
                                        <div
                                            ref={carouselRef}
                                            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 gap-4"
                                            style={{ scrollBehavior: 'smooth' }}
                                        >
                                            {combinations.map((combo: any, idx: number) => (
                                                <div key={idx} className="snap-center shrink-0 w-full">
                                                    <Card className="bg-white overflow-hidden shadow-md border border-gray-100">
                                                        <div className="p-4 bg-primary/5 border-b border-primary/10 flex justify-between items-center">
                                                            <div>
                                                                <h3 className="font-bold text-lg">{combo.matchPercentage}% Match</h3>
                                                            </div>
                                                            <div className="h-8 px-3 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 shadow-sm text-sm">
                                                                {idx + 1}/{combinations.length}
                                                            </div>
                                                        </div>

                                                        <div className="p-4 space-y-4">
                                                            {combo.outfitSuggestions && combo.outfitSuggestions.map((suggestion: any) => {
                                                                const itemName = suggestion.name;
                                                                const layerType = suggestion.type;
                                                                if (!itemName || itemName === 'None') return null;

                                                                const itemData = closetItems.find((i: any) => i.name === itemName);

                                                                return (
                                                                    <div key={layerType} className="flex items-center gap-3">
                                                                        <div className="w-14 h-14 bg-gray-50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border">
                                                                            {itemData ? (
                                                                                <Image src={itemData.src} alt={itemName} width={56} height={56} className="object-cover" />
                                                                            ) : (
                                                                                <Shirt className="w-6 h-6 text-gray-300" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{layerType}</p>
                                                                            <p className="text-sm font-medium mt-0.5 truncate">{itemName}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* AI Rationale at bottom */}
                                                        {combo.aiRationale && (
                                                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                                                                <p className="text-xs text-muted-foreground italic leading-relaxed">
                                                                    💡 {combo.aiRationale}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </Card>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Dots Indicator */}
                                    {combinations.length > 1 && (
                                        <div className="flex justify-center gap-1.5 mt-2">
                                            {combinations.map((_: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className={`h-2 rounded-full transition-all duration-300 ${i === activeCombo ? 'w-6 bg-primary' : 'w-2 bg-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
