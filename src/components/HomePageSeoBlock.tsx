import { getSiteSetting } from '@/lib/site-settings';

interface SeoContent {
  html: string;
  enabled: boolean;
}

const TOOLS = [
  {
    name: 'Ping',
    icon: '📡',
    measures: 'ICMP latency & packet loss',
    useCase: 'Diagnose network reachability',
    color: 'from-blue-500 to-cyan-500',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-100 dark:border-blue-900/40',
  },
  {
    name: 'HTTP',
    icon: '🌐',
    measures: 'Status code, TLS, response time',
    useCase: 'Verify website uptime globally',
    color: 'from-violet-500 to-purple-500',
    lightBg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-100 dark:border-violet-900/40',
  },
  {
    name: 'DNS',
    icon: '🔍',
    measures: 'A, AAAA, MX, CNAME, TXT records',
    useCase: 'Validate DNS propagation',
    color: 'from-emerald-500 to-teal-500',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-100 dark:border-emerald-900/40',
  },
  {
    name: 'MTR',
    icon: '🛤️',
    measures: 'Hop-by-hop traceroute with stats',
    useCase: 'Find network bottlenecks',
    color: 'from-orange-500 to-amber-500',
    lightBg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-100 dark:border-orange-900/40',
  },
  {
    name: 'TCP/UDP',
    icon: '🔌',
    measures: 'Port reachability & response',
    useCase: 'Check service availability',
    color: 'from-rose-500 to-pink-500',
    lightBg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-100 dark:border-rose-900/40',
  },
  {
    name: 'IP Info',
    icon: '🗺️',
    measures: 'Geolocation, ISP, ASN, WHOIS',
    useCase: 'Identify IP ownership & routing',
    color: 'from-indigo-500 to-blue-500',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-100 dark:border-indigo-900/40',
  },
];

const FEATURES = [
  {
    title: 'Global Coverage',
    desc: '20+ monitoring nodes across Europe, Americas, and Asia for accurate worldwide results.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Results',
    desc: 'Instant latency, packet loss, and DNS data — no delays, no queues.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: 'No Account Required',
    desc: 'All core diagnostic tools are completely free — run checks without signing up.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
      </svg>
    ),
  },
  {
    title: 'Shareable Reports',
    desc: 'Share your check results with any team member via a permanent, bookmarkable link.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185z" />
      </svg>
    ),
  },
];

// Default beautiful component (no custom HTML set in admin)
function DefaultSeoContent() {
  return (
    <section className="w-full bg-white dark:bg-slate-950">
      {/* ── Header ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
            <span className="w-4 h-px bg-indigo-400 rounded" />
            Free Network Diagnostic Platform
            <span className="w-4 h-px bg-indigo-400 rounded" />
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Professional Network Checks
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              from Every Corner of the Globe
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            CheckNode is trusted by developers, sysadmins, and webmasters to diagnose network issues
            across 20&nbsp;+ global locations — no registration, no limits.
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
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tools grid ── */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
            All Diagnostic Tools at a Glance
          </h3>
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
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{tool.name} Check</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tool.measures}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">{tool.useCase}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── What / Who / Why ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              q: 'What is CheckNode?',
              a: 'CheckNode is a free, professional-grade network monitoring platform. It lets you run Ping, HTTP, DNS, MTR, TCP, UDP, and IP diagnostics from 20+ global nodes instantly — right from your browser.',
            },
            {
              q: 'Who is it for?',
              a: 'Developers debugging server latency, webmasters verifying uptime, sysadmins diagnosing routing anomalies, and anyone who needs accurate network data from multiple locations simultaneously.',
            },
            {
              q: 'Why use CheckNode?',
              a: 'Unlike single-location tools, CheckNode checks from many regions at once. This reveals CDN issues, regional outages, and DNS propagation differences that local checks cannot detect.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-slate-100 dark:border-white/[0.06]">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">{q}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        {/* ── Bottom tagline ── */}
        <div className="text-center py-8 border-t border-slate-100 dark:border-white/[0.05]">
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xl mx-auto leading-relaxed">
            Whether you are debugging a slow server response, verifying DNS propagation after a domain migration,
            or checking worldwide accessibility — CheckNode provides the precision tools you need, entirely for free.
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

  // Hidden in admin settings
  if (seoContent && seoContent.enabled === false) return null;

  // Custom HTML from admin — render in a styled prose wrapper
  if (seoContent?.html?.trim()) {
    return (
      <section className="w-full bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-14">
          <article
            className="
                            prose prose-slate dark:prose-invert max-w-none
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
            dangerouslySetInnerHTML={{ __html: seoContent.html }}
          />
        </div>
      </section>
    );
  }

  // Default — beautiful structured design
  return <DefaultSeoContent />;
}
