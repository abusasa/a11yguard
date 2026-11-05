import { NextResponse } from "next/server";
import { scanUrl } from "@/lib/scanner";

export const maxDuration = 30;

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Некорректный запрос. Нужен JSON с полем url." },
      { status: 400 },
    );
  }

  const url =
    typeof payload === "object" && payload !== null && "url" in payload
      ? (payload as { url?: unknown }).url
      : undefined;

  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json(
      { error: "Введите адрес сайта, например https://example.kz" },
      { status: 400 },
    );
  }

  try {
    const result = await scanUrl(url);
    return NextResponse.json(result, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось проверить сайт. Попробуйте другой адрес.";

    return NextResponse.json(
      {
        error: message,
        hint: "Проверьте адрес и доступность сайта. Мы не сканируем локальные и внутренние сети.",
      },
      { status: 422 },
    );
  }
}
