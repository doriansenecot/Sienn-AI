/**
 * Tooltip Component with Auto-positioning
 * Follows UX Strategy: 200ms delay, accessible with aria-describedby
 */
import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 200,
  disabled = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = 0;
    let left = 0;

    // Calculate position based on prop
    switch (position) {
      case "top":
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case "right":
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 8;
        break;
    }

    // Adjust if tooltip goes outside viewport
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) {
      left = padding;
    } else if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }

    if (top < padding) {
      top = triggerRect.bottom + 8; // Flip to bottom if top is cut off
    } else if (top + tooltipRect.height > viewportHeight - padding) {
      top = triggerRect.top - tooltipRect.height - 8; // Flip to top if bottom is cut off
    }

    setTooltipPosition({ top, left });
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-describedby={isVisible ? tooltipId.current : undefined}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible &&
        tooltipPosition &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId.current}
            role="tooltip"
            className={clsx(
              "fixed z-tooltip",
              "px-3 py-2 text-sm",
              "bg-gray-900 text-white rounded-lg",
              "border border-gray-700",
              "shadow-lg",
              "animate-fade-in",
              "pointer-events-none",
              "max-w-xs",
              className
            )}
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}

// Simplified tooltip for common use case
interface SimpleTooltipProps {
  text: string;
  children: ReactNode;
  position?: TooltipPosition;
}

export function SimpleTooltip({ text, children, position }: SimpleTooltipProps) {
  return (
    <Tooltip content={<span className="whitespace-nowrap">{text}</span>} position={position}>
      {children}
    </Tooltip>
  );
}
