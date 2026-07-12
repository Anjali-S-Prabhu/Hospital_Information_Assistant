/**
 * Modal Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a reusable confirmation/dialog modal used across the application
 * for actions like delete confirmations, success messages, and warnings.
 *
 * What it does:
 * - Renders a centered overlay with a modal card.
 * - Displays a title, descriptive message, and confirm/cancel action buttons.
 * - Supports customizable confirm button color variants (danger, primary, success).
 * - Closes when clicking the backdrop overlay or the cancel button.
 * - Animates in with a fade + scale transition.
 *
 * Inputs:
 * - isOpen (boolean): Controls modal visibility.
 * - title (string): The modal heading text.
 * - message (string): The descriptive body text.
 * - confirmLabel (string): Text for the confirm button (default: "Confirm").
 * - cancelLabel (string): Text for the cancel button (default: "Cancel").
 * - variant ("danger" | "primary" | "success"): Color scheme for the confirm button.
 * - onConfirm (() => void): Callback invoked when the confirm button is clicked.
 * - onCancel (() => void): Callback invoked when the cancel button or backdrop is clicked.
 *
 * Outputs:
 * - JSX.Element | null: The rendered modal or null when not open.
 */

import { type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "success";
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

/** Maps variant names to Tailwind background color classes. */
const variantStyles: Record<string, string> = {
  danger: "bg-danger-500 hover:bg-danger-600",
  primary: "bg-primary-500 hover:bg-primary-600",
  success: "bg-success-500 hover:bg-success-600",
};

export default function Modal({
  isOpen,
  title,
  message,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  danger,
  onConfirm,
  onCancel,
  onClose,
}: ModalProps) {
  if (!isOpen) return null;

  const handleCancel = onCancel || onClose || (() => {});
  const activeVariant = danger ? "danger" : variant;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>

        {/* Message / Children */}
        <div className="mb-6">
          {children ? (
            children
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer ${variantStyles[activeVariant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

