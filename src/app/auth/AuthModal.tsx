import { useEffect, useRef } from "react";
import AuthForm from "./AuthForm";
import styles from "./AuthForm.module.css";

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Trap focus inside modal
  useEffect(() => {
    if (!open) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'input, button, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) focusable[0].focus();
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", trap);
    return () => window.removeEventListener("keydown", trap);
  }, [open]);

  if (!open) return null;
  return (
    <div className={styles.authModalOverlay} onClick={onClose}>
      <div
        ref={modalRef}
        style={{ minWidth: 320, maxWidth: 380, width: "90vw" }}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        <AuthForm onSuccess={onClose} />
      </div>
    </div>
  );
} 