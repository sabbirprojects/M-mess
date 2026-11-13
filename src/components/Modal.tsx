import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Optional fixed footer. When omitted, actions can live inside children. */
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  size?: ModalSize;
  panelClassName?: string;
  bodyClassName?: string;
  closeLabel?: string;
  showCloseButton?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal primitive built on the native <dialog> element.
 *
 * Native showModal() provides Esc handling, background inertness and a solid
 * focus baseline. We add backdrop-click closing, an explicit accessible close
 * button, body scroll locking, focus restoration and a defensive Tab loop.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  icon,
  size = 'md',
  panelClassName = '',
  bodyClassName = '',
  closeLabel = 'Close dialog',
  showCloseButton = true,
  initialFocusRef,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const reactId = useId();
  const titleId = `modal-title-${reactId}`;
  const descriptionId = `modal-description-${reactId}`;

  // Keep the native dialog in sync with React state.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          // If the dialog is already open non-modally, promote it.
          dialog.setAttribute('open', '');
        }
      }

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');

      const focusTimer = window.requestAnimationFrame(() => {
        const target =
          initialFocusRef?.current ||
          dialog.querySelector<HTMLElement>('[data-autofocus]') ||
          dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        target?.focus();
      });

      return () => {
        window.cancelAnimationFrame(focusTimer);
        document.body.style.overflow = previousOverflow;
        document.body.classList.remove('modal-open');
        if (dialog.open) dialog.close();
        const previous = previouslyFocusedRef.current;
        if (previous && document.contains(previous)) {
          window.requestAnimationFrame(() => previous.focus());
        }
      };
    }

    if (dialog.open) dialog.close();
    return undefined;
  }, [isOpen, initialFocusRef]);

  // Esc / platform cancel key. Native cancel would close the element without
  // telling React, so intercept it and let the owner update state.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Defensive focus containment for browsers/assistive tech that do not
  // fully honour native modal focus semantics.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = (
      Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[]
    ).filter(element => element.offsetParent !== null || element === document.activeElement);

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      className="modal-shell fixed inset-0 z-[80] m-0 h-full w-full max-w-none items-center justify-center p-3 sm:p-4 open:flex"
    >
      <div
        onClick={event => event.stopPropagation()}
        className={`relative mx-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 sm:max-h-[90dvh] ${SIZE_CLASSES[size]} ${panelClassName}`}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-2.5 top-2.5 z-10 flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#456C63] focus-visible:ring-offset-2 sm:h-9 sm:w-9"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {(title || description || icon) && (
          <div className="flex shrink-0 items-start gap-3 border-b border-gray-100 px-5 py-4 pr-16 sm:px-6">
            {icon}
            <div className="min-w-0 flex-1">
              {title && (
                <h2
                  id={titleId}
                  className="text-base font-bold leading-tight text-[#1A332C] sm:text-lg"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-0.5 text-xs text-gray-600">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 ${bodyClassName}`}
        >
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
};
