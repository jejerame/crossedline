const STORAGE_KEY = "seonneomne-usage";
const DAILY_LIMIT = 10;

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function readUsage(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayString(), count: 0 };
    const parsed = JSON.parse(raw) as { date: string; count: number };
    if (parsed.date !== todayString()) return { date: todayString(), count: 0 };
    return parsed;
  } catch {
    return { date: todayString(), count: 0 };
  }
}

export function canUseSearch(): boolean {
  return readUsage().count < DAILY_LIMIT;
}

export function consumeSearch(): void {
  const usage = readUsage();
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayString(), count: usage.count + 1 })
    );
  } catch {
    // localStorage 사용 불가 환경은 무시
  }
}
