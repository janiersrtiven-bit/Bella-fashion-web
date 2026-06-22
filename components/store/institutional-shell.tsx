import Link from "next/link";

export function InstitutionalShell({
  eyebrow,
  title,
  content,
  children,
}: {
  eyebrow: string;
  title: string;
  content?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-purple-50 px-5 py-10 text-gray-900 sm:px-6 sm:py-16">
      <article className="mx-auto max-w-4xl rounded-[2rem] bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold text-purple-950 sm:text-4xl">{title}</h1>
        {content ? (
          <div className="mt-8 whitespace-pre-line text-base leading-8 text-gray-700">{content}</div>
        ) : (
          <div className="mt-8 rounded-2xl border border-purple-100 bg-purple-50 p-5 text-gray-700">
            Este conteúdo ainda não foi publicado pela administração da loja.
          </div>
        )}
        {children}
        <Link href="/" className="mt-10 inline-flex rounded-full bg-purple-900 px-6 py-3 font-semibold text-white transition hover:bg-purple-800">
          Voltar à loja
        </Link>
      </article>
    </main>
  );
}
