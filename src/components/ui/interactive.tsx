import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ tabs, activeTab, onChange, className }: { 
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex space-x-2 border-b border-border", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === tab.id
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text hover:border-border"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Dialog({ 
  open, 
  onClose, 
  children, 
  className 
}: { 
  open: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
  className?: string;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "backdrop:bg-bg/80 backdrop:backdrop-blur-sm open:animate-in open:fade-in-90 open:zoom-in-95 rounded-2xl border border-border bg-surface p-0 shadow-lg",
        className
      )}
    >
      <div className="p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-muted hover:text-text">
          &times;
        </button>
        {children}
      </div>
    </dialog>
  );
}
