import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCw, Maximize2, Move } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title: string;
  description?: string;
}

interface Position {
  x: number;
  y: number;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageSrc, title, description }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset on open
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `spraystone-${title.toLowerCase().replace(/\s/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/96 backdrop-blur-md transition-all duration-300"
      style={{ animation: 'fade-in 0.3s ease-out' }}
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm group"
      >
        <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Toolbar */}
      <div className="absolute top-6 left-6 z-50 flex items-center space-x-2">
        <button
          onClick={handleZoomIn}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm group"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm group"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={handleRotate}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm group"
          title="Rotate"
        >
          <RotateCw className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
        </button>
        <button
          onClick={handleReset}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm group"
          title="Reset"
        >
          <Maximize2 className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={handleDownload}
          className="p-2.5 bg-green-600 hover:bg-green-700 rounded-lg transition-all backdrop-blur-sm group"
          title="Download"
        >
          <Download className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Zoom Indicator */}
      {zoom !== 1 && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
          <span className="text-white text-sm font-semibold">{Math.round(zoom * 100)}%</span>
        </div>
      )}

      {/* Modal Content */}
      <div
        className="relative max-w-[95vw] max-h-[90vh] m-4"
        style={{ animation: 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Container */}
        <div 
          className={`relative rounded-xl overflow-hidden shadow-2xl bg-black/20 backdrop-blur-sm ${isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
        >
          <img
            src={imageSrc}
            alt={title}
            className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain transition-all duration-300 ease-out select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transformOrigin: 'center center'
            }}
            draggable={false}
          />
          
          {/* Image Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pointer-events-none">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            {description && (
              <p className="text-gray-300 text-sm">{description}</p>
            )}
          </div>
        </div>

        {/* Hints */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-gray-400 text-xs flex items-center justify-center gap-2">
            <Move className="w-3 h-3" />
            {zoom > 1 ? 'Drag to pan' : 'Zoom in to pan'}
          </p>
          <p className="text-gray-500 text-xs">
            Click outside or press ESC to close
          </p>
        </div>
      </div>
    </div>
  );
};
