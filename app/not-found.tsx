import Link from "next/link"

export default function NotFoundPage() {
  return (
    <section className="bg-primary px-6 pt-36 pb-24 text-primary-foreground lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-primary-foreground/10 bg-primary-foreground/5 p-10 text-center backdrop-blur-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">404</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-balance md:text-5xl">Aradığınız sayfa bulunamadı</h1>
        <p className="mt-4 text-base leading-relaxed text-primary-foreground/75">
          Bağlantı güncellenmiş olabilir ya da sayfa artık kullanılmıyor olabilir. Ana sayfaya dönebilir veya doğrudan
          hizmetleri inceleyebilirsiniz.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="rounded-full bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent-foreground transition-opacity hover:opacity-90"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/hizmetler"
            className="rounded-full border border-primary-foreground/20 px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            Hizmetleri İncele
          </Link>
        </div>
      </div>
    </section>
  )
}
