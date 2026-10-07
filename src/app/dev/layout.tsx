import "@/app/globals.css";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
