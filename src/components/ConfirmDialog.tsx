"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  danger?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  danger = false,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const reduceMotion = useReducedMotion();

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // Prevent scrolling behind the modal
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Dialog Card */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { 
                opacity: 0, 
                scale: reduceMotion ? 1 : 0.95, 
                y: reduceMotion ? 0 : 12 
              },
              visible: { 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } 
              },
              exit: { 
                opacity: 0, 
                scale: reduceMotion ? 1 : 0.96, 
                y: reduceMotion ? 0 : 8,
                transition: { duration: 0.15, ease: "easeIn" } 
              }
            }}
            className="relative w-full max-w-md bg-card border border-border-hairline rounded-xl shadow-xl p-6 sm:p-8 flex flex-col gap-6"
          >
            <div className="flex gap-4 items-start">
              {danger && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center text-error animate-pulse-slow">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-2">
                <h2 
                  id="confirm-dialog-title" 
                  className="font-serif text-xl sm:text-2xl text-foreground font-normal leading-tight"
                >
                  {title}
                </h2>
                <p 
                  id="confirm-dialog-description" 
                  className="text-xs sm:text-sm text-muted leading-relaxed font-sans"
                >
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 bg-background hover:bg-card-elevated border border-border-hairline rounded-md text-xs font-mono text-muted hover:text-foreground transition-all duration-200 cursor-pointer text-center sm:w-auto w-full"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2.5 rounded-md text-xs font-mono font-bold transition-all duration-200 cursor-pointer text-center sm:w-auto w-full ${
                  danger
                    ? "bg-error text-white hover:bg-error/90"
                    : "bg-primary text-white hover:bg-primary-hover"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
