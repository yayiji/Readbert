/**
 * Configuration constants for Dilbert comics
 * Central location for all comic-related configuration
 */

/**
 * Define the actual date ranges for comics by year
 * This prevents generating invalid dates beyond the actual comic collection
 */
export const COMIC_DATE_RANGES = {
  '1989': { start: '1989-04-16', end: '1989-12-31' }, // Dilbert started April 16, 1989
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
  '2023': { start: '2023-01-01', end: '2023-03-12' }  // Comics end on March 12, 2023
};

/**
 * All available years that have completed transcripts
 *
 * 🔧 HOW TO ADD NEW YEARS:
 * When you finish transcribing a new year, add it to this array.
 * Example: After transcribing 2024, add '2024' to the array
 */
export const TRANSCRIBED_YEARS = [
  '1989', '1990', '1991', '1992', '1993',
  '1994', '1995', '1996', '1997', '1998',
  '1999', '2000', '2001', '2002', '2003',
  '2004', '2005', '2006', '2007', '2008',
  '2009', '2010', '2011', '2012', '2013',
  '2014', '2015', '2016', '2017', '2018',
  '2019', '2020', '2021', '2022', '2023'
];
