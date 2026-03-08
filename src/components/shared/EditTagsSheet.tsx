import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export const EditTagsSheet = ({ item, open, onOpenChange, onSave }: { item: any, open: boolean, onOpenChange: (open: boolean) => void, onSave: (tags: string[]) => void }) => {
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (item) {
            setTags(item.tags);
        }
    }, [item]);

    if (!item) return null;

    const handleAddTag = () => {
        if (newTag.trim() === '') return;
        const formattedTag = newTag.trim().startsWith('#')
            ? newTag.trim().toUpperCase()
            : `#${newTag.trim().toUpperCase()}`;

        if (!tags.includes(formattedTag)) {
            setTags([...tags, formattedTag]);
            setNewTag('');
        } else {
            toast({
                variant: 'destructive',
                title: 'Tag already exists',
            })
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSaveClick = () => {
        onSave(tags);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-lg max-w-sm mx-auto">
                <SheetHeader className="text-left">
                    <SheetTitle>Edit Tags</SheetTitle>
                    <SheetDescription>Add or remove tags for {item.name}.</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                    <div className="flex gap-4 items-start">
                        <Image src={item.src} alt={item.name} width={80} height={80} className="rounded-md bg-gray-100 object-contain" />
                        <div className="flex flex-wrap gap-2 items-start self-start flex-1">
                            {tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-primary border-primary/50 bg-primary/10 relative group text-sm font-medium">
                                    {tag}
                                    <button onClick={() => handleRemoveTag(tag)} className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                            {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags yet.</p>}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="editNewTag" className="text-xs font-medium text-muted-foreground">ADD A TAG</Label>
                        <div className="flex gap-2 mt-1">
                            <Input id="editNewTag" placeholder="e.g. #SUMMER" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()} />
                            <Button onClick={handleAddTag}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                        </div>
                    </div>
                </div>
                <SheetFooter className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSaveClick}>Save Changes</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
