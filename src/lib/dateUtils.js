const FIRST_COMIC_DATE = '1989-04-16';
const LAST_COMIC_DATE = '2023-03-12';
const FIRST_YEAR = 1989;
const LAST_YEAR = 2023;

const LONG_DATE = { year: 'numeric', month: 'long', day: 'numeric' };
const SHORT_DATE = { year: 'numeric', month: 'short', day: 'numeric' };

export function formatDate(dateString, options = LONG_DATE) {
  return new Date(dateString).toLocaleDateString('en-US', options);
}

export function formatShortDate(dateString) {
  return formatDate(dateString, SHORT_DATE);
}

export function isValidComicDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const [year, month, day] = date.split('-').map(Number);
  const comicDate = new Date(year, month - 1, day);

  return (
    comicDate.getFullYear() === year &&
    comicDate.getMonth() === month - 1 &&
    comicDate.getDate() === day &&
    year >= FIRST_YEAR
  );
}

export function isValidComicDateRange(date) {
  return date >= FIRST_COMIC_DATE && date <= LAST_COMIC_DATE;
}

export function getDateRangeForYear(year) {
  const yearNum = Number(year);
  if (yearNum === FIRST_YEAR) return { start: FIRST_COMIC_DATE, end: `${FIRST_YEAR}-12-31` };
  if (yearNum === LAST_YEAR) return { start: `${LAST_YEAR}-01-01`, end: LAST_COMIC_DATE };
  if (yearNum > FIRST_YEAR && yearNum < LAST_YEAR) {
    return { start: `${yearNum}-01-01`, end: `${yearNum}-12-31` };
  }
  return null;
}

export function getFirstComicDate() {
  return FIRST_COMIC_DATE;
}

export function getLastComicDate() {
  return LAST_COMIC_DATE;
}
