const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayIso = () => iso(new Date());

export function fromIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtTime(d) {
  const date = typeof d === 'string' ? fromIso(d) : d;
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function timeFromHM(hm = '09:00') {
  const [h, m] = hm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return fmtTime(d);
}

export function fmtDayMeta(dateStr, timeStr) {
  const d = fromIso(dateStr);
  const t = timeStr ? ` · ${timeStr}` : '';
  return `${DAY[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}${t}`;
}

export function fmtHeaderDate(d = new Date()) {
  return `${DAY_FULL[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

export function fmtLongDate(dateStr) {
  const d = fromIso(dateStr);
  return `${DAY_FULL[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

export const longDate = fmtLongDate;

export function longDateTime(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}, ${fmtTime(d)}`;
}

export function monthLabel(year, month) {
  return `${MONTH[month]} ${year}`;
}

export function shortMonthLabel(dateStr) {
  const d = fromIso(dateStr);
  return `${MONTH[d.getMonth()]} ${d.getFullYear()}`;
}

export function buildMonthGrid(year, month, weekStartsOn = 1) {
  const first = new Date(year, month, 1);
  const shift = (first.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(year, month, 1 - shift);
  const weeks = [];
  const cur = new Date(start);
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(row);
    if (cur.getMonth() !== month && w >= 4) break;
  }
  return weeks;
}

export function weekdayLabels(weekStartsOn = 1) {
  const base = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const sunFirst = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return weekStartsOn === 1 ? base : sunFirst;
}

export function wordCount(text = '') {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function relativeDays(dateStr) {
  const then = fromIso(dateStr);
  const now = new Date();
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
      new Date(then.getFullYear(), then.getMonth(), then.getDate())) /
      86400000
  );
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function streakOf(dateStrs) {
  const set = new Set(dateStrs);
  const d = new Date();
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(iso(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
