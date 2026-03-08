"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Shirt, Sparkles, RotateCcw, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { processClothingItem, type ProcessClothingItemOutput } from '@/ai/flows/process-clothing-item';
import { type GenerateOutfitSuggestionsOutput } from '@/ai/flows/generate-outfit-suggestions';
import { type GeneratePackingSuggestionsOutput } from '@/ai/flows/generate-packing-suggestions';
import placeholderImages from '@/app/lib/placeholder-images.json';

// Components
import { ClosetScreen } from '@/components/screens/ClosetScreen';
import { StylerScreen } from '@/components/screens/StylerScreen';
import { TripKitScreen } from '@/components/screens/TripKitScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { AddItemScreen } from '@/components/screens/AddItemScreen';
import { CameraModal } from '@/components/screens/CameraModal';
import { ImageCropper } from '@/components/shared/ImageCropper';
import { BottomNav, type Tab } from '@/components/shared/BottomNav';
import { EditTagsSheet } from '@/components/shared/EditTagsSheet';

const initialClosetItems = [
  { name: 'Blue Button-Up Shirt', tags: ['#BLUE', '#SHIRT', '#CASUAL', '#SMARTCASUAL'], src: placeholderImages.closet.shirt.src, hint: placeholderImages.closet.shirt.hint },
  { name: 'Black Chinos', tags: ['#BLACK', '#PANTS', '#CHINOS', '#SMARTCASUAL', '#FORMAL'], src: placeholderImages.closet.trousers.src, hint: placeholderImages.closet.trousers.hint },
  { name: 'White Leather Sneakers', tags: ['#WHITE', '#SNEAKERS', '#LEATHER', '#CASUAL', '#FOOTWEAR'], src: placeholderImages.closet.shoes.src, hint: placeholderImages.closet.shoes.hint },
  { name: 'Black Graphic Tee', tags: ['#BLACK', '#T-SHIRT', '#CASUAL', '#COTTON'], src: placeholderImages.closet.blackTee.src, hint: placeholderImages.closet.blackTee.hint },
  { name: 'White Crewneck Tee', tags: ['#WHITE', '#T-SHIRT', '#CASUAL', '#COTTON'], src: placeholderImages.closet.navyPolo.src, hint: placeholderImages.closet.navyPolo.hint },
  { name: 'Grey Hoodie', tags: ['#GREY', '#HOODIE', '#CASUAL', '#WINTER'], src: placeholderImages.closet.greyHoodie.src, hint: placeholderImages.closet.greyHoodie.hint },
  { name: 'Blue Denim Jeans', tags: ['#BLUE', '#JEANS', '#DENIM', '#CASUAL'], src: placeholderImages.closet.blueJeans.src, hint: placeholderImages.closet.blueJeans.hint },
  { name: 'Khaki Chinos', tags: ['#KHAKI', '#BEIGE', '#PANTS', '#CHINOS', '#CASUAL', '#SMARTCASUAL'], src: placeholderImages.closet.khakiChinos.src, hint: placeholderImages.closet.khakiChinos.hint },
  { name: 'Black Leather Jacket', tags: ['#BLACK', '#JACKET', '#LEATHER', '#OUTERWEAR', '#CASUAL'], src: placeholderImages.closet.leatherJacket.src, hint: placeholderImages.closet.leatherJacket.hint },
  { name: 'Olive Field Jacket', tags: ['#GREEN', '#OLIVE', '#JACKET', '#OUTERWEAR', '#UTILITY', '#CASUAL'], src: placeholderImages.closet.greenJacket.src, hint: placeholderImages.closet.greenJacket.hint },
  { name: 'Blue Denim Jacket', tags: ['#BLUE', '#JACKET', '#DENIM', '#OUTERWEAR', '#CASUAL'], src: placeholderImages.closet.denimJacket.src, hint: placeholderImages.closet.denimJacket.hint },
  { name: 'Brown Leather Boots', tags: ['#BROWN', '#BOOTS', '#LEATHER', '#FOOTWEAR', '#CASUAL'], src: placeholderImages.closet.brownBoots.src, hint: placeholderImages.closet.brownBoots.hint },
  { name: 'Brown Dress Shoes', tags: ['#BROWN', '#SHOES', '#FORMAL', '#LEATHER', '#FOOTWEAR', '#OFFICEWEAR'], src: placeholderImages.closet.brownShoes.src, hint: placeholderImages.closet.brownShoes.hint },
  { name: 'Black Running Sneakers', tags: ['#BLACK', '#SNEAKERS', '#SPORTS', '#CASUAL', '#FOOTWEAR'], src: placeholderImages.closet.blackSneakers.src, hint: placeholderImages.closet.blackSneakers.hint },
  { name: 'Green Running Shoe', tags: ['#GREEN', '#SNEAKERS', '#SPORTS', '#FOOTWEAR'], src: placeholderImages.closet.greenSneaker.src, hint: placeholderImages.closet.greenSneaker.hint },
  { name: 'White Crew Tee', tags: ['#WHITE', '#T-SHIRT', '#CASUAL', '#COTTON', '#SUMMER'], src: placeholderImages.closet.whiteTee.src, hint: placeholderImages.closet.whiteTee.hint },
  { name: 'Green Beanie', tags: ['#GREEN', '#BEANIE', '#ACCESSORIES', '#WINTER', '#CASUAL'], src: placeholderImages.closet.greyBeanie.src, hint: placeholderImages.closet.greyBeanie.hint },
  { name: 'Silver Watch', tags: ['#SILVER', '#WATCH', '#ACCESSORIES', '#FORMAL', '#SMARTCASUAL'], src: placeholderImages.closet.silverWatch.src, hint: placeholderImages.closet.silverWatch.hint },
];

export default function ClosetPilotPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('closet');
  const [closetItems, setClosetItems] = useState(initialClosetItems);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android/i.test(userAgent) || /iPhone|iPad|iPod/i.test(userAgent)) {
      setIsMobile(true);
    }
  }, []);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedItemData, setScannedItemData] = useState<ProcessClothingItemOutput & { originalPhoto: string } | null>(null);
  const [multiItemData, setMultiItemData] = useState<{ photo: string; items: string[] } | null>(null);
  const { toast } = useToast();

  // Gamification & Profile State
  const [totalCombosGenerated, setTotalCombosGenerated] = useState(0);
  const [userLocation, setUserLocation] = useState("Lucknow, India");
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');

  // Styler State
  const [occasion, setOccasion] = useState('');
  const [isGeneratingFit, setIsGeneratingFit] = useState(false);
  const [fitSuggestions, setFitSuggestions] = useState<GenerateOutfitSuggestionsOutput | null>(null);

  // Trip Kit State
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGeneratingTripKit, setIsGeneratingTripKit] = useState(false);
  const [tripSuggestions, setTripSuggestions] = useState<GeneratePackingSuggestionsOutput | null>(null);

  // Filter State
  const [activeFilters, setActiveFilters] = useState<{ categories: string[], colors: string[], weather: string[] }>({ categories: [], colors: [], weather: [] });

  // Item Action State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const applyFilters = (filters: { categories: string[], colors: string[], weather: string[] }) => {
    setActiveFilters(filters);
  };

  const categoryMapping = {
    'tops': ['#SHIRT', '#T-SHIRT', '#HOODIE', '#SWEATER', '#POLO', '#TURTLENECK'],
    'bottoms': ['#PANTS', '#CHINOS', '#JEANS', '#SHORTS', '#CARGO', '#CORDUROY'],
    'outerwear': ['#JACKET', '#BLAZER', '#COAT', '#OUTERWEAR', '#PUFFER'],
    'footwear': ['#SNEAKERS', '#SHOES', '#BOOTS', '#FOOTWEAR'],
    'accessories': ['#BEANIE', '#SCARF', '#WATCH', '#ACCESSORIES'],
  };

  const weatherMapping = {
    'cold': ['#JACKET', '#OUTERWEAR', '#COAT', '#HOODIE', '#THERMAL', '#BEANIE', '#SCARF', '#BOOTS', '#SWEATER', '#TURTLENECK', '#WINTER'],
    'hot': ['#LINEN', '#SHIRT', '#T-SHIRT', '#SUMMER', '#SHORTS'],
    'monsoon': ['#JACKET', '#WATER-RESISTANT', '#UTILITY', '#BOOTS'],
  };

  const categoryOptions = [
    { label: 'Tops', value: 'tops' },
    { label: 'Bottoms', value: 'bottoms' },
    { label: 'Outerwear', value: 'outerwear' },
    { label: 'Footwear', value: 'footwear' },
    { label: 'Accessories', value: 'accessories' }
  ];

  const availableColors = useMemo(() => {
    const predefinedColors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Brown', 'Gray', 'Beige', 'Purple', 'Pink', 'Orange', 'Navy', 'Olive', 'Khaki', 'Camel', 'Silver'];
    const colorTagsFromItems = closetItems.flatMap(item => item.tags)
      .filter(tag => !Object.values(categoryMapping).flat().includes(tag.toUpperCase()) && !Object.values(weatherMapping).flat().includes(tag.toUpperCase()) && !['#CASUAL', '#SMARTCASUAL', '#LEATHER', '#DENIM', '#LINEN', '#FORMAL', '#SPORTS', '#UTILITY', '#PLAID', '#OFFICEWEAR', '#COTTON'].includes(tag.toUpperCase()))
      .map(tag => tag.replace('#', ''))
      .map(color => color.charAt(0).toUpperCase() + color.slice(1).toLowerCase());

    const allColors = [...new Set([...predefinedColors, ...colorTagsFromItems])];
    return allColors.sort();
  }, [closetItems, categoryMapping]);

  const filteredClosetItems = useMemo(() => {
    const { categories, colors, weather } = activeFilters;

    if (categories.length === 0 && colors.length === 0 && weather.length === 0) {
      return closetItems;
    }

    return closetItems.filter(item => {
      const categoryMatch = categories.length === 0 || categories.some(category => {
        const categoryTags = categoryMapping[category as keyof typeof categoryMapping];
        if (!categoryTags) return false;
        return item.tags.some(tag => categoryTags.includes(tag.toUpperCase()));
      });

      const colorMatch = colors.length === 0 || colors.some(color =>
        item.tags.includes(`#${color.toUpperCase()}`)
      );

      const weatherMatch = weather.length === 0 || weather.some(weatherCondition => {
        const weatherTags = weatherMapping[weatherCondition as keyof typeof weatherMapping];
        if (!weatherTags) return false;
        return item.tags.some(tag => weatherTags.includes(tag.toUpperCase()));
      });

      return categoryMatch && colorMatch && weatherMatch;
    });
  }, [activeFilters, closetItems, categoryMapping, weatherMapping]);


  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const handleLogin = () => {
    if (loginEmail === 'pgp41511@iiml.ac.in' && loginPassword === 'Suyash_Dharaskar') {
      setIsLoggedIn(true);
    } else {
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or password. Please try again.' });
    }
  };

  const handleFabClick = () => {
    if (isMobile) {
      if (fileInputRef.current) fileInputRef.current.click();
    } else {
      setShowWebcamModal(true);
    }
  };

  const handleWebcamShutterClick = (photoDataUri: string) => {
    setShowWebcamModal(false);
    setCapturedPhoto(photoDataUri);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCapturedPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again if retaking
    e.target.value = '';
  };

  // Step 2: Crop done → process with AI
  const handleCropDone = async (croppedDataUri: string) => {
    setCapturedPhoto(null);
    setIsProcessing(true);
    setScannedItemData({
      originalPhoto: croppedDataUri,
      processedPhotoDataUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      itemName: 'Analyzing...',
      tags: [],
      multipleItemsDetected: false,
    });

    try {
      const result = await processClothingItem({ photoDataUri: croppedDataUri });

      // If multiple items detected, show selection UI
      if (result.multipleItemsDetected && result.detectedItems && result.detectedItems.length > 1) {
        setScannedItemData(null);
        setIsProcessing(false);
        setMultiItemData({ photo: croppedDataUri, items: result.detectedItems });
        return;
      }

      setScannedItemData({
        ...result,
        originalPhoto: croppedDataUri,
      });
    } catch (error) {
      console.error("AI processing failed:", error);
      toast({
        variant: "destructive",
        title: "AI Processing Failed",
        description: "Could not process the item. Please try again.",
      });
      setScannedItemData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3: Multi-item → user selects one item
  const handleSelectItem = async (selectedItemName: string) => {
    if (!multiItemData) return;
    setMultiItemData(null);
    setIsProcessing(true);
    setScannedItemData({
      originalPhoto: multiItemData.photo,
      processedPhotoDataUri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      itemName: 'Analyzing...',
      tags: [],
      multipleItemsDetected: false,
    });

    try {
      const result = await processClothingItem({
        photoDataUri: multiItemData.photo,
        selectedItemName,
      });
      setScannedItemData({
        ...result,
        originalPhoto: multiItemData.photo,
      });
    } catch (error) {
      console.error("AI processing failed:", error);
      toast({
        variant: "destructive",
        title: "AI Processing Failed",
        description: "Could not process the item. Please try again.",
      });
      setScannedItemData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetakeFromMultiItem = () => {
    setMultiItemData(null);
    if (isMobile) {
      if (fileInputRef.current) fileInputRef.current.click();
    } else {
      setShowWebcamModal(true);
    }
  };

  const handleRetakeFromCropper = () => {
    setCapturedPhoto(null);
    if (isMobile) {
      if (fileInputRef.current) fileInputRef.current.click();
    } else {
      setShowWebcamModal(true);
    }
  };

  const handleSaveItem = (newItem: { name: string; tags: string[]; src: string; hint: string; }) => {
    // Only append cache buster for HTTP URLs, not base64 data URIs
    const updatedSrc = newItem.src.startsWith('data:')
      ? newItem.src
      : `${newItem.src}?v=${new Date().getTime()}`;

    setClosetItems(prev => [{ ...newItem, src: updatedSrc }, ...prev]);
    setScannedItemData(null);
    toast({
      title: "Item Added!",
      description: `${newItem.name} has been added to your closet.`,
    });
  };

  const handleMoreClick = (item: any) => {
    setSelectedItem(item);
    setIsActionSheetOpen(true);
  };

  const handleConfirmRemove = () => {
    if (!selectedItem) return;
    const itemName = selectedItem.name;
    setClosetItems(prev => prev.filter(item => item.src !== selectedItem.src));
    setIsDeleteAlertOpen(false);

    // Radix UI bug fix: dialogs can leave `pointer-events: none` on <body>.
    // We clear the item state after animation AND force-reset body pointer-events.
    setTimeout(() => {
      setSelectedItem(null);
      document.body.style.pointerEvents = '';
    }, 350);

    toast({ title: 'Item Removed', description: `${itemName} has been removed.` });
  };

  const handleEditTags = () => {
    setIsActionSheetOpen(false);
    setIsEditSheetOpen(true);
  };

  const handleSaveTags = (newTags: string[]) => {
    if (!selectedItem) return;
    setClosetItems(prevItems =>
      prevItems.map(item =>
        item.src === selectedItem.src ? { ...item, tags: newTags } : item
      )
    );
    setIsEditSheetOpen(false);
    setSelectedItem(null);
    toast({ title: "Tags Updated!" });
  };


  if (!isLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-between py-12 px-8" style={{ height: '100dvh', background: 'linear-gradient(180deg, #0B2545 0%, #13315C 40%, #2563EB 100%)' }}>
        <div />
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/20">
            <Shirt className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">ClosetPilot</h1>
          <p className="text-white/70 text-sm flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> AI-Powered Digital Wardrobe</p>
        </div>
        <div className="w-full space-y-3">
          <Input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-xl h-12 focus:bg-white/20" />
          <Input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-xl h-12 focus:bg-white/20" />
          <Button onClick={handleLogin} className="w-full h-12 text-lg rounded-xl font-semibold shadow-lg" style={{ backgroundColor: '#ffffff', color: '#0B2545' }}>Log In</Button>
        </div>
      </div>
    );
  }

  // Show cropper after camera capture
  if (capturedPhoto) {
    return (
      <div className="w-full max-w-md mx-auto bg-black flex flex-col relative overflow-hidden" style={{ height: '100dvh' }}>
        <ImageCropper
          imageSrc={capturedPhoto}
          onCropDone={handleCropDone}
          onRetake={handleRetakeFromCropper}
        />
      </div>
    );
  }

  // Show multi-item selection UI
  if (multiItemData) {
    return (
      <div className="w-full max-w-md mx-auto bg-background flex flex-col" style={{ height: '100dvh' }}>
        <div className="p-4 space-y-4 flex flex-col h-full">
          <header>
            <h2 className="text-2xl font-bold">Multiple Items Detected</h2>
            <p className="text-sm text-muted-foreground mt-1">We found more than one item in this photo. Which one would you like to add?</p>
          </header>

          <div className="flex-1 flex flex-col gap-3">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 relative">
              <img src={multiItemData.photo} alt="Captured" className="w-full h-full object-contain" />
            </div>

            <div className="space-y-2">
              {multiItemData.items.map((item, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full h-12 justify-start text-left text-base"
                  onClick={() => handleSelectItem(item)}
                >
                  <span className="mr-3 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">{idx + 1}</span>
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <Button variant="outline" onClick={handleRetakeFromMultiItem} className="w-full h-12">
            <RotateCcw className="mr-2 h-4 w-4" /> Retake Photo
          </Button>
        </div>
      </div>
    );
  }

  if (scannedItemData) {
    return (
      <div className="w-full max-w-md mx-auto bg-background flex flex-col relative overflow-hidden" style={{ height: '100dvh' }}>
        <AddItemScreen
          itemData={scannedItemData}
          isProcessing={isProcessing}
          onSave={handleSaveItem}
          onCancel={() => setScannedItemData(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-background flex flex-col relative" style={{ height: '100dvh' }}>
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'closet' && (
          <ClosetScreen
            closetItems={filteredClosetItems}
            totalItemsCount={closetItems.length}
            activeFilters={activeFilters}
            onApplyFilters={applyFilters}
            availableColors={availableColors}
            categoryOptions={categoryOptions}
            onItemMoreClick={handleMoreClick}
            onProfileClick={() => setActiveTab('profile')}
          />
        )}
        {activeTab === 'styler' && <StylerScreen {...{ occasion, setOccasion, isGeneratingFit, fitSuggestions, setIsGeneratingFit, setFitSuggestions, closetItems }} onProfileClick={() => setActiveTab('profile')} onFitGenerated={() => setTotalCombosGenerated(prev => prev + 1)} />}
        {activeTab === 'trip' && <TripKitScreen {...{ destination, setDestination, startDate, setStartDate, endDate, setEndDate, isGeneratingTripKit, tripSuggestions, setIsGeneratingTripKit, setTripSuggestions, closetItems, temperatureUnit }} onProfileClick={() => setActiveTab('profile')} />}
        {activeTab === 'profile' && (
          <ProfileScreen
            totalItemsCount={closetItems.length}
            totalCombosGenerated={totalCombosGenerated}
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            temperatureUnit={temperatureUnit}
            setTemperatureUnit={setTemperatureUnit}
            onLogout={() => {
              setIsLoggedIn(false);
              setActiveTab('closet');
            }}
          />
        )}
      </main>

      {activeTab === 'closet' && (
        <Button onClick={handleFabClick} className="fixed bottom-24 right-4 z-40 h-16 w-16 rounded-full shadow-lg" style={{ backgroundColor: '#2563EB', right: 'max(1rem, calc((100vw - 28rem) / 2 + 1rem))' }}>
          <Plus className="h-8 w-8 text-white" />
        </Button>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {showWebcamModal && (
        <CameraModal
          onShutterClick={handleWebcamShutterClick}
          onClose={() => setShowWebcamModal(false)}
        />
      )}

      {/* Custom Block-Safe Action Menu */}
      {isActionSheetOpen && selectedItem && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsActionSheetOpen(false)}>
          <div className="bg-background w-full rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mb-4" />
            <h3 className="text-xl font-bold mb-1">{selectedItem.name}</h3>
            <p className="text-muted-foreground text-sm mb-6">What would you like to do with this item?</p>

            <div className="grid gap-3">
              <Button variant="outline" className="h-14 justify-start text-base border-border" onClick={handleEditTags}>
                <Pencil className="mr-3 h-5 w-5 text-primary" /> Edit Tags
              </Button>
              <Button variant="outline" className="h-14 justify-start text-base border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                setIsActionSheetOpen(false);
                setIsDeleteAlertOpen(true);
              }}>
                <Trash2 className="mr-3 h-5 w-5" /> Remove Item
              </Button>
            </div>

            <Button variant="ghost" className="w-full mt-4 h-12" onClick={() => setIsActionSheetOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Custom Block-Safe Delete Dialog */}
      {isDeleteAlertOpen && selectedItem && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsDeleteAlertOpen(false)}>
          <div className="bg-background rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">Are you absolutely sure?</h3>
              <p className="text-muted-foreground">
                This will permanently remove <span className="font-medium text-foreground">'{selectedItem.name}'</span> from your closet. This action cannot be undone.
              </p>
            </div>
            <div className="bg-muted/50 p-4 border-t flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDeleteAlertOpen(false)} className="bg-background">Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmRemove}>Delete Item</Button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && <EditTagsSheet item={selectedItem} open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen} onSave={handleSaveTags} />}

    </div>
  );
}
