export default async function AdminPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold mb-6">Admin Dashboard</h1>
      <p className="text-[var(--text-muted)]">Placeholder for Admin Dashboard.</p>
    </div>
  );
}

