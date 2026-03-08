import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const CameraModal = ({ onShutterClick, onClose }: { onShutterClick: (dataUri: string) => void, onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isStartingCamera = useRef(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(true);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const { toast } = useToast();

    const stopCamera = useCallback(() => {
        // 1. Stop the stream explicitly tracked by this component instance
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
                track.stop();
            });
            streamRef.current = null;
        }

        // 2. Aggressively hunt down any orphaned streams from React Strict Mode double-mounts
        const globalStreams = (window as any).activeCameraStreams || [];
        globalStreams.forEach((stream: MediaStream) => {
            stream.getTracks().forEach((track: MediaStreamTrack) => {
                track.stop();
            });
        });
        (window as any).activeCameraStreams = [];

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    useEffect(() => {
        const getCameraPermission = async () => {
            // Prevent overlapping calls in strict mode
            if (isStartingCamera.current) return;
            isStartingCamera.current = true;

            // Stop existing stream if we are switching cameras
            stopCamera();

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast({
                    variant: "destructive",
                    title: "Camera Not Supported",
                    description: "Your browser does not support camera access.",
                });
                setHasCameraPermission(false);
                isStartingCamera.current = false;
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode }
                });

                streamRef.current = stream;

                // Track globally to catch Strict Mode orphans
                if (!(window as any).activeCameraStreams) {
                    (window as any).activeCameraStreams = [];
                }
                (window as any).activeCameraStreams.push(stream);

                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error("Error accessing camera:", error);
                setHasCameraPermission(false);
                toast({
                    variant: "destructive",
                    title: "Camera Access Denied",
                    description: "Please enable camera permissions in your browser settings.",
                });
            } finally {
                isStartingCamera.current = false;
            }
        };

        getCameraPermission();

        return () => {
            stopCamera();
        };
    }, [facingMode, toast, stopCamera]);

    const handleShutterPress = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            // If using the front camera, we need to flip the image horizontally on the canvas
            if (facingMode === 'user') {
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
            }
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL('image/jpeg');
            stopCamera();
            onShutterClick(dataUri);
        }
    };

    const handleClose = () => {
        // Force synchronous stop before React triggers unmount
        stopCamera();
        setTimeout(onClose, 10);
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    return (
        <div className="bg-black/90 z-50 absolute inset-0 flex flex-col p-4 text-white">
            <header className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Camera className="w-5 h-5" /> Add New Item
                </h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleCamera} className="text-white hover:bg-white/20 rounded-full" title="Flip Camera">
                        <RefreshCcw className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20 rounded-full">
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-4">
                <div className="w-full aspect-square relative border-2 border-dashed border-gray-500 rounded-2xl flex items-center justify-center overflow-hidden bg-black">
                    <div className="absolute top-0 left-0 border-t-4 border-l-4 border-white h-8 w-8 rounded-tl-xl z-10"></div>
                    <div className="absolute top-0 right-0 border-t-4 border-r-4 border-white h-8 w-8 rounded-tr-xl z-10"></div>
                    <div className="absolute bottom-0 left-0 border-b-4 border-l-4 border-white h-8 w-8 rounded-bl-xl z-10"></div>
                    <div className="absolute bottom-0 right-0 border-b-4 border-r-4 border-white h-8 w-8 rounded-br-xl z-10"></div>

                    <video
                        ref={videoRef}
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                        autoPlay
                        playsInline
                        muted
                    />

                    {!hasCameraPermission && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-center p-4 z-20">
                            <Camera className="w-12 h-12 mb-4 text-zinc-500" />
                            <p className="font-semibold text-zinc-300">Camera access denied</p>
                            <p className="text-sm text-zinc-500 mt-2">Enable camera access in settings to continue.</p>
                        </div>
                    )}
                </div>
                <p className="text-sm text-white/70 text-center font-medium">Center your item and press the shutter.</p>
            </div>
            <div className="flex flex-col items-center justify-center py-6 pb-10">
                <button onClick={handleShutterPress} disabled={!hasCameraPermission} className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-white/20">
                    <div className='w-[60px] h-[60px] rounded-full border-[3px] border-black'></div>
                </button>
            </div>
        </div>
    );
};
