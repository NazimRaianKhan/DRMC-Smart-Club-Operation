export default async function ProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold mb-6">My Profile</h1>
      <p className="text-[var(--text-muted)]">Placeholder for Profile page.</p>
    </div>
  );
}

