"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type ToastMessage = { id: string; message: string; type: "success" | "error" | "info" };

let addToastRef: (toast: Omit<ToastMessage, "id">) => void = () => {};

export function toast(message: string, type: ToastMessage["type"] = "info") {
  addToastRef({ message, type });
}

export function ToastProvider() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  React.useEffect(() => {
    addToastRef = (t) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { ...t, id }].slice(-3)); // Max 3
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5000); // 5s auto dismiss
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-md px-4 py-3 shadow-lg border transition-all animate-in slide-in-from-right-4",
            t.type === "error" ? "bg-danger text-white border-danger" :
            t.type === "success" ? "bg-success text-white border-success" :
            "bg-surface text-text border-border"
          )}
        >
          <p className="text-sm font-medium">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
