/**
 * Date utilities and configuration for Dilbert comics
 * Pure date functions with no external dependencies
 */

// ===== CONFIGURATION =====

const COMIC_DATE_RANGES = {
  '1989': { start: '1989-04-16', end: '1989-12-31' },
  '1990': { start: '1990-01-01', end: '1990-12-31' },
  '1991': { start: '1991-01-01', end: '1991-12-31' },
  '1992': { start: '1992-01-01', end: '1992-12-31' },
  '1993': { start: '1993-01-01', end: '1993-12-31' },
  '1994': { start: '1994-01-01', end: '1994-12-31' },
  '1995': { start: '1995-01-01', end: '1995-12-31' },
  '1996': { start: '1996-01-01', end: '1996-12-31' },
  '1997': { start: '1997-01-01', end: '1997-12-31' },
  '1998': { start: '1998-01-01', end: '1998-12-31' },
  '1999': { start: '1999-01-01', end: '1999-12-31' },
  '2000': { start: '2000-01-01', end: '2000-12-31' },
  '2001': { start: '2001-01-01', end: '2001-12-31' },
  '2002': { start: '2002-01-01', end: '2002-12-31' },
  '2003': { start: '2003-01-01', end: '2003-12-31' },
  '2004': { start: '2004-01-01', end: '2004-12-31' },
  '2005': { start: '2005-01-01', end: '2005-12-31' },
  '2006': { start: '2006-01-01', end: '2006-12-31' },
  '2007': { start: '2007-01-01', end: '2007-12-31' },
  '2008': { start: '2008-01-01', end: '2008-12-31' },
  '2009': { start: '2009-01-01', end: '2009-12-31' },
  '2010': { start: '2010-01-01', end: '2010-12-31' },
  '2011': { start: '2011-01-01', end: '2011-12-31' },
  '2012': { start: '2012-01-01', end: '2012-12-31' },
  '2013': { start: '2013-01-01', end: '2013-12-31' },
  '2014': { start: '2014-01-01', end: '2014-12-31' },
  '2015': { start: '2015-01-01', end: '2015-12-31' },
  '2016': { start: '2016-01-01', end: '2016-12-31' },
  '2017': { start: '2017-01-01', end: '2017-12-31' },
  '2018': { start: '2018-01-01', end: '2018-12-31' },
  '2019': { start: '2019-01-01', end: '2019-12-31' },
  '2020': { start: '2020-01-01', end: '2020-12-31' },
  '2021': { start: '2021-01-01', end: '2021-12-31' },
  '2022': { start: '2022-01-01', end: '2022-12-31' },
  '2023': { start: '2023-01-01', end: '2023-03-12' }
};

// ===== DATE FORMATTING =====

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ===== DATE VALIDATION =====

export function isValidComicDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const [year, month, day] = date.split('-').map(Number);
  const comicDate = new Date(year, month - 1, day);

  if (
    comicDate.getFullYear() !== year ||
    comicDate.getMonth() !== month - 1 ||
    comicDate.getDate() !== day
  ) {
    return false;
  }

  return year >= 1989;
}

export function isValidComicDateRange(date) {
  const firstDate = getFirstComicDate();
  const lastDate = getLastComicDate();
  if (!firstDate || !lastDate) return false;
  return date >= firstDate && date <= lastDate;
}

// ===== DATE RANGE OPERATIONS =====

export function getDateRangeForYear(year) {
  return COMIC_DATE_RANGES[year] || null;
}

export function getFirstComicDate() {
  const years = Object.keys(COMIC_DATE_RANGES).sort();
  if (years.length === 0) return null;
  return COMIC_DATE_RANGES[years[0]].start;
}

export function getLastComicDate() {
  const years = Object.keys(COMIC_DATE_RANGES).sort();
  if (years.length === 0) return null;
  const lastYear = years[years.length - 1];
  return COMIC_DATE_RANGES[lastYear].end;
}

// ===== DATE GENERATION =====

export function generateComicDatesForYear(year) {
  const dateRange = getDateRangeForYear(year);
  if (!dateRange) {
    console.warn(`No date range defined for year ${year}`);
    return [];
  }

  const dates = [];
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}
