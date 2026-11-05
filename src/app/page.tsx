import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  CheckCircle2,
  Code2,
  Contrast,
  FileCheck2,
  Keyboard,
  Languages,
  LayoutList,
  MousePointer2,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Scanner } from "@/components/scanner";
import { ScoreRing } from "@/components/score-ring";
import { severityMeta } from "@/lib/labels";

const previewIssues = [
  {
    severity: "blocker" as const,
    title: "Масштабирование запрещено",
    meta: "WCAG 1.4.4 · 1 элемент",
  },
  {
    severity: "critical" as const,
    title: "Изображения без alt",
    meta: "WCAG 1.1.1 · 12 элементов",
  },
  {
    severity: "warning" as const,
    title: "Поля формы без подписи",
    meta: "WCAG 1.3.1 · 5 элементов",
  },
];

const problemCards = [
  {
    icon: FileCheck2,
    title: "Аудит стоит как редизайн",
    text: "Рыночный экспресс-аудит малого сайта — сотни тысяч тенге. Для НКО, районной школы или небольшого магазина это нереально.",
    stat: "200–500 тыс. ₸",
  },
  {
    icon: LayoutList,
    title: "Список ошибок не говорит, что делать",
    text: "Разработчик получает 300 нарушений без приоритета и закрывает проект с формулировкой «потом». Потом не наступает.",
    stat: "300+ нарушений",
  },
  {
    icon: MousePointer2,
    title: "Оверлей имитирует доступность",
    text: "Кнопка «версия для слабовидящих» не чинит alt, формы и клавиатуру. Она создаёт иллюзию решения и оставляет барьеры в коде.",
    stat: "0 исправлений",
  },
];

const steps = [
  {
    icon: ScanLine,
    title: "Скан",
    text: "Вводите URL. A11yGuard загружает публичную HTML-страницу и проверяет её по 25 правилам WCAG 2.2.",
  },
  {
    icon: LayoutList,
    title: "Приоритет",
    text: "Блокеры и критичные барьеры идут первыми. Остальное сортируется по влиянию на пользователя, а не по алфавиту.",
  },
  {
    icon: Code2,
    title: "Патч",
    text: "Показываем селектор, пример кода и объяснение. Без автозамены: решение и ответственность остаются за разработчиком.",
  },
  {
    icon: ShieldCheck,
    title: "Контроль",
    text: "Повторный скан доказывает прогресс. JSON-отчёт можно приложить к задаче, PDF — показать руководителю.",
  },
];

const checks = [
  { icon: Braces, title: "Alt-тексты", text: "Смысл изображений и декоративные картинки." },
  { icon: LayoutList, title: "Подписи форм", text: "label, aria-label и placeholder-ловушки." },
  { icon: BookOpen, title: "Структура", text: "H1–H6, порядок уровней и ориентация." },
  { icon: Keyboard, title: "Клавиатура", text: "Фокус, tabindex и клики без клавиш." },
  { icon: Sparkles, title: "ARIA и роли", text: "role=\"button\", aria-hidden и доступные имена." },
  { icon: Languages, title: "Язык", text: "lang страницы и казахскоязычный контекст." },
  { icon: Contrast, title: "Масштабирование", text: "Запрет зума и meta viewport." },
  { icon: Volume2, title: "Медиа", text: "Iframe, видео и встроенные объекты." },
];

const marketRows = [
  {
    name: "Accessible Kazakhstan",
    note: "Карта доступности зданий, а не сайтов",
  },
  {
    name: "OSN.KZ и агентства",
    note: "Ручной аудит как услуга, а не self-serve",
  },
  {
    name: "СТ РК 2191-2023",
    note: "Стандарт на базе WCAG 2.2, а не инструмент внедрения",
  },
  {
    name: "Lighthouse, axe, WAVE",
    note: "Глобальные сканеры без казахского workflow",
  },
];

const gaps = [
  {
    title: "Казахскоязычный SaaS",
    text: "Не перевод, а интерфейс и объяснения на казахском.",
  },
  {
    title: "Приоритизация",
    text: "Не 300 ошибок, а 5 действий с максимальным эффектом.",
  },
  {
    title: "Готовые патчи",
    text: "HTML, ARIA и CSS, которые можно сразу отдать в работу.",
  },
  {
    title: "Мониторинг",
    text: "Повторный скан и доказательство прогресса, а не разовый PDF.",
  },
];

const principles = [
  {
    title: "Право, не милость",
    text: "Доступность закреплена в UN CRPD и законодательстве РК. Это не социальная акция.",
  },
  {
    title: "Барьер — это баг",
    text: "Если человек не может купить билет, это ошибка продукта, а не «особенность пользователя».",
  },
  {
    title: "Приоритет важнее полноты",
    text: "Лучше закрыть пять критичных барьеров, чем прочитать отчёт на 400 страниц.",
  },
  {
    title: "Код важнее косметики",
    text: "Оверлей не чинит HTML. Настоящая доступность живёт в коде, а не поверх него.",
  },
  {
    title: "Язык — часть доступности",
    text: "Казахский — не перевод с русского. Это первый язык для части пользователей.",
  },
  {
    title: "Человек важнее скора",
    text: "Мы не гонимся за 100/100. Мы убираем то, что реально мешает людям.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-forest">
      <span className="size-2 rounded-full bg-lime-strong" aria-hidden="true" />
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <>
      <header className="no-print sticky top-0 z-50 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="#" aria-label="A11yGuard — на главную">
            <Logo />
          </a>
          <nav
            aria-label="Основная навигация"
            className="hidden items-center gap-7 text-sm font-bold text-ink-soft md:flex"
          >
            <a className="transition hover:text-ink" href="#problem">
              Проблема
            </a>
            <a className="transition hover:text-ink" href="#how">
              Как работает
            </a>
            <a className="transition hover:text-ink" href="#market">
              Рынок
            </a>
            <a className="transition hover:text-ink" href="#manifesto">
              Идеология
            </a>
          </nav>
          <a
            href="#scanner"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-extrabold text-paper transition hover:bg-forest"
          >
            Проверить сайт
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden border-b border-line">
          <div
            className="absolute inset-0 grid-paper opacity-70"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white/55 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-forest">
                <span
                  className="size-2 animate-pulse-line rounded-full bg-lime-strong"
                  aria-hidden="true"
                />
                WCAG 2.2 AA · СТ РК 2191-2023
              </p>

              <h1 className="mt-6 max-w-3xl text-[2.7rem] font-extrabold leading-[0.96] tracking-[-0.055em] sm:text-7xl lg:text-[5.4rem]">
                Доступность —
                <br />
                не привилегия.
                <br />
                <span className="relative inline-block">
                  Это код.
                  <span
                    className="absolute -bottom-1 left-0 -z-10 h-4 w-full -rotate-1 rounded-sm bg-lime sm:h-5"
                    aria-hidden="true"
                  />
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
                A11yGuard за 5 минут показывает, что мешает людям пользоваться
                сайтом, что исправить первым и какой код поставить. Без
                оверлеев и отчётов на 400 страниц.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#scanner"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-6 py-4 text-sm font-extrabold text-paper transition hover:bg-forest-soft"
                >
                  Проверить сайт бесплатно
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a
                  href="#manifesto"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white/55 px-6 py-4 text-sm font-extrabold text-ink transition hover:border-forest/30"
                >
                  Читать идеологию
                </a>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6">
                <div>
                  <dt className="text-2xl font-extrabold tracking-[-0.04em]">
                    750K+
                  </dt>
                  <dd className="mt-1 text-xs leading-5 text-ink-soft">
                    людей с инвалидностью в Казахстане
                  </dd>
                </div>
                <div>
                  <dt className="text-2xl font-extrabold tracking-[-0.04em]">
                    1,3 млрд
                  </dt>
                  <dd className="mt-1 text-xs leading-5 text-ink-soft">
                    людей с инвалидностью в мире
                  </dd>
                </div>
                <div>
                  <dt className="text-2xl font-extrabold tracking-[-0.04em]">
                    0
                  </dt>
                  <dd className="mt-1 text-xs leading-5 text-ink-soft">
                    причин оставлять барьеры
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative animate-float-soft">
              <div
                className="absolute -inset-8 rounded-full bg-lime/35 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative rounded-[2rem] border border-ink/10 bg-white/85 p-4 shadow-2xl shadow-ink/10 backdrop-blur sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-10 place-items-center rounded-xl bg-forest text-lime">
                      <ScanLine className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">demo.gov.kz</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                        Демо-отчёт
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] font-extrabold text-ink-soft">
                    WCAG 2.2
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-5">
                  <ScoreRing score={64} grade="poor" size="sm" />
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#c2410c]">
                      Нашар · много барьеров
                    </p>
                    <p className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">
                      17 проблем
                    </p>
                    <p className="text-xs text-ink-soft">в 8 правилах</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {previewIssues.map((issue) => (
                    <div
                      key={issue.title}
                      className="flex items-center gap-3 rounded-xl border border-ink/10 bg-paper/70 px-3 py-2.5"
                    >
                      <span
                        className={`size-2 shrink-0 rounded-full ${severityMeta[issue.severity].dot}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold">
                          {issue.title}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold text-ink-soft">
                          {issue.meta}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="size-3.5 shrink-0 text-ink-soft"
                        aria-hidden="true"
                      />
                    </div>
                  ))}
                </div>

                <a
                  href="#scanner"
                  className="mt-5 flex items-center justify-between rounded-xl bg-ink px-4 py-3.5 text-xs font-extrabold text-paper transition hover:bg-forest"
                >
                  Проверить свой сайт
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <Scanner />

        <section
          id="problem"
          className="scroll-mt-24 border-b border-line bg-paper-deep/35 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-3xl">
              <Eyebrow>Проблема</Eyebrow>
              <h2 className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
                Сайт работает.
                <br />
                Но не для всех.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ink-soft">
                Доступность давно перестала быть «социальной темой». Это
                качество продукта, юридический риск и вопрос того, кого вы
                оставляете за дверью.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {problemCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="rounded-3xl border border-line bg-paper p-6"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-forest text-lime">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-extrabold leading-6">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                      {card.text}
                    </p>
                    <p className="mt-5 border-t border-line pt-4 font-mono text-xs font-bold text-forest">
                      {card.stat}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="how"
          className="scroll-mt-24 border-b border-line py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <Eyebrow>Как работает</Eyebrow>
                <h2 className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
                  От скана
                  <br />
                  до исправления.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-ink-soft">
                  Не ещё один сканер, который выдаёт 300 ошибок. Маршрут,
                  который доводит до исправленного кода.
                </p>
                <a
                  href="#scanner"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
                >
                  Запустить первый скан
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>

              <ol className="grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li
                      key={step.title}
                      className="rounded-3xl border border-line bg-white/55 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-ink-soft">
                          0{index + 1}
                        </span>
                        <span className="grid size-9 place-items-center rounded-lg bg-paper-deep text-forest">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                      </div>
                      <h3 className="mt-5 text-lg font-extrabold">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-ink-soft">
                        {step.text}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-forest py-20 text-paper sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-lime">
                  <span
                    className="size-2 rounded-full bg-lime-strong"
                    aria-hidden="true"
                  />
                  Что проверяем
                </p>
                <h2 className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
                  25 автоматических
                  <br />
                  правил.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-paper/70">
                  И честные границы: контраст, скринридер и когнитивную
                  нагрузку автоматика не заменит. Поэтому в каждом отчёте есть
                  ручной чек-лист.
                </p>
                <a
                  href="#scanner"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-extrabold text-ink transition hover:bg-lime-strong"
                >
                  Проверить сайт
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {checks.map((check) => {
                  const Icon = check.icon;
                  return (
                    <div
                      key={check.title}
                      className="rounded-2xl border border-paper/12 bg-paper/[0.06] p-4"
                    >
                      <Icon className="size-4 text-lime" aria-hidden="true" />
                      <h3 className="mt-3 text-sm font-extrabold">
                        {check.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-paper/60">
                        {check.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          id="market"
          className="scroll-mt-24 border-b border-line py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
              <div>
                <Eyebrow>Рынок Казахстана</Eyebrow>
                <h2 className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
                  Ниша свободна.
                  <br />
                  Но не пуста.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-ink-soft">
                  Прямых SaaS-аналогов в Казахстане мы не нашли. Но говорить
                  «здесь ничего нет» неверно: есть услуги, стандарт и
                  глобальные сканеры.
                </p>
                <div className="mt-6 rounded-2xl border border-lime-strong/50 bg-lime/15 p-5">
                  <p className="font-extrabold">
                    Свободна именно продуктовая ниша.
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-ink-soft">
                    Казахскоязычный self-serve инструмент с приоритетами,
                    патчами и повторным контролем. Не ещё один PDF-аудит.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-line bg-white/55">
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-line bg-paper-deep/60 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-soft">
                  <span>Что уже есть</span>
                  <span>Почему это не A11yGuard</span>
                </div>
                {marketRows.map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line/70 px-5 py-4 last:border-b-0"
                  >
                    <span className="text-sm font-extrabold">{row.name}</span>
                    <span className="max-w-[15rem] text-right text-xs leading-5 text-ink-soft">
                      {row.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {gaps.map((gap) => (
                <div
                  key={gap.title}
                  className="rounded-2xl border border-line bg-paper p-4"
                >
                  <CheckCircle2
                    className="size-4 text-forest"
                    aria-hidden="true"
                  />
                  <h3 className="mt-3 text-sm font-extrabold">{gap.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">
                    {gap.text}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs leading-5 text-ink-soft">
              Источники:{" "}
              <a
                className="font-bold underline decoration-ink-soft/30 underline-offset-4 hover:text-forest"
                href="https://astanatimes.com/2022/05/accessible-kazakhstan-startup-becomes-first-digital-public-good-in-central-asia/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Accessible Kazakhstan
              </a>
              ,{" "}
              <a
                className="font-bold underline decoration-ink-soft/30 underline-offset-4 hover:text-forest"
                href="https://osn.kz/blog/veb-dostupnost-inklyuzivnyj-dizajn-wcag-kz-2026"
                target="_blank"
                rel="noopener noreferrer"
              >
                OSN.KZ
              </a>
              ,{" "}
              <a
                className="font-bold underline decoration-ink-soft/30 underline-offset-4 hover:text-forest"
                href="https://365info.kz/2024/01/v-kazahstane-vvoditsya-standart-po-dostupnosti-veb-kontenta"
                target="_blank"
                rel="noopener noreferrer"
              >
                СТ РК 2191-2023
              </a>
              .
            </p>
          </div>
        </section>

        <section
          id="manifesto"
          className="scroll-mt-24 border-b border-line bg-paper-deep/40 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[2rem] bg-forest p-7 text-paper sm:p-10">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-lime">
                  Идеология
                </p>
                <blockquote className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-4xl">
                  «Қолжетімділік — артықшылық емес, құқық».
                </blockquote>
                <p className="mt-4 text-lg font-bold text-lime">
                  Доступность — не привилегия, а право.
                </p>
                <p className="mt-5 max-w-xl text-sm leading-7 text-paper/75">
                  A11yGuard — не карательный аудит. Это страж доступности: он
                  на стороне человека, который не смог записаться к врачу,
                  купить билет или прочитать новость. И на стороне разработчика,
                  которому нужен понятный следующий шаг.
                </p>
                <p className="mt-6 text-sm font-extrabold text-paper">
                  Сайт емес, адам үшін. — Не для сайта, а для человека.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="#scanner"
                    className="inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-3 text-xs font-extrabold text-ink transition hover:bg-lime-strong"
                  >
                    Проверить сайт
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                  <a
                    href="https://github.com/abusasa/a11yguard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-paper/20 px-4 py-3 text-xs font-extrabold text-paper transition hover:border-paper/40"
                  >
                    <Code2 className="size-4" aria-hidden="true" />
                    Открытый код
                  </a>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {principles.map((principle, index) => (
                  <div
                    key={principle.title}
                    className="rounded-2xl border border-line bg-paper p-5"
                  >
                    <span className="font-mono text-xs font-bold text-forest">
                      0{index + 1}
                    </span>
                    <h3 className="mt-2 text-sm font-extrabold">
                      {principle.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-ink-soft">
                      {principle.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-lime py-16 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-forest">
                Начните с одного сайта
              </p>
              <h2 className="mt-2 max-w-2xl text-3xl font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-4xl">
                Доступность начинается с первого исправленного барьера.
              </h2>
            </div>
            <a
              href="#scanner"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-6 py-4 text-sm font-extrabold text-paper transition hover:bg-forest"
            >
              Проверить сайт
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-ink py-10 text-paper">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <Logo variant="dark" />
              <p className="mt-3 max-w-md text-sm leading-6 text-paper/60">
                Навигатор по доступности казахстанских сайтов. Скан, приоритет,
                патч и контроль — на русском и казахском.
              </p>
            </div>
            <nav
              aria-label="Ссылки в подвале"
              className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm font-bold text-paper/70"
            >
              <a className="hover:text-paper" href="#problem">
                Проблема
              </a>
              <a className="hover:text-paper" href="#how">
                Как работает
              </a>
              <a className="hover:text-paper" href="#market">
                Рынок
              </a>
              <a className="hover:text-paper" href="#manifesto">
                Идеология
              </a>
              <a className="hover:text-paper" href="#scanner">
                Сканер
              </a>
              <a
                className="inline-flex items-center gap-1.5 hover:text-paper"
                href="https://github.com/abusasa/a11yguard"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            </nav>
          </div>
          <div className="mt-8 flex flex-col gap-2 border-t border-paper/15 pt-5 text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 A11yGuard. Сделано в Казахстане.</p>
            <p>Не заменяет ручной аудит и не является юридической сертификацией.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
