import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  icon?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  icon = false,
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const triggerRect = trigger.getBoundingClientRect();
      
      // Oblicz pozycję tooltipa na podstawie pozycji triggera
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = triggerRect.top - tooltip.offsetHeight - 8;
          left = triggerRect.left + triggerRect.width / 2 - tooltip.offsetWidth / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + triggerRect.width / 2 - tooltip.offsetWidth / 2;
          break;
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltip.offsetHeight / 2;
          left = triggerRect.left - tooltip.offsetWidth - 8;
          break;
        case 'right':
          top = triggerRect.top + triggerRect.height / 2 - tooltip.offsetHeight / 2;
          left = triggerRect.right + 8;
          break;
      }
      
      // Adjust position if tooltip goes off screen
      if (left + tooltip.offsetWidth > window.innerWidth) {
        left = window.innerWidth - tooltip.offsetWidth - 10;
      }
      if (left < 10) {
        left = 10;
      }
      if (top + tooltip.offsetHeight > window.innerHeight) {
        top = window.innerHeight - tooltip.offsetHeight - 10;
      }
      if (top < 10) {
        top = 10;
      }
      
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    }
  }, [isVisible, position]);

  const arrowClasses: Record<'top' | 'bottom' | 'left' | 'right', string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 dark:border-t-slate-700 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 dark:border-b-slate-700 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 dark:border-l-slate-700 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 dark:border-r-slate-700 border-t-transparent border-b-transparent border-l-transparent',
  };

  const renderTooltip = () => {
    if (!isVisible) return null;

    return createPortal(
      <div
        ref={tooltipRef}
        className="fixed z-[9999] px-4 py-2 text-xs text-white dark:text-slate-100 bg-gray-800 dark:bg-slate-700 rounded-lg shadow-lg max-w-xs pointer-events-none"
        role="tooltip"
        style={{ top: 0, left: 0 }}
      >
        {content}
        <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
      </div>,
      document.body
    );
  };

  if (icon) {
    return (
      <>
        <div ref={triggerRef} className="relative inline-block">
          <button
            type="button"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
            className="inline-flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 focus:outline-none focus:text-gray-600 dark:focus:text-slate-400"
            aria-label="Pomoc"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
        {renderTooltip()}
      </>
    );
  }

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="relative inline-block"
      >
        {children}
      </div>
      {renderTooltip()}
    </>
  );
};

export default Tooltip;

