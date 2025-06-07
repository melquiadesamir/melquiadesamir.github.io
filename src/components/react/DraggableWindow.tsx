import { useState, useRef, useEffect } from 'react';

// Global z-index counter
let globalZIndex = 10;

// Minimum window dimensions
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;

interface DraggableWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  className?: string;
}

export default function DraggableWindow({
  title,
  onClose,
  children,
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 300, height: 250 },
  className = '',
}: DraggableWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'bottom' | 'right' | 'bottom-right' | 'left' | 'bottom-left' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(globalZIndex);
  const [isMobile, setIsMobile] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const bringToFront = () => {
    globalZIndex += 1;
    setZIndex(globalZIndex);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    
    if (e.target instanceof HTMLElement) {
      bringToFront();

      if (e.target.closest('.window-header')) {
        setIsDragging(true);
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
        e.preventDefault();
      } else if (e.target.closest('.resize-handle')) {
        setIsResizing(true);
        setResizeDirection(e.target.getAttribute('data-direction') as 'bottom' | 'right' | 'bottom-right' | 'left' | 'bottom-left');
        e.preventDefault();
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isMobile) return;
    
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const windowWidth = windowRef.current?.offsetWidth || 0;
      const windowHeight = windowRef.current?.offsetHeight || 0;
      
      const maxX = window.innerWidth - (windowWidth / 1) -15;
      const maxY = window.innerHeight - (windowHeight / 2);
      const minX = -windowWidth / 2;
      const minY = 24 * 3;
      setPosition({
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY)),
      });
    } else if (isResizing) {
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        const newSize = { ...size };
        const newPosition = { ...position };
        
        if (resizeDirection?.includes('right')) {
          newSize.width = Math.max(MIN_WIDTH, e.clientX - rect.left);
        }
        
        if (resizeDirection?.includes('left')) {
          const newWidth = Math.max(MIN_WIDTH, rect.right - e.clientX);
          newSize.width = newWidth;
          newPosition.x = rect.right - newWidth;
        }
        
        if (resizeDirection?.includes('bottom')) {
          newSize.height = Math.max(MIN_HEIGHT, e.clientY - rect.top);
        }
        
        if (resizeDirection?.includes('bottom-left')) {
          const newWidth = Math.max(MIN_WIDTH, rect.right - e.clientX);
          newSize.width = newWidth;
          newPosition.x = rect.right - newWidth;
          newSize.height = Math.max(MIN_HEIGHT, e.clientY - rect.top);
        }
        
        setSize(newSize);
        setPosition(newPosition);
      }
    }
  };

  const handleMouseUp = () => {
    if (isMobile) return;
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  useEffect(() => {
    bringToFront();
    if (isMobile) return;
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, resizeDirection, dragOffset, isMobile]);

  return (
    <div
      ref={windowRef}
      className={`${
        isMobile 
          ? 'fixed inset-0 m-4 z-100' 
          : 'fixed  z-25'
      } shadow-xl bg-gray-900/80 overflow-hidden p-0 transition-all duration-300 ${
        isDragging ? 'cursor-grabbing' : 'cursor-default'
      } ${className}`}
      style={{
        ...(isMobile ? {} : {
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        }),
        // zIndex,
        transition: (isDragging || isResizing) ? 'none' : 'all 0.2s ease-out',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header pl-3 bg-blue-800 dark:bg-blue-950 h-6 flex items-center space-x-2 sticky top-0 left-0 right-0 z-200">
        <svg className='w-5 h-5' viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.792725 12.2929L5.08562 8.00002L0.792725 3.70712L2.20694 2.29291L7.91405 8.00002L2.20694 13.7071L0.792725 12.2929Z" fill="#000000"/>
<path d="M7.00006 15H15.0001V13H7.00006V15Z" fill="#000000"/>
</svg>
       <span className="text-sm text-gray-300 flex-grow  font-semibold">
          Terminal
          {/* {title} */}
        </span>
        <div className='flex gap-2'>
{/*         
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div> */}
        <button
          onClick={onClose}
          className="w-8 h-full text-gray-40 hover:bg-red-600 transition-colors flex items-center justify-center p-1"
        >
          <svg className='fill-current text-white' width="15px" height="15px" viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path className='fill-current text-white' d="M3 21.32L21 3.32001" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3 3.32001L21 21.32" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
          </button>
        </div>
        
      </div>
      <div className="relative h-[calc(100%-1.5rem)]">
        {children}
        {!isMobile && (
          <>
            <div 
              className="resize-handle borde absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
              data-direction="bottom"
            />
            <div 
              className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
              data-direction="right"
            />
            <div 
              className="resize-handle absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
              data-direction="left"
            />
            <div 
              className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
              data-direction="bottom-right"
            />
            <div 
              className="resize-handle borde absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize"
              data-direction="bottom-left"
            />
          </>
        )}
      </div>
    </div>
  );
} 