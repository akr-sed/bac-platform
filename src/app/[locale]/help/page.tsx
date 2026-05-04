import { getTranslations } from 'next-intl/server';
import { FaqAccordion } from '@/components/help/FaqAccordion';
import { ContactForm } from '@/components/help/ContactForm';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'help' });
  return { title: t('title') };
}

const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export default async function HelpPage({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'help' });

  const faqItems = FAQ_KEYS.map((n) => ({
    question: t(`faq.q${n}` as 'faq.q1'),
    answer: t(`faq.a${n}` as 'faq.a1'),
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="font-extrabold text-4xl text-[#003449]">{t('title')}</h1>
        <p className="mt-3 text-base text-[#6D7D8B]">{t('subtitle')}</p>
      </div>

      {/* FAQ Accordion */}
      <section className="mb-16">
        <FaqAccordion items={faqItems} />
      </section>

      {/* Contact Form */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="font-extrabold text-2xl text-[#003449]">{t('contactTitle')}</h2>
          <p className="mt-2 text-sm text-[#6D7D8B]">{t('contactSubtitle')}</p>
        </div>
        <div className="rounded-2xl border border-[#BBC8D4] bg-white p-6 sm:p-8">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
