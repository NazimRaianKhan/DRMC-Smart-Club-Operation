export default async function ForbiddenPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-heading font-bold text-[var(--danger)] mb-4">403 - Forbidden</h1>
      <p className="text-[var(--text-muted)] max-w-md">
        You don't have permission to access this page. Please log in with an account that has the required access.
      </p>
    </div>
  );
}

