'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Crop, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CropRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const ImageCropper = ({
    imageSrc,
    onCropDone,
    onRetake,
}: {
    imageSrc: string;
    onCropDone: (croppedDataUri: string) => void;
    onRetake: () => void;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [imgDisplay, setImgDisplay] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

    // Crop region as percentages (0-1) of the displayed image
    const [crop, setCrop] = useState<CropRegion>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
    const [dragging, setDragging] = useState<string | null>(null);
    const dragStartRef = useRef({ x: 0, y: 0, crop: { x: 0, y: 0, width: 0, height: 0 } });

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const onImageLoad = useCallback(() => {
        if (!imageRef.current || !containerRef.current) return;
        const img = imageRef.current;
        const cont = containerRef.current;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const contRatio = cont.clientWidth / cont.clientHeight;
        let dw: number, dh: number, ox: number, oy: number;
        if (imgRatio > contRatio) {
            dw = cont.clientWidth;
            dh = dw / imgRatio;
            ox = 0;
            oy = (cont.clientHeight - dh) / 2;
        } else {
            dh = cont.clientHeight;
            dw = dh * imgRatio;
            ox = (cont.clientWidth - dw) / 2;
            oy = 0;
        }
        setImgDisplay({ width: dw, height: dh, offsetX: ox, offsetY: oy });
        setImageLoaded(true);
        setContainerSize({ width: cont.clientWidth, height: cont.clientHeight });
    }, []);

    // Convert crop percentages to pixel positions on the container
    const cropPx = {
        x: imgDisplay.offsetX + crop.x * imgDisplay.width,
        y: imgDisplay.offsetY + crop.y * imgDisplay.height,
        w: crop.width * imgDisplay.width,
        h: crop.height * imgDisplay.height,
    };

    const getPointerPos = (e: React.PointerEvent | PointerEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const pxToPercent = (px: { x: number; y: number }) => ({
        x: (px.x - imgDisplay.offsetX) / imgDisplay.width,
        y: (px.y - imgDisplay.offsetY) / imgDisplay.height,
    });

    const clampCrop = (c: CropRegion): CropRegion => ({
        x: Math.max(0, Math.min(c.x, 1 - c.width)),
        y: Math.max(0, Math.min(c.y, 1 - c.height)),
        width: Math.max(0.05, Math.min(c.width, 1 - c.x)),
        height: Math.max(0.05, Math.min(c.height, 1 - c.y)),
    });

    const handlePointerDown = useCallback((handle: string) => (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(handle);
        const pos = getPointerPos(e);
        dragStartRef.current = { x: pos.x, y: pos.y, crop: { ...crop } };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [crop, imgDisplay]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging) return;
        const pos = getPointerPos(e);
        const dx = (pos.x - dragStartRef.current.x) / imgDisplay.width;
        const dy = (pos.y - dragStartRef.current.y) / imgDisplay.height;
        const sc = dragStartRef.current.crop;

        let newCrop = { ...sc };

        switch (dragging) {
            case 'move':
                newCrop.x = sc.x + dx;
                newCrop.y = sc.y + dy;
                break;
            case 'tl':
                newCrop.x = sc.x + dx; newCrop.y = sc.y + dy;
                newCrop.width = sc.width - dx; newCrop.height = sc.height - dy;
                break;
            case 'tr':
                newCrop.y = sc.y + dy;
                newCrop.width = sc.width + dx; newCrop.height = sc.height - dy;
                break;
            case 'bl':
                newCrop.x = sc.x + dx;
                newCrop.width = sc.width - dx; newCrop.height = sc.height + dy;
                break;
            case 'br':
                newCrop.width = sc.width + dx; newCrop.height = sc.height + dy;
                break;
            case 'top':
                newCrop.y = sc.y + dy; newCrop.height = sc.height - dy;
                break;
            case 'bottom':
                newCrop.height = sc.height + dy;
                break;
            case 'left':
                newCrop.x = sc.x + dx; newCrop.width = sc.width - dx;
                break;
            case 'right':
                newCrop.width = sc.width + dx;
                break;
        }

        setCrop(clampCrop(newCrop));
    }, [dragging, imgDisplay]);

    const handlePointerUp = useCallback(() => {
        setDragging(null);
    }, []);

    const handleCropDone = () => {
        if (!imageRef.current) return;
        const img = imageRef.current;
        const canvas = document.createElement('canvas');
        const sx = crop.x * img.naturalWidth;
        const sy = crop.y * img.naturalHeight;
        const sw = crop.width * img.naturalWidth;
        const sh = crop.height * img.naturalHeight;
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            onCropDone(canvas.toDataURL('image/jpeg', 0.9));
        }
    };

    const handleSkip = () => onCropDone(imageSrc);

    const cornerStyle = 'absolute w-6 h-6 z-20';
    const edgeCommon = 'absolute z-20';

    return (
        <div className="bg-black z-50 absolute inset-0 flex flex-col">
            <header className="flex items-center justify-between p-4 text-white">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Crop className="w-5 h-5" /> Crop Image</h2>
            </header>

            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden select-none mx-4"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{ touchAction: 'none' }}
            >
                <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Captured"
                    className="absolute object-contain"
                    style={{
                        left: imgDisplay.offsetX,
                        top: imgDisplay.offsetY,
                        width: imgDisplay.width || '100%',
                        height: imgDisplay.height || '100%',
                    }}
                    onLoad={onImageLoad}
                    draggable={false}
                />

                {imageLoaded && (
                    <>
                        {/* Dark overlay outside crop region */}
                        <div className="absolute inset-0 pointer-events-none" style={{
                            background: `linear-gradient(to right, 
                rgba(0,0,0,0.6) ${cropPx.x}px, 
                transparent ${cropPx.x}px, 
                transparent ${cropPx.x + cropPx.w}px, 
                rgba(0,0,0,0.6) ${cropPx.x + cropPx.w}px)`,
                        }} />
                        <div className="absolute pointer-events-none" style={{
                            left: cropPx.x, top: 0, width: cropPx.w, height: cropPx.y,
                            background: 'rgba(0,0,0,0.6)',
                        }} />
                        <div className="absolute pointer-events-none" style={{
                            left: cropPx.x, top: cropPx.y + cropPx.h, width: cropPx.w, height: containerSize.height - cropPx.y - cropPx.h,
                            background: 'rgba(0,0,0,0.6)',
                        }} />

                        {/* Crop region border */}
                        <div
                            className="absolute border-2 border-white cursor-move"
                            style={{
                                left: cropPx.x, top: cropPx.y,
                                width: cropPx.w, height: cropPx.h,
                            }}
                            onPointerDown={handlePointerDown('move')}
                        >
                            {/* Grid lines */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
                                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
                                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
                                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
                            </div>
                        </div>

                        {/* Corner handles */}
                        <div className={cornerStyle} style={{ left: cropPx.x - 8, top: cropPx.y - 8, cursor: 'nwse-resize' }} onPointerDown={handlePointerDown('tl')}>
                            <div className="border-t-[3px] border-l-[3px] border-white w-full h-full rounded-tl-sm" />
                        </div>
                        <div className={cornerStyle} style={{ left: cropPx.x + cropPx.w - 16, top: cropPx.y - 8, cursor: 'nesw-resize' }} onPointerDown={handlePointerDown('tr')}>
                            <div className="border-t-[3px] border-r-[3px] border-white w-full h-full rounded-tr-sm" />
                        </div>
                        <div className={cornerStyle} style={{ left: cropPx.x - 8, top: cropPx.y + cropPx.h - 16, cursor: 'nesw-resize' }} onPointerDown={handlePointerDown('bl')}>
                            <div className="border-b-[3px] border-l-[3px] border-white w-full h-full rounded-bl-sm" />
                        </div>
                        <div className={cornerStyle} style={{ left: cropPx.x + cropPx.w - 16, top: cropPx.y + cropPx.h - 16, cursor: 'nwse-resize' }} onPointerDown={handlePointerDown('br')}>
                            <div className="border-b-[3px] border-r-[3px] border-white w-full h-full rounded-br-sm" />
                        </div>

                        {/* Edge handles */}
                        <div className={edgeCommon} style={{ left: cropPx.x + 24, top: cropPx.y - 4, width: cropPx.w - 48, height: 8, cursor: 'ns-resize' }} onPointerDown={handlePointerDown('top')} />
                        <div className={edgeCommon} style={{ left: cropPx.x + 24, top: cropPx.y + cropPx.h - 4, width: cropPx.w - 48, height: 8, cursor: 'ns-resize' }} onPointerDown={handlePointerDown('bottom')} />
                        <div className={edgeCommon} style={{ left: cropPx.x - 4, top: cropPx.y + 24, width: 8, height: cropPx.h - 48, cursor: 'ew-resize' }} onPointerDown={handlePointerDown('left')} />
                        <div className={edgeCommon} style={{ left: cropPx.x + cropPx.w - 4, top: cropPx.y + 24, width: 8, height: cropPx.h - 48, cursor: 'ew-resize' }} onPointerDown={handlePointerDown('right')} />
                    </>
                )}
            </div>

            <div className="flex gap-3 p-4">
                <Button variant="outline" onClick={onRetake} className="flex-1 h-12 text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white">
                    <RotateCcw className="mr-2 h-4 w-4" /> Retake
                </Button>
                <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white">
                    Skip Crop
                </Button>
                <Button onClick={handleCropDone} className="flex-1 h-12" style={{ backgroundColor: '#2563EB' }}>
                    <Check className="mr-2 h-4 w-4" /> Crop
                </Button>
            </div>
        </div>
    );
};
