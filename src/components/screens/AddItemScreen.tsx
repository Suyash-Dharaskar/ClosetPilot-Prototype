import React, { useState, useEffect } from 'react';
import { X, LoaderCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { type ProcessClothingItemOutput } from '@/ai/flows/process-clothing-item';

export const AddItemScreen = ({ itemData, isProcessing, onSave, onCancel }: {
    itemData: ProcessClothingItemOutput & { originalPhoto: string };
    isProcessing: boolean;
    onSave: (newItem: { name: string; tags: string[]; src: string; hint: string; }) => void;
    onCancel: () => void;
}) => {
    const [name, setName] = useState('');
    const [currentTags, setCurrentTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (itemData && !isProcessing) {
            setName(itemData.itemName);
            setCurrentTags(itemData.tags);
        }
    }, [itemData, isProcessing]);

    const handleAddTag = () => {
        if (newTag.trim() === '') return;
        const formattedTag = newTag.trim().startsWith('#')
            ? newTag.trim().toUpperCase()
            : `#${newTag.trim().toUpperCase()}`;

        if (!currentTags.includes(formattedTag)) {
            setCurrentTags([...currentTags, formattedTag]);
            setNewTag('');
        } else {
            toast({
                variant: 'destructive',
                title: 'Tag already exists',
            })
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Item name is required',
            })
            return;
        }
        onSave({
            name,
            tags: currentTags,
            src: itemData.processedPhotoDataUri,
            hint: name, // Use item name as hint
        });
    };

    const displayImage = isProcessing ? itemData.originalPhoto : itemData.processedPhotoDataUri;

    return (
        <div className="p-4 space-y-2 flex flex-col h-full bg-white z-50 absolute inset-0">
            <header className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Add New Item</h2>
                <Button variant="ghost" size="icon" onClick={onCancel}>
                    <X className="h-6 w-6" />
                </Button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Card className="w-full aspect-square relative overflow-hidden shadow-lg bg-gray-100">
                    {isProcessing ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black/50 text-white p-4">
                            <LoaderCircle className="w-12 h-12 animate-spin mb-4" />
                            <p className="text-lg font-medium">AI is analyzing your item...</p>
                            <p className="text-sm text-white/80 text-center">Removing background & generating tags.</p>
                        </div>
                    ) : null}
                    <Image src={displayImage} alt={name} fill style={{ objectFit: "contain" }} />
                </Card>
            </div>

            <div className="space-y-3">
                <div>
                    <Label htmlFor="itemName" className="text-xs font-medium text-muted-foreground">ITEM NAME</Label>
                    <Input id="itemName" value={name} onChange={(e) => setName(e.target.value)} disabled={isProcessing} className="bg-gray-100" />
                </div>

                <div>
                    <Label className="text-xs font-medium text-muted-foreground">TAGS</Label>
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[2.5rem]">
                        {!isProcessing && currentTags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-primary border-primary/50 bg-primary/10 relative group text-sm font-medium">
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className="absolute -top-1 -right-1 bg-gray-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>

                {!isProcessing && (
                    <div className="animate-in fade-in duration-500">
                        <Label htmlFor="newTag" className="text-xs font-medium text-muted-foreground">ADD A TAG</Label>
                        <div className="flex gap-2 mt-1">
                            <Input id="newTag" placeholder="e.g. #SUMMER" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()} />
                            <Button onClick={handleAddTag}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-2 pb-1">
                <Button onClick={handleSave} className="w-full h-12 text-lg" disabled={isProcessing}>
                    {isProcessing ? <LoaderCircle className="animate-spin" /> : 'Save to Closet'}
                </Button>
            </div>
        </div>
    );
};
