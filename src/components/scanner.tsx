"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Download,
  ExternalLink,
  FileSearch,
  Globe2,
  LoaderCircle,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { ScoreRing } from "@/components/score-ring";
import { gradeMeta, severityMeta, severityOrder } from "@/lib/labels";
import type { Issue, ScanResult, Severity } from "@/lib/types";

const EXAMPLES = [
  "https://www.gov.kz",
  "https://cardiff.edu.kz",
  "https://osn.kz",
];

const LOADING_STEPS = [
  "Проверяем адрес и доступность сайта…",
  "Загружаем HTML и строим дерево страницы…",
  "Ищем барьеры по WCAG 2.2…",
  "Считаем приоритеты и готовим отчёт…",
];

type ScanStatus = "idle" | "loading" | "done" | "error";

function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "border-forest bg-forest text-paper"
          : "border-line bg-white/70 text-ink-soft hover:border-ink/30 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const meta = severityMeta[issue.severity];

  return (
    <details
      className={`print-block group rounded-2xl border ${meta.border} ${meta.bg} transition-colors`}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <span
          className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${meta.badge}`}
        >
          {meta.label}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-extrabold leading-6">
            {issue.title}
          </span>
          <span className="mt-1 block text-xs font-semibold text-ink-soft">
            WCAG {issue.wcag} · {issue.count}{" "}
            {plural(issue.count, "элемент", "элемента", "элементов")}
          </span>
        </span>
        <ChevronDown
          className="issue-chevron mt-1 size-4 shrink-0 text-ink-soft transition-transform"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t border-ink/10 px-4 pb-5 pt-4 sm:px-5">
        <p className="text-sm leading-6 text-ink-soft">{issue.description}</p>

        <div className="mt-4 rounded-xl border border-ink/10 bg-white/60 p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-soft">
            Как исправить
          </p>
          <p className="mt-1.5 text-sm leading-6">{issue.fix}</p>
        </div>

        {issue.code && (
          <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-6 text-paper">
            <code>{issue.code}</code>
          </pre>
        )}

        {issue.examples.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-soft">
              Где найти
            </p>
            <ul className="mt-2 space-y-2">
              {issue.examples.map((example, index) => (
                <li
                  key={`${issue.id}-${index}`}
                  className="rounded-xl border border-ink/10 bg-white/55 p-3"
                >
                  <code className="block break-all font-mono text-[11px] font-bold text-forest">
                    {example.selector}
                  </code>
                  <pre className="mt-1 overflow-x-auto font-mono text-[11px] leading-5 text-ink-soft">
                    <code>{example.snippet}</code>
                  </pre>
                </li>
              ))}
            </ul>
          </div>
        )}

        {issue.docs && (
          <a
            href={issue.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
          >
            Разобрать критерий WCAG
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </details>
  );
}

export function Scanner() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleSeverity, setVisibleSeverity] = useState<Severity | "all">(
    "all",
  );
  const [loadingStep, setLoadingStep] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "loading") return;

    const timer = window.setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, LOADING_STEPS.length - 1));
    }, 1_200);

    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "done" || !result) return;

    const timer = window.setTimeout(() => resultRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [status, result]);

  const filteredIssues = useMemo(() => {
    if (!result) return [];
    if (visibleSeverity === "all") return result.issues;
    return result.issues.filter((issue) => issue.severity === visibleSeverity);
  }, [result, visibleSeverity]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = url.trim();

    if (!value) {
      setError("Введите адрес сайта, например https://example.kz");
      setStatus("error");
      inputRef.current?.focus();
      return;
    }

    setStatus("loading");
    setError(null);
    setResult(null);
    setVisibleSeverity("all");
    setLoadingStep(0);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: value }),
      });

      const data = (await response.json().catch(() => null)) as
        | ScanResult
        | { error?: string }
        | null;

      if (!response.ok) {
        const message =
          data && "error" in data && data.error
            ? data.error
            : "Не удалось проверить сайт.";
        throw new Error(message);
      }

      setResult(data as ScanResult);
      setStatus("done");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось проверить сайт. Попробуйте другой адрес.",
      );
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setVisibleSeverity("all");
    inputRef.current?.focus();
  }

  function downloadJson() {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `a11yguard-${hostnameOf(result.finalUrl)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <section
      id="scanner"
      aria-labelledby="scanner-title"
      className="relative scroll-mt-24 border-b border-line bg-paper py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-forest">
              <span className="size-2 rounded-full bg-lime-strong" />
              Сканер доступности
            </p>
            <h2
              id="scanner-title"
              className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-5xl"
            >
              Проверьте сайт
              <br />
              за 5 минут.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-ink-soft lg:justify-self-end">
            Введите адрес публичной страницы. A11yGuard загрузит HTML, найдёт
            барьеры и покажет, что исправить первым. Регистрация не нужна.
          </p>
        </div>

        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-white/70 p-4 shadow-xl shadow-ink/5 backdrop-blur sm:p-6">
          <form
            onSubmit={handleSubmit}
            aria-busy={status === "loading"}
            className="space-y-3"
          >
            <label
              htmlFor="site-url"
              className="block text-sm font-extrabold text-ink"
            >
              Адрес сайта
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Globe2
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  id="site-url"
                  name="url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  placeholder="https://example.kz"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    if (status === "error") {
                      setStatus("idle");
                      setError(null);
                    }
                  }}
                  aria-describedby="url-hint"
                  className="h-14 w-full rounded-xl border border-line bg-paper/70 pl-12 pr-4 text-base font-semibold text-ink placeholder:text-ink-soft/60 focus:border-forest focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-forest px-6 text-sm font-extrabold text-paper transition hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? (
                  <LoaderCircle
                    className="size-5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Search className="size-5" aria-hidden="true" />
                )}
                {status === "loading" ? "Сканируем…" : "Проверить сайт"}
              </button>
            </div>
            <p id="url-hint" className="text-xs leading-5 text-ink-soft">
              Только публичные HTML-страницы. Мы не сканируем локальные сети и
              не сохраняем содержимое страниц.
            </p>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-soft">
              Попробуйте:
            </span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setUrl(example);
                  inputRef.current?.focus();
                }}
                className="rounded-full border border-line bg-paper/60 px-3 py-1.5 text-xs font-bold text-ink-soft transition hover:border-forest/30 hover:text-forest"
              >
                {hostnameOf(example)}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line/70 pt-4 text-xs font-semibold text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-forest" aria-hidden="true" />
              Только публичные страницы
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Timer className="size-3.5 text-forest" aria-hidden="true" />
              3–8 секунд
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileSearch className="size-3.5 text-forest" aria-hidden="true" />
              25 автоматических проверок
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2
                className="size-3.5 text-forest"
                aria-hidden="true"
              />
              Без регистрации
            </span>
          </div>
        </div>

        <div>
          {status === "loading" && (
            <div
              className="mt-8 rounded-[2rem] border border-line bg-white/70 p-6 sm:p-8"
              role="status"
            >
              <div className="flex items-center gap-3">
                <LoaderCircle
                  className="size-5 animate-spin text-forest"
                  aria-hidden="true"
                />
                <p className="font-extrabold">{LOADING_STEPS[loadingStep]}</p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-deep">
                <div className="shimmer h-full w-1/3 rounded-full bg-forest" />
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                Обычно 3–8 секунд. Мы не сохраняем HTML и персональные данные.
              </p>
            </div>
          )}

          {status === "error" && error && (
            <div
              className="mt-8 flex gap-3 rounded-2xl border border-red/25 bg-[#fdf1ef] p-5"
              role="alert"
            >
              <CircleAlert
                className="mt-0.5 size-5 shrink-0 text-red"
                aria-hidden="true"
              />
              <div>
                <p className="font-extrabold text-red">
                  Не получилось проверить сайт
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{error}</p>
                <p className="mt-2 text-xs leading-5 text-ink-soft">
                  Попробуйте адрес с https://, другой домен или повторите позже.
                  Сайты с защитой от ботов и внутренние сети мы не сканируем.
                </p>
              </div>
            </div>
          )}

          {status === "done" && result && (
            <div
              ref={resultRef}
              tabIndex={-1}
              aria-labelledby="result-title"
              className="mt-8 scroll-mt-24 outline-none"
            >
              <div
                className={`rounded-[2rem] border ${gradeMeta[result.grade].border} ${gradeMeta[result.grade].bg} p-5 sm:p-7`}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <ScoreRing score={result.score} grade={result.grade} />
                    <div>
                      <p
                        className={`text-xs font-extrabold uppercase tracking-[0.16em] ${gradeMeta[result.grade].text}`}
                      >
                        {gradeMeta[result.grade].label} ·{" "}
                        {gradeMeta[result.grade].note}
                      </p>
                      <h3
                        id="result-title"
                        className="mt-1 max-w-2xl text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-3xl"
                      >
                        {result.title}
                      </h3>
                      <a
                        href={result.finalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
                      >
                        {hostnameOf(result.finalUrl)}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                      <p className="mt-3 text-xs leading-5 text-ink-soft">
                        Проверено {formatDate(result.scannedAt)} · HTTP{" "}
                        {result.meta.status} · {result.meta.responseTimeMs} мс ·{" "}
                        {formatBytes(result.meta.htmlBytes)}
                      </p>
                    </div>
                  </div>

                  <div className="no-print flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={downloadJson}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/80 px-3.5 py-2 text-xs font-extrabold text-ink transition hover:border-forest/30"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/80 px-3.5 py-2 text-xs font-extrabold text-ink transition hover:border-forest/30"
                    >
                      <Printer className="size-4" aria-hidden="true" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/80 px-3.5 py-2 text-xs font-extrabold text-ink transition hover:border-forest/30"
                    >
                      <RefreshCw className="size-4" aria-hidden="true" />
                      Новый скан
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: "Блокеры",
                      value: result.stats.blockers,
                      meta: severityMeta.blocker,
                    },
                    {
                      label: "Критично",
                      value: result.stats.critical,
                      meta: severityMeta.critical,
                    },
                    {
                      label: "Важно",
                      value: result.stats.warnings,
                      meta: severityMeta.warning,
                    },
                    {
                      label: "Улучшения",
                      value: result.stats.infos,
                      meta: severityMeta.info,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-ink/10 bg-white/65 p-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${item.meta.dot}`}
                          aria-hidden="true"
                        />
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-soft">
                          {item.label}
                        </span>
                      </div>
                      <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs leading-5 text-ink-soft">
                  {result.stats.totalViolations}{" "}
                  {plural(
                    result.stats.totalViolations,
                    "нарушение",
                    "нарушения",
                    "нарушений",
                  )}{" "}
                  в {result.stats.totalRules}{" "}
                  {plural(
                    result.stats.totalRules,
                    "правиле",
                    "правилах",
                    "правилах",
                  )}
                  . Это скрининг, а не сертификат соответствия: автоматика не
                  заменяет ручной аудит.
                </p>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-lg font-extrabold tracking-[-0.02em]">
                        Что исправить первым
                      </h4>
                      <p className="mt-1 text-xs text-ink-soft">
                        Отсортировано по влиянию на пользователя.
                      </p>
                    </div>
                    <div
                      role="group"
                      aria-label="Фильтр нарушений по важности"
                      className="no-print flex flex-wrap gap-1.5"
                    >
                      <FilterButton
                        active={visibleSeverity === "all"}
                        onClick={() => setVisibleSeverity("all")}
                      >
                        Все ({result.issues.length})
                      </FilterButton>
                      {severityOrder.map((severity) => {
                        const count = result.issues.filter(
                          (issue) => issue.severity === severity,
                        ).length;
                        if (!count) return null;
                        return (
                          <FilterButton
                            key={severity}
                            active={visibleSeverity === severity}
                            onClick={() => setVisibleSeverity(severity)}
                          >
                            {severityMeta[severity].label} ({count})
                          </FilterButton>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {filteredIssues.length > 0 ? (
                      filteredIssues.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-green/20 bg-[#eaf7ef] p-5">
                        <p className="font-extrabold text-green">
                          В этой категории автоматических нарушений нет.
                        </p>
                        <p className="mt-1 text-sm leading-6 text-ink-soft">
                          Это хороший знак, но не финальный вердикт. Пройдите
                          ручной чек-лист справа.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-2xl border border-line bg-white/70 p-5">
                    <h4 className="text-sm font-extrabold">
                      Что автоматика не проверит
                    </h4>
                    <ul className="mt-3 space-y-2.5">
                      {result.manualChecks.map((check) => (
                        <li
                          key={check}
                          className="flex gap-2 text-xs leading-5 text-ink-soft"
                        >
                          <CheckCircle2
                            className="mt-0.5 size-3.5 shrink-0 text-forest"
                            aria-hidden="true"
                          />
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-forest p-5 text-paper">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-lime">
                      Следующий шаг
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6">
                      Покажите отчёт разработчику. Начните с блокеров, затем —
                      с критичных.
                    </p>
                    <a
                      href="#how"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-lime underline decoration-lime/40 underline-offset-4 hover:decoration-lime"
                    >
                      Как читать отчёт
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
