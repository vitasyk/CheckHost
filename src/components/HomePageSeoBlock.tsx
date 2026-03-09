import { getSiteSetting } from '@/lib/site-settings';
import { useTranslations } from 'next-intl';

interface SeoContent {
  html: string;
  enabled: boolean;
  showDefault?: boolean;
}


// Default beautiful component (no custom HTML set in admin)
function DefaultSeoContent() {
  const t = useTranslations('HomePageSeoBlock');

  const TOOLS = [
    {
      name: t('tools.ping.name'),
      icon: '📡',
      measures: t('tools.ping.measures'),
      useCase: t('tools.ping.useCase'),
      checkSuffix: t('tools.ping.checkSuffix'),
      color: 'from-blue-500 to-cyan-500',
      lightBg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-100 dark:border-blue-900/40',
    },
    {
      name: t('tools.http.name'),
      icon: '🌐',
      measures: t('tools.http.measures'),
      useCase: t('tools.http.useCase'),
      checkSuffix: t('tools.http.checkSuffix'),
      color: 'from-violet-500 to-purple-500',
      lightBg: 'bg-violet-50 dark:bg-violet-950/30',
      border: 'border-violet-100 dark:border-violet-900/40',
    },
    {
      name: t('tools.dns.name'),
      icon: '🔍',
      measures: t('tools.dns.measures'),
      useCase: t('tools.dns.useCase'),
      checkSuffix: t('tools.dns.checkSuffix'),
      color: 'from-emerald-500 to-teal-500',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-100 dark:border-emerald-900/40',
    },
    {
      name: t('tools.mtr.name'),
      icon: '🛤️',
      measures: t('tools.mtr.measures'),
      useCase: t('tools.mtr.useCase'),
      checkSuffix: t('tools.mtr.checkSuffix'),
      color: 'from-orange-500 to-amber-500',
      lightBg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-100 dark:border-orange-900/40',
    },
    {
      name: t('tools.tcpUdp.name'),
      icon: '🔌',
      measures: t('tools.tcpUdp.measures'),
      useCase: t('tools.tcpUdp.useCase'),
      checkSuffix: t('tools.tcpUdp.checkSuffix'),
      color: 'from-rose-500 to-pink-500',
      lightBg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-100 dark:border-rose-900/40',
    },
    {
      name: t('tools.ipInfo.name'),
      icon: '🗺️',
      measures: t('tools.ipInfo.measures'),
      useCase: t('tools.ipInfo.useCase'),
      checkSuffix: t('tools.ipInfo.checkSuffix'),
      color: 'from-indigo-500 to-blue-500',
      lightBg: 'bg-indigo-50 dark:bg-indigo-950/30',
      border: 'border-indigo-100 dark:border-indigo-900/40',
    },
    {
      name: t('tools.smtp.name'),
      icon: '📧',
      measures: t('tools.smtp.measures'),
      useCase: t('tools.smtp.useCase'),
      checkSuffix: t('tools.smtp.checkSuffix'),
      color: 'from-amber-500 to-orange-500',
      lightBg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-100 dark:border-amber-900/40',
    },
  ];

  const FEATURES = [
    {
      title: t('features.globalCoverage.title'),
      desc: t('features.globalCoverage.desc'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
    },
    {
      title: t('features.realTimeResults.title'),
      desc: t('features.realTimeResults.desc'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      title: t('features.noAccountRequired.title'),
      desc: t('features.noAccountRequired.desc'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
        </svg>
      ),
    },
    {
      title: t('features.shareableReports.title'),
      desc: t('features.shareableReports.desc'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full relative bg-white dark:bg-slate-950">
      {/* ── Seamless Premium Blur/Glow Transition ── */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-50/50 via-white/50 to-transparent dark:from-slate-900 dark:via-slate-900/50 pointer-events-none" />
      <div className="absolute -top-px inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-200 dark:via-indigo-500/30 to-transparent opacity-80" />
      {/* Decorative Glow Orb aligned to the center */}
      <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[600px] max-w-full h-[120px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[50px] pointer-events-none rounded-full" />

      {/* ── Header ── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-12 pb-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
            <span className="w-4 h-px bg-indigo-400 rounded" />
            {t('header.badge')}
            <span className="w-4 h-px bg-indigo-400 rounded" />
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('header.titleLine1')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('header.titleLine2')}
            </span>
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('header.description')}
          </p>
        </div>

        {/* ── Feature pills ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]"
            >
              <span className="shrink-0 w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                {f.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{f.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tools grid ── */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
            {t('tools.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOOLS.map((tool) => (
              <div
                key={tool.name}
                className={`flex items-start gap-4 p-4 rounded-2xl border ${tool.border} ${tool.lightBg} transition-all duration-200`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-sm`}>
                  <span className="text-lg leading-none">{tool.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{tool.name}{tool.checkSuffix}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{tool.measures}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">{tool.useCase}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── What / Who / Why ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              q: t('faq.whatIsCheckNode.q'),
              a: t('faq.whatIsCheckNode.a'),
            },
            {
              q: t('faq.whoIsItFor.q'),
              a: t('faq.whoIsItFor.a'),
            },
            {
              q: t('faq.whyUseCheckNode.q'),
              a: t('faq.whyUseCheckNode.a'),
            },
          ].map(({ q, a }) => (
            <div key={q} className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-slate-100 dark:border-white/[0.06]">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm mb-2">{q}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        {/* ── Bottom tagline ── */}
        <div className="text-center py-8 border-t border-slate-100 dark:border-white/[0.05]">
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            {t('footerText')}
          </p>
        </div>
      </div>
    </section>
  );
}

export async function HomePageSeoBlock() {
  let seoContent: SeoContent | null = null;
  try {
    seoContent = await getSiteSetting('homepage_seo_content');
  } catch {
    // ignore
  }

  const hasCustomHtml = !!(seoContent && seoContent.enabled && seoContent.html?.trim());
  const shouldShowDefault = !seoContent || seoContent.showDefault || (!hasCustomHtml && seoContent.enabled !== false);

  if (!shouldShowDefault && !hasCustomHtml) return null;

  return (
    <div className="flex flex-col">
      {shouldShowDefault && <DefaultSeoContent />}

      {hasCustomHtml && (
        <section className={`w-full bg-white dark:bg-slate-950 ${shouldShowDefault ? 'border-t border-slate-100 dark:border-white/[0.05]' : ''}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-14">
            <article
              className="
                              prose prose-slate dark:prose-invert max-w-none
                              prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-8 prose-h1:text-slate-900 dark:prose-h1:text-white
                              prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-3 prose-h2:mt-8 prose-h2:text-slate-900 dark:prose-h2:text-white
                              prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-slate-800 dark:prose-h3:text-slate-200
                              prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-p:text-base
                              prose-ul:space-y-2 prose-li:text-slate-600 dark:prose-li:text-slate-400
                              prose-table:text-sm prose-table:w-full
                              prose-thead:bg-slate-50 dark:prose-thead:bg-slate-900
                              prose-th:text-left prose-th:font-semibold prose-th:py-3 prose-th:px-4 prose-th:text-slate-700 dark:prose-th:text-slate-300
                              prose-td:py-3 prose-td:px-4 prose-td:border-b prose-td:border-slate-100 dark:prose-td:border-slate-800
                              prose-strong:text-slate-800 dark:prose-strong:text-slate-200 prose-strong:font-semibold
                              prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                          "
              dangerouslySetInnerHTML={{ __html: seoContent!.html }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
