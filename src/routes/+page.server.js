import { getAvailableYearsBrowser, getRandomComicFromYear, getPreviousComic, getNextComic, getComicsForYear } from '$lib/browser/comicsClient.js';

export async function load({ url }) {
  // Get all available years with transcripts using browser-side logic
  const availableYears = await getAvailableYearsBrowser();
  
  // Get all comics from all available years
  const allComics = [];
  for (const year of availableYears) {
    const yearComics = await getComicsForYear(year);
    allComics.push(...yearComics);
  }
  
  // Get a random comic from all available comics for the homepage
  let randomComic = null;
  if (allComics.length > 0) {
    const randomIndex = Math.floor(Math.random() * allComics.length);
    randomComic = allComics[randomIndex];
  }
  
  // Get navigation comics (across all years) using browser-side logic
  let previousComic = null;
  let nextComic = null;
  
  if (randomComic) {
    previousComic = await getPreviousComic(randomComic.date);
    nextComic = await getNextComic(randomComic.date);
  }

  // Transcript will be loaded client-side
  
  return {
    randomComic,
    previousComic,
    nextComic
  };
}
