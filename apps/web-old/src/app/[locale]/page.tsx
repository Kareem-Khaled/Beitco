import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-brand-500">
          🏠 {t('appName')}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t('tagline')}
        </p>
        <div className="mt-8 rounded-lg border bg-card p-6 text-start">
          <p className="text-sm text-muted-foreground">
            Status: ✅ Web app running
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Next step: Build auth flow
          </p>
        </div>
      </div>
    </main>
  );
}
