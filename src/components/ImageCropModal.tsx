import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Scissors, ZoomIn, ZoomOut, RotateCcw, 
  Sparkles, Check, Move, AlertCircle 
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  originalImageUrl?: string;
  initialPosition?: string;
  initialScale?: number;
  profileName: string;
  onApplyCrop: (result: {
    photoUrl: string;
    photoPosition: string;
    photoScale: number;
    originalPhotoUrl: string;
  }) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  originalImageUrl,
  initialPosition = 'center 20%',
  initialScale = 1.15,
  profileName,
  onApplyCrop,
}) => {
  // Parse initial position (e.g. "center 20%" -> panX: 50, panY: 20)
  const parsePosition = (posStr: string): { x: number; y: number } => {
    try {
      const parts = posStr.trim().split(/\s+/);
      let x = 50;
      let y = 20;

      if (parts[0]) {
        if (parts[0] === 'center') x = 50;
        else if (parts[0] === 'left') x = 15;
        else if (parts[0] === 'right') x = 85;
        else if (parts[0].endsWith('%')) x = parseFloat(parts[0]) || 50;
      }

      if (parts[1]) {
        if (parts[1] === 'center') y = 50;
        else if (parts[1] === 'top') y = 10;
        else if (parts[1] === 'bottom') y = 90;
        else if (parts[1].endsWith('%')) y = parseFloat(parts[1]) || 20;
      }

      return { x, y };
    } catch {
      return { x: 50, y: 20 };
    }
  };

  const initialParsed = parsePosition(initialPosition);
  const [panX, setPanX] = useState<number>(initialParsed.x);
  const [panY, setPanY] = useState<number>(initialParsed.y);
  const [scale, setScale] = useState<number>(initialScale || 1.15);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Active source image (can be current cropped or original)
  const effectiveSource = originalImageUrl || imageUrl;
  const [currentSource, setCurrentSource] = useState<string>(effectiveSource);

  // Drag state for interactive mouse/touch panning
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startPanX: number; startPanY: number }>({
    mouseX: 0,
    mouseY: 0,
    startPanX: 50,
    startPanY: 20,
  });

  // Reset values when modal opens
  useEffect(() => {
    if (isOpen) {
      const parsed = parsePosition(initialPosition);
      setPanX(parsed.x);
      setPanY(parsed.y);
      setScale(initialScale || 1.15);
      setCurrentSource(originalImageUrl || imageUrl);
      setFeedback(null);
      setIsProcessing(false);
    }
  }, [isOpen, initialPosition, initialScale, imageUrl, originalImageUrl]);

  if (!isOpen) return null;

  // Mouse & Touch Pan Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startPanX: panX,
      startPanY: panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    // Invert delta because dragging up reveals lower part (higher Y%)
    const sensitivity = 0.22 / Math.max(scale, 1);
    const newX = Math.min(100, Math.max(0, dragStartRef.current.startPanX - deltaX * sensitivity));
    const newY = Math.min(100, Math.max(0, dragStartRef.current.startPanY - deltaY * sensitivity));

    setPanX(Math.round(newX));
    setPanY(Math.round(newY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile / Touch screens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: touch.clientX,
        mouseY: touch.clientY,
        startPanX: panX,
        startPanY: panY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.mouseX;
    const deltaY = touch.clientY - dragStartRef.current.mouseY;

    const sensitivity = 0.25 / Math.max(scale, 1);
    const newX = Math.min(100, Math.max(0, dragStartRef.current.startPanX - deltaX * sensitivity));
    const newY = Math.min(100, Math.max(0, dragStartRef.current.startPanY - deltaY * sensitivity));

    setPanX(Math.round(newX));
    setPanY(Math.round(newY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Preset alignments
  const applyPreset = (preset: 'face-top' | 'upper-body' | 'center' | 'reset') => {
    if (preset === 'face-top') {
      setPanX(50);
      setPanY(15);
      setScale(1.25);
    } else if (preset === 'upper-body') {
      setPanX(50);
      setPanY(32);
      setScale(1.15);
    } else if (preset === 'center') {
      setPanX(50);
      setPanY(50);
      setScale(1.1);
    } else if (preset === 'reset') {
      setPanX(50);
      setPanY(20);
      setScale(1.0);
    }
  };

  // Save Permanently: Bakes canvas crop and saves permanently
  const handleSavePermanentCrop = async () => {
    setIsProcessing(true);
    setFeedback(null);

    const outWidth = 640;
    const outHeight = 880;
    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      applyFallbackAndClose();
      return;
    }

    try {
      let imageElement: CanvasImageSource;

      // Try modern fetch + createImageBitmap for automatic orientation handling
      if (currentSource.startsWith('data:') || currentSource.startsWith('/') || currentSource.startsWith(window.location.origin)) {
        try {
          const res = await fetch(currentSource);
          const blob = await res.blob();
          // Automatically handles EXIF rotation
          imageElement = await createImageBitmap(blob, { imageOrientation: 'from-image' });
        } catch {
          // Fallback to standard Image
          imageElement = await loadImage(currentSource);
        }
      } else {
        imageElement = await loadImage(currentSource);
      }

      const imgWidth = (imageElement as any).width;
      const imgHeight = (imageElement as any).height;

      // Calculate crop rectangle on source image
      const boxAspect = outWidth / outHeight; // ~0.727
      const imgAspect = imgWidth / imgHeight;

      let cropWidth: number;
      let cropHeight: number;

      if (imgAspect > boxAspect) {
        // Image is wider than crop box
        cropHeight = imgHeight / scale;
        cropWidth = cropHeight * boxAspect;
      } else {
        // Image is taller than crop box
        cropWidth = imgWidth / scale;
        cropHeight = cropWidth / boxAspect;
      }

      // Clamp max offsets
      const maxOffsetX = Math.max(0, imgWidth - cropWidth);
      const maxOffsetY = Math.max(0, imgHeight - cropHeight);

      const srcX = Math.max(0, Math.min(maxOffsetX, maxOffsetX * (panX / 100)));
      const srcY = Math.max(0, Math.min(maxOffsetY, maxOffsetY * (panY / 100)));

      // Draw high quality cropped region onto canvas
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        imageElement,
        srcX,
        srcY,
        cropWidth,
        cropHeight,
        0,
        0,
        outWidth,
        outHeight
      );

      // Convert to compressed high-quality JPEG
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      setFeedback('Cropped image created & saved permanently!');
      setTimeout(() => {
        onApplyCrop({
          photoUrl: croppedDataUrl,
          photoPosition: 'center 25%',
          photoScale: 1.0,
          originalPhotoUrl: originalImageUrl || currentSource,
        });
        setIsProcessing(false);
        onClose();
      }, 500);
    } catch {
      // In case CORS or canvas error occurs, gracefully save the position & scale
      applyFallbackAndClose();
    }
  };

  const applyFallbackAndClose = () => {
    onApplyCrop({
      photoUrl: currentSource,
      photoPosition: `${panX}% ${panY}%`,
      photoScale: scale,
      originalPhotoUrl: originalImageUrl || currentSource,
    });
    setIsProcessing(false);
    onClose();
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!src || !src.trim()) {
        reject(new Error('Image source is empty'));
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#140a24] border border-[#f7d59b]/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-left"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-[#1c0f33]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-[#f7d59b]/40 flex items-center justify-center bg-[#251242]">
              <Scissors className="w-4 h-4 text-[#f7d59b]" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg text-white font-medium">
                Photo Crop & Framing Studio · <span className="text-[#f7d59b] italic">{profileName}</span>
              </h3>
              <p className="text-[11px] text-purple-300/70 font-light">
                Position & crop into the official arched birthday card viewport
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)] space-y-6">
          {feedback && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Interactive Preview Canvas */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-4 flex flex-col items-center">
              {/* Subtle outer orbit ring */}
              <div className="absolute inset-0 rounded-full border border-[#f7d59b]/15 pointer-events-none scale-105" />

              {/* Exact Arched Frame matching Step 3 Card */}
              <div 
                className={`relative w-56 sm:w-64 h-80 sm:h-92 rounded-t-full rounded-b-3xl p-2 bg-gradient-to-b from-[#331c59]/80 to-[#180a2b]/95 border-2 border-[#f7d59b]/50 shadow-[0_0_30px_rgba(247,213,155,0.25)] flex flex-col items-center justify-between overflow-hidden select-none ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                title="Click and drag to pan image"
              >
                {/* Inner arched hairline border */}
                <div className="absolute inset-1.5 rounded-t-full rounded-b-2xl border border-[#f7d59b]/30 pointer-events-none z-10" />

                {/* Cropping viewport with image */}
                <div className="w-full h-full rounded-t-full rounded-b-2xl overflow-hidden relative bg-[#200f38] pointer-events-none">
                  {currentSource && currentSource.trim() !== '' ? (
                    <img
                      src={currentSource}
                      alt={profileName}
                      referrerPolicy="no-referrer"
                      style={{
                        objectPosition: `${panX}% ${panY}%`,
                        transform: `scale(${scale})`,
                      }}
                      className="w-full h-full object-cover transition-none select-none pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-purple-300 p-4 text-center">
                      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs">No image loaded</p>
                    </div>
                  )}

                  {/* Gradient scrim at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#140826] via-[#140826]/60 to-transparent pointer-events-none" />

                  {/* "TODAY'S STAR" pill preview */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <div className="px-3 py-0.5 rounded-full bg-[#180b2c]/85 border border-[#f7d59b]/40 backdrop-blur-md">
                      <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-[#f7d59b]">
                        Today's Star
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drag instruction badge */}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-300/70 font-light">
                <Move className="w-3.5 h-3.5 text-[#f7d59b]" />
                <span>Drag inside the arch to reposition, or use controls below</span>
              </div>
            </div>

            {/* Quick Alignment Presets */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <span className="text-[11px] uppercase tracking-wider text-purple-300/60 font-semibold mr-1">
                Presets:
              </span>
              <button
                type="button"
                onClick={() => applyPreset('face-top')}
                className="px-2.5 py-1 rounded-lg text-xs bg-purple-900/40 hover:bg-[#f7d59b] hover:text-[#140b24] text-purple-200 border border-purple-400/20 transition-all cursor-pointer font-medium"
              >
                Focus Face (Top 15%)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('upper-body')}
                className="px-2.5 py-1 rounded-lg text-xs bg-purple-900/40 hover:bg-[#f7d59b] hover:text-[#140b24] text-purple-200 border border-purple-400/20 transition-all cursor-pointer font-medium"
              >
                Upper Body (32%)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('center')}
                className="px-2.5 py-1 rounded-lg text-xs bg-purple-900/40 hover:bg-[#f7d59b] hover:text-[#140b24] text-purple-200 border border-purple-400/20 transition-all cursor-pointer font-medium"
              >
                Center (50%)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('reset')}
                className="px-2.5 py-1 rounded-lg text-xs bg-purple-900/40 hover:bg-rose-900/40 text-purple-200 hover:text-rose-200 border border-purple-400/20 transition-all cursor-pointer font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Slider Controls */}
          <div className="bg-[#1a0e30] p-4 sm:p-5 rounded-2xl border border-purple-500/20 space-y-4">
            {/* Zoom Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-purple-200 mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-[#f7d59b]" />
                  <span>Zoom / Scale</span>
                </span>
                <span className="font-mono text-[#f7d59b]">{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(1, Math.round((s - 0.05) * 100) / 100))}
                  className="p-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.02"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-[#f7d59b] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(2.5, Math.round((s + 0.05) * 100) / 100))}
                  className="p-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vertical Position (Pan Y) */}
            <div>
              <div className="flex items-center justify-between text-xs text-purple-200 mb-1.5 font-medium">
                <span>Vertical Position (Top to Bottom)</span>
                <span className="font-mono text-[#f7d59b]">{panY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={panY}
                onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                className="w-full accent-[#f7d59b] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-purple-300/50 mt-0.5">
                <span>0% (Head/Top)</span>
                <span>50% (Center)</span>
                <span>100% (Bottom)</span>
              </div>
            </div>

            {/* Horizontal Position (Pan X) */}
            <div>
              <div className="flex items-center justify-between text-xs text-purple-200 mb-1.5 font-medium">
                <span>Horizontal Position (Left to Right)</span>
                <span className="font-mono text-[#f7d59b]">{panX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={panX}
                onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                className="w-full accent-[#f7d59b] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-purple-300/50 mt-0.5">
                <span>0% (Left)</span>
                <span>50% (Centered)</span>
                <span>100% (Right)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-purple-500/20 bg-[#1c0f33]">
          <p className="text-[11px] text-purple-300/60 font-light text-center sm:text-left">
            Permanently crops & positions the photo directly in the arched birthday card.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-purple-400/30 text-xs font-semibold uppercase text-purple-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSavePermanentCrop}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f7d59b] via-[#e8be77] to-[#dca958] text-[#140b24] text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(247,213,155,0.3)] hover:brightness-105 active:scale-[0.99] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Cropping...' : 'Crop & Save Permanently'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
