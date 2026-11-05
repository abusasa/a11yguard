import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { Element } from "domhandler";
import dns from "node:dns/promises";
import net from "node:net";
import type {
  Grade,
  Issue,
  IssueExample,
  ScanResult,
  Severity,
} from "@/lib/types";

const MAX_BYTES = 2_000_000;
const FETCH_TIMEOUT = 12_000;
const MAX_REDIRECTS = 3;
const USER_AGENT =
  "A11yGuardBot/0.1 (+https://github.com/abusasa/a11yguard; accessibility scanner)";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  blocker: 14,
  critical: 7,
  warning: 2.5,
  info: 0.8,
};

const SEVERITY_RANK: Record<Severity, number> = {
  blocker: 0,
  critical: 1,
  warning: 2,
  info: 3,
};

const MANUAL_CHECKS = [
  "Контраст текста и фона — автоматика видит только часть случаев.",
  "Навигация только с клавиатуры и видимый фокус на каждом элементе.",
  "Проверка со скринридером: NVDA, VoiceOver или TalkBack.",
  "Понятность ошибок и подсказок в формах.",
  "Субтитры, транскрипты и аудиоописания для медиа.",
  "Масштабирование до 200% и 400% без потери контента.",
  "Когнитивная нагрузка, понятный язык и последовательность шагов.",
  "Корректность работы при `prefers-reduced-motion`.",
];

type IssueSeed = Omit<Issue, "count" | "examples">;

function byId($: CheerioAPI, id: string) {
  return $(`[id="${id.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`);
}

function isHidden($: CheerioAPI, el: Element): boolean {
  const $el = $(el);
  if ($el.attr("hidden") !== undefined || $el.attr("aria-hidden") === "true") {
    return true;
  }
  const style = ($el.attr("style") || "").toLowerCase();
  return /display\s*:\s*none|visibility\s*:\s*hidden/.test(style);
}

function accessibleName($: CheerioAPI, el: Element): string {
  const $el = $(el);

  const labelledBy = $el.attr("aria-labelledby")?.trim();
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => byId($, id).text())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) return text;
  }

  const ariaLabel = $el.attr("aria-label")?.trim();
  if (ariaLabel) return ariaLabel;

  const title = $el.attr("title")?.trim();
  if (title) return title;

  if (el.tagName === "img") return $el.attr("alt")?.trim() ?? "";

  if (el.tagName === "input") {
    const type = ($el.attr("type") || "text").toLowerCase();
    if (["submit", "button", "reset"].includes(type)) {
      return $el.attr("value")?.trim() || type;
    }
    if (type === "image") return $el.attr("alt")?.trim() ?? "";
  }

  const text = $el.text().replace(/\s+/g, " ").trim();
  if (text) return text;

  const childLabel =
    $el.find("[aria-label]").first().attr("aria-label")?.trim() ||
    $el.find("img[alt]").first().attr("alt")?.trim() ||
    "";
  return childLabel;
}

function hasLabel($: CheerioAPI, el: Element): boolean {
  const $el = $(el);
  if (
    $el.attr("aria-label")?.trim() ||
    $el.attr("aria-labelledby")?.trim() ||
    $el.attr("title")?.trim()
  ) {
    return true;
  }

  const id = $el.attr("id")?.trim();
  if (id && byId($, id).length && $(`label[for="${id.replace(/"/g, '\\"')}"]`).length > 0) {
    return true;
  }

  return $el.closest("label").length > 0;
}

function selectorFor($: CheerioAPI, el: Element): string {
  const id = el.attribs?.id?.trim();
  if (id) return `#${id}`;

  const parent = el.parent;
  let index = 1;
  if (parent && "children" in parent) {
    const sameTag = parent.children.filter(
      (child) => child.type === "tag" && child.tagName === el.tagName,
    );
    index = Math.max(sameTag.indexOf(el) + 1, 1);
  }

  return `${el.tagName}:nth-of-type(${index})`;
}

function example($: CheerioAPI, el: Element): IssueExample {
  const html = $.html(el) ?? "";
  return {
    selector: selectorFor($, el),
    snippet: html.length > 190 ? `${html.slice(0, 187)}...` : html,
  };
}

function firstElement($: CheerioAPI, selector: string): Element | undefined {
  return $(selector).get(0) as Element | undefined;
}

function gradeFor(score: number): Grade {
  if (score >= 90) return "good";
  if (score >= 70) return "fair";
  if (score >= 40) return "poor";
  return "critical";
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (net.isIPv6(ip)) {
    const value = ip.toLowerCase();
    return (
      value === "::" ||
      value === "::1" ||
      value.startsWith("fc") ||
      value.startsWith("fd") ||
      value.startsWith("fe8") ||
      value.startsWith("fe9") ||
      value.startsWith("fea") ||
      value.startsWith("feb") ||
      value.startsWith("::ffff:127.") ||
      value.startsWith("::ffff:10.") ||
      value.startsWith("::ffff:192.168.")
    );
  }

  return false;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function assertPublicUrl(input: string): Promise<URL> {
  const raw = input.trim();
  if (!raw) throw new Error("Введите адрес сайта.");

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
    ? raw
    : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Это не похоже на адрес сайта. Пример: https://example.kz");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Можно проверять только сайты по http или https.");
  }
  if (url.username || url.password) {
    throw new Error("Ссылки с логином и паролем не поддерживаются.");
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Разрешены только стандартные порты 80 и 443.");
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Локальные и внутренние адреса проверять нельзя.");
  }

  const addresses = await withTimeout(
    dns.lookup(host, { all: true, verbatim: true }),
    3_000,
    "Не удалось разрешить домен за 3 секунды.",
  );

  if (!addresses.length) {
    throw new Error("Домен не найден.");
  }
  for (const address of addresses) {
    if (isPrivateIp(address.address)) {
      throw new Error("Этот адрес ведёт во внутреннюю сеть. Проверка запрещена.");
    }
  }

  url.hash = "";
  return url;
}

async function readLimited(response: Response, maxBytes: number): Promise<string> {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new Error("Страница больше 2 МБ — такие сайты пока не поддерживаются.");
  }

  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Страница больше 2 МБ — такие сайты пока не поддерживаются.");
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

interface FetchedPage {
  html: string;
  finalUrl: string;
  status: number;
  responseTimeMs: number;
}

async function fetchHtml(startUrl: URL): Promise<FetchedPage> {
  const startedAt = Date.now();
  let current = startUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertPublicUrl(current.toString());

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "accept-language": "ru,kk;q=0.9,en;q=0.8",
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Сайт не ответил за 12 секунд.");
      }
      throw new Error("Не удалось подключиться к сайту.");
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Сайт вернул редирект без адреса.");
      current = new URL(location, current);
      continue;
    }

    if (!response.ok) {
      throw new Error(`Сайт ответил HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      throw new Error("По этой ссылке не HTML-страница.");
    }

    const html = await readLimited(response, MAX_BYTES);
    return {
      html,
      finalUrl: current.toString(),
      status: response.status,
      responseTimeMs: Date.now() - startedAt,
    };
  }

  throw new Error("Слишком много редиректов — остановились на 3.");
}

export async function scanUrl(input: string): Promise<ScanResult> {
  const url = await assertPublicUrl(input);
  const fetched = await fetchHtml(url);
  const $ = cheerio.load(fetched.html);
  const issues: Issue[] = [];

  const add = (seed: IssueSeed, elements: Element[]) => {
    if (!elements.length) return;
    issues.push({
      ...seed,
      count: elements.length,
      examples: elements.slice(0, 3).map((el) => example($, el)),
    });
  };

  const htmlEl = firstElement($, "html");
  const headEl = firstElement($, "head");
  const title = $("head title").first().text().replace(/\s+/g, " ").trim();
  const lang = $("html").attr("lang")?.trim() || null;

  if (!lang && htmlEl) {
    add(
      {
        id: "html-lang",
        rule: "html-has-lang",
        title: "Не указан язык страницы",
        description:
          "Скринридер не знает, на каком языке читать текст. Для казахскоязычной страницы нужен lang=\"kk\", для русскоязычной — lang=\"ru\".",
        wcag: "3.1.1",
        severity: "critical",
        fix: "Добавьте атрибут lang к корневому элементу html.",
        code: '<html lang="ru">',
        docs: "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html",
      },
      [htmlEl],
    );
  }

  if (!title && headEl) {
    add(
      {
        id: "document-title",
        rule: "document-has-title",
        title: "Нет заголовка страницы",
        description:
          "Заголовок вкладки — первое, что слышит пользователь скринридера. Без него невозможно понять, куда он попал.",
        wcag: "2.4.2",
        severity: "critical",
        fix: "Добавьте уникальный и понятный title в head.",
        code: "<title>Главная — A11yGuard</title>",
        docs: "https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html",
      },
      [headEl],
    );
  }

  const viewport = $('meta[name="viewport"]').attr("content")?.trim() || "";
  if (!viewport && headEl) {
    add(
      {
        id: "meta-viewport",
        rule: "meta-viewport-present",
        title: "Нет meta viewport",
        description:
          "Без viewport мобильные браузеры масштабируют страницу целиком. Пользователям с нарушением зрения приходится зумить вручную.",
        wcag: "1.4.4",
        severity: "warning",
        fix: "Добавьте корректный meta viewport без запрета масштабирования.",
        code: '<meta name="viewport" content="width=device-width, initial-scale=1">',
        docs: "https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html",
      },
      [headEl],
    );
  }

  if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?/i.test(viewport) && headEl) {
    add(
      {
        id: "zoom-lock",
        rule: "meta-viewport-allows-zoom",
        title: "Масштабирование запрещено",
        description:
          "user-scalable=no или maximum-scale=1 блокируют зум. Это критичный барьер для людей со слабым зрением.",
        wcag: "1.4.4",
        severity: "critical",
        fix: "Уберите запрет зума из meta viewport.",
        code: '<meta name="viewport" content="width=device-width, initial-scale=1">',
        docs: "https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html",
      },
      [headEl],
    );
  }

  const images = $("img")
    .toArray()
    .filter((el) => {
      if (isHidden($, el)) return false;
      const role = ($(el).attr("role") || "").toLowerCase();
      return role !== "presentation" && role !== "none";
    });
  const missingAlt = images.filter((el) => $(el).attr("alt") === undefined);
  add(
    {
      id: "image-alt",
      rule: "images-have-alt",
      title: "Изображения без alt",
      description:
        "Если у img нет alt, скринридер читает имя файла или пропускает смысл картинки. Для декоративных изображений нужен пустой alt=\"\".",
      wcag: "1.1.1",
      severity: "critical",
      fix: "Добавьте alt с описанием смысла изображения. Для декоративных — alt=\"\".",
      code: '<img src="chart.png" alt="Рост числа доступных сайтов за 2025 год">',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
    },
    missingAlt,
  );

  const imageInputs = $('input[type="image"]')
    .toArray()
    .filter((el) => !$(el).attr("alt")?.trim());
  add(
    {
      id: "input-image-alt",
      rule: "input-image-has-alt",
      title: "Кнопка-картинка без alt",
      description:
        "input type=\"image\" без alt не имеет доступного имени. Пользователь скринридера не поймёт, что делает кнопка.",
      wcag: "1.1.1",
      severity: "critical",
      fix: "Добавьте alt с названием действия.",
      code: '<input type="image" src="search.svg" alt="Найти">',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
    },
    imageInputs,
  );

  const buttons = $(
    "button, [role='button'], input[type='button'], input[type='submit'], input[type='reset']",
  )
    .toArray()
    .filter((el) => !isHidden($, el));
  const unnamedButtons = buttons.filter((el) => !accessibleName($, el));
  add(
    {
      id: "button-name",
      rule: "buttons-have-name",
      title: "Кнопки без доступного имени",
      description:
        "Кнопка с одной иконкой без текста, aria-label или title превращается для скринридера в «кнопка» без смысла.",
      wcag: "4.1.2",
      severity: "critical",
      fix: "Добавьте видимый текст или aria-label. Иконку пометьте aria-hidden=\"true\".",
      code: '<button type="button" aria-label="Закрыть меню"><svg aria-hidden="true">...</svg></button>',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
    },
    unnamedButtons,
  );

  const links = $("a[href]")
    .toArray()
    .filter((el) => !isHidden($, el));
  const unnamedLinks = links.filter((el) => !accessibleName($, el));
  add(
    {
      id: "link-name",
      rule: "links-have-name",
      title: "Ссылки без понятного текста",
      description:
        "Ссылки «толығырақ», «читать» и иконки без подписи вырываются из контекста. Скринридер часто читает список ссылок отдельно от страницы.",
      wcag: "2.4.4",
      severity: "critical",
      fix: "Сделайте текст ссылки понятным вне контекста или добавьте aria-label.",
      code: '<a href="/news/123">Читать новость о запуске A11yGuard</a>',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html",
    },
    unnamedLinks,
  );

  const fields = $("input, select, textarea")
    .toArray()
    .filter((el) => {
      const type = ($(el).attr("type") || "text").toLowerCase();
      return (
        !["hidden", "submit", "button", "reset", "image"].includes(type) &&
        !isHidden($, el)
      );
    });
  const unlabeledFields = fields.filter((el) => !hasLabel($, el));
  add(
    {
      id: "form-label",
      rule: "form-fields-have-labels",
      title: "Поля формы без подписи",
      description:
        "Placeholder исчезает при вводе и не является подписью. Пользователь скринридера не узнает, что нужно ввести.",
      wcag: "1.3.1",
      severity: "critical",
      fix: "Свяжите поле с label через for/id или добавьте aria-label.",
      code: '<label for="email">Электронная почта</label>\n<input id="email" type="email" autocomplete="email">',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
    },
    unlabeledFields,
  );

  const headings = $("h1, h2, h3, h4, h5, h6")
    .toArray()
    .filter((el) => !isHidden($, el));
  const h1s = headings.filter((el) => el.tagName === "h1");

  if (!headings.length) {
    const bodyEl = firstElement($, "body");
    if (bodyEl) {
      add(
        {
          id: "headings-present",
          rule: "page-has-headings",
          title: "На странице нет заголовков",
          description:
            "Заголовки — это оглавление для скринридера. Без них навигация по длинной странице превращается в чтение всего подряд.",
          wcag: "1.3.1",
          severity: "critical",
          fix: "Добавьте осмысленные h1–h6 по структуре контента.",
          code: "<h1>Заголовок страницы</h1>\n<h2>Раздел</h2>",
          docs: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
        },
        [bodyEl],
      );
    }
  } else {
    if (!h1s.length) {
      add(
        {
          id: "page-h1",
          rule: "page-has-h1",
          title: "Нет главного заголовка H1",
          description:
            "H1 задаёт тему страницы. Его отсутствие затрудняет ориентирование для всех пользователей.",
          wcag: "1.3.1",
          severity: "warning",
          fix: "Добавьте один H1, отражающий суть страницы.",
          code: "<h1>Доступность — не привилегия. Это код.</h1>",
          docs: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
        },
        [headings[0]],
      );
    }

    const jumps: Element[] = [];
    let previousLevel = 0;
    for (const heading of headings) {
      const level = Number(heading.tagName[1]);
      if (previousLevel > 0 && level > previousLevel + 1) {
        jumps.push(heading);
      }
      previousLevel = level;
    }
    add(
      {
        id: "heading-order",
        rule: "heading-order",
        title: "Нарушен порядок заголовков",
        description:
          "Прыжок с H1 на H3 ломает структуру документа. Пользователь скринридера теряет ощущение уровня вложенности.",
        wcag: "1.3.1",
        severity: "warning",
        fix: "Не пропускайте уровни: после H1 идёт H2, после H2 — H3.",
        code: "<h1>Страница</h1>\n<h2>Раздел</h2>\n<h3>Подраздел</h3>",
        docs: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
      },
      jumps,
    );

    if (h1s.length > 1) {
      add(
        {
          id: "multiple-h1",
          rule: "single-h1",
          title: "Несколько H1",
          description:
            "Это не всегда ошибка, но несколько H1 усложняют понимание главной темы страницы.",
          wcag: "1.3.1",
          severity: "info",
          fix: "Оставьте один H1, остальные заголовки понизьте до H2.",
          docs: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
        },
        h1s.slice(1),
      );
    }
  }

  const idMap = new Map<string, Element[]>();
  $("[id]").each((_, el) => {
    const id = $(el).attr("id")?.trim();
    if (!id) return;
    const list = idMap.get(id) ?? [];
    list.push(el);
    idMap.set(id, list);
  });
  const duplicateIds = [...idMap.values()]
    .filter((elements) => elements.length > 1)
    .flat();
  add(
    {
      id: "duplicate-id",
      rule: "unique-ids",
      title: "Повторяющиеся id",
      description:
        "Дубли id ломают aria-labelledby, aria-describedby и переходы по якорям. Браузер и скринридер могут взять не тот элемент.",
      wcag: "4.1.2",
      severity: "warning",
      fix: "Сделайте все id уникальными на странице.",
      code: '<input id="email-1">\n<input id="email-2">',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
    },
    duplicateIds,
  );

  const positiveTabindex = $("[tabindex]")
    .toArray()
    .filter((el) => {
      const value = Number($(el).attr("tabindex"));
      return Number.isFinite(value) && value > 0;
    });
  add(
    {
      id: "positive-tabindex",
      rule: "no-positive-tabindex",
      title: "Положительный tabindex",
      description:
        "tabindex больше нуля перестраивает порядок фокуса и почти всегда ломает ожидаемую навигацию с клавиатуры.",
      wcag: "2.4.3",
      severity: "warning",
      fix: "Используйте tabindex=\"0\" только там, где нужно, и не меняйте естественный порядок.",
      code: '<div role="button" tabindex="0">Открыть</div>',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html",
    },
    positiveTabindex,
  );

  const iframes = $("iframe")
    .toArray()
    .filter(
      (el) =>
        !$(el).attr("title")?.trim() && !$(el).attr("aria-label")?.trim(),
    );
  add(
    {
      id: "iframe-title",
      rule: "iframes-have-title",
      title: "Iframe без названия",
      description:
        "Скринридер объявляет iframe как «фрейм» и не говорит, что внутри. Особенно критично для карт, видео и виджетов оплаты.",
      wcag: "4.1.2",
      severity: "warning",
      fix: "Добавьте title, описывающий содержимое фрейма.",
      code: '<iframe src="https://www.youtube.com/embed/..." title="Видео: как работает A11yGuard"></iframe>',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
    },
    iframes,
  );

  const hiddenFocusable = $('[aria-hidden="true"]')
    .toArray()
    .filter((el) => {
      const $el = $(el);
      return (
        $el.is(
          "a[href], button, input, select, textarea, details, summary, [tabindex]:not([tabindex='-1'])",
        ) ||
        $el.find(
          "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ).length > 0
      );
    });
  add(
    {
      id: "aria-hidden-focus",
      rule: "aria-hidden-not-focusable",
      title: "Фокусируемый элемент скрыт от скринридера",
      description:
        "aria-hidden=\"true\" убирает элемент из дерева доступности, но клавиатура всё ещё может на него попасть. Пользователь видит фокус там, где скринридер молчит.",
      wcag: "4.1.2",
      severity: "critical",
      fix: "Не скрывайте фокусируемые элементы через aria-hidden. Используйте hidden или disabled.",
      code: '<div hidden>...</div>',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
    },
    hiddenFocusable,
  );

  const roleButtonsWithoutKeyboard = $('[role="button"]')
    .toArray()
    .filter((el) => {
      if ($(el).is("button, a[href], input, select, textarea, summary")) {
        return false;
      }
      const $el = $(el);
      return (
        !$el.attr("tabindex") &&
        !$el.attr("onkeydown") &&
        !$el.attr("onkeyup") &&
        !$el.attr("onkeypress")
      );
    });
  add(
    {
      id: "role-button-keyboard",
      rule: "role-button-keyboard",
      title: "role=\"button\" без клавиатуры",
      description:
        "Элемент с role=\"button\" должен быть фокусируемым и реагировать на Enter/Space. Иначе мышью пользоваться можно, а клавиатурой — нет.",
      wcag: "2.1.1",
      severity: "warning",
      fix: "Используйте настоящий button или добавьте tabindex=\"0\" и обработку клавиатуры.",
      code: '<button type="button">Открыть</button>',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
    },
    roleButtonsWithoutKeyboard,
  );

  const clickOnly = $("[onclick]")
    .toArray()
    .filter((el) => {
      if ($(el).is("a[href], button, input, select, textarea, summary")) {
        return false;
      }
      const $el = $(el);
      return (
        !$el.attr("role") &&
        !$el.attr("tabindex") &&
        !$el.attr("onkeydown") &&
        !$el.attr("onkeyup") &&
        !$el.attr("onkeypress")
      );
    });
  add(
    {
      id: "click-without-keyboard",
      rule: "click-without-keyboard",
      title: "Клик без клавиатурной альтернативы",
      description:
        "Обработчик onclick на div или span недоступен с клавиатуры. Это один из самых частых барьеров в самописных интерфейсах.",
      wcag: "2.1.1",
      severity: "warning",
      fix: "Используйте button или добавьте role, tabindex и обработку клавиатуры.",
      code: '<button type="button" onclick="openMenu()">Меню</button>',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
    },
    clickOnly,
  );

  const videosWithoutCaptions = $("video")
    .toArray()
    .filter(
      (el) =>
        $(el).find('track[kind="captions"], track[kind="subtitles"]').length === 0,
    );
  add(
    {
      id: "video-captions",
      rule: "video-has-captions",
      title: "Видео без субтитров",
      description:
        "Субтитры нужны не только глухим: они помогают при шуме, плохом звуке и в общественных местах. Автоматика не может проверить качество, но видит отсутствие track.",
      wcag: "1.2.2",
      severity: "warning",
      fix: "Добавьте track kind=\"captions\" с файлом субтитров.",
      code: '<track kind="captions" src="/captions/ru.vtt" srclang="ru" label="Русский">',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html",
    },
    videosWithoutCaptions,
  );

  const metaRefresh = $("meta")
    .toArray()
    .filter(
      (el) => ($(el).attr("http-equiv") || "").toLowerCase() === "refresh",
    );
  add(
    {
      id: "meta-refresh",
      rule: "no-meta-refresh",
      title: "Автоматическое обновление страницы",
      description:
        "meta refresh внезапно перезагружает страницу и сбрасывает позицию пользователя. Это мешает чтению и работе с формами.",
      wcag: "2.2.1",
      severity: "warning",
      fix: "Уберите автообновление или дайте пользователю контроль над ним.",
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html",
    },
    metaRefresh,
  );

  const movingElements = $("marquee, blink").toArray();
  add(
    {
      id: "moving-content",
      rule: "no-marquee-blink",
      title: "Движущийся контент",
      description:
        "marquee и blink отвлекают, плохо читаются и не останавливаются по запросу пользователя.",
      wcag: "2.2.2",
      severity: "warning",
      fix: "Уберите бегущую строку или дайте кнопку паузы.",
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html",
    },
    movingElements,
  );

  const tablesWithoutHeaders = $("table")
    .toArray()
    .filter((el) => {
      const role = ($(el).attr("role") || "").toLowerCase();
      if (role === "presentation" || role === "none") return false;
      return (
        $(el).find("th").length === 0 && $(el).find("td").length > 0
      );
    });
  add(
    {
      id: "table-headers",
      rule: "data-tables-have-headers",
      title: "Таблица без заголовков",
      description:
        "Без th скринридер не связывает ячейки со столбцами. Пользователь слышит набор чисел без контекста.",
      wcag: "1.3.1",
      severity: "warning",
      fix: "Добавьте th для заголовков строк и столбцов. Для layout-таблиц используйте role=\"presentation\".",
      code: "<table>\n  <caption>Бюджет</caption>\n  <tr><th scope=\"col\">Год</th><th scope=\"col\">Сумма</th></tr>\n</table>",
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
    },
    tablesWithoutHeaders,
  );

  const untitledEmbeds = $("object, embed")
    .toArray()
    .filter(
      (el) =>
        !$(el).attr("title")?.trim() && !$(el).attr("aria-label")?.trim(),
    );
  add(
    {
      id: "embed-title",
      rule: "embeds-have-title",
      title: "Встроенный объект без названия",
      description:
        "object и embed без title не сообщают, что внутри: PDF, карта, анимация или плеер.",
      wcag: "4.1.2",
      severity: "warning",
      fix: "Добавьте title с описанием встроенного объекта.",
      code: '<object data="/report.pdf" type="application/pdf" title="Годовой отчёт за 2025 год"></object>',
      docs: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
    },
    untitledEmbeds,
  );

  const firstLinks = $("body a[href^='#']").slice(0, 8).toArray();
  const hasSkipLink = firstLinks.some((el) =>
    /skip|перейти|өт|мазмұн|негізгі|main content/i.test($(el).text()),
  );
  if (!hasSkipLink) {
    const bodyEl = firstElement($, "body");
    if (bodyEl) {
      add(
        {
          id: "skip-link",
          rule: "skip-link",
          title: "Нет ссылки «Перейти к содержанию»",
          description:
            "Без skip-link пользователь клавиатуры проходит через всё меню на каждой странице. Это не всегда нарушение WCAG, но сильное улучшение.",
          wcag: "2.4.1",
          severity: "info",
          fix: "Добавьте первой ссылкой на странице переход к main.",
          code: '<a class="skip-link" href="#main">Перейти к содержанию</a>',
          docs: "https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html",
        },
        [bodyEl],
      );
    }
  }

  issues.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.count - a.count,
  );

  const countBy = (severity: Severity) =>
    issues
      .filter((issue) => issue.severity === severity)
      .reduce((total, issue) => total + issue.count, 0);

  const stats = {
    blockers: countBy("blocker"),
    critical: countBy("critical"),
    warnings: countBy("warning"),
    infos: countBy("info"),
    totalViolations: issues.reduce((total, issue) => total + issue.count, 0),
    totalRules: issues.length,
    elementsChecked: $("*").length,
  };

  const penalty = issues.reduce(
    (total, issue) =>
      total + SEVERITY_WEIGHT[issue.severity] * Math.min(issue.count, 4),
    0,
  );
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    url: url.toString(),
    finalUrl: fetched.finalUrl,
    scannedAt: new Date().toISOString(),
    title: title || new URL(fetched.finalUrl).hostname,
    lang,
    score,
    grade: gradeFor(score),
    stats,
    issues,
    manualChecks: MANUAL_CHECKS,
    meta: {
      status: fetched.status,
      responseTimeMs: fetched.responseTimeMs,
      htmlBytes: Buffer.byteLength(fetched.html, "utf8"),
    },
  };
}
