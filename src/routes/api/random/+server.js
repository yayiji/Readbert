import { json } from '@sveltejs/kit';
import { getAvailableYearsBrowser, getRandomComicFromYear, getPreviousComic, getNextComic } from '$lib/browser/comicsClient.js';

export async function GET() {
  try {
    // Get random comic from all available years using browser-side logic
    const availableYears = await getAvailableYearsBrowser();
    
    if (availableYears.length === 0) {
      return json({ success: false, error: 'No comics found' }, { status: 404 });
    }
    
    // Pick a random year and then a random comic from that year
    const randomYear = availableYears[Math.floor(Math.random() * availableYears.length)];
    const comic = await getRandomComicFromYear(randomYear);
    
    if (!comic) {
      return json({ success: false, error: 'No comics found' }, { status: 404 });
    }

    // Get navigation comics using browser-side functions
    const previousComic = await getPreviousComic(comic.date);
    const nextComic = await getNextComic(comic.date);

    // Transcript will be loaded client-side
    
    return json({
      success: true,
      comic,
      previousComic,
      nextComic
    });
    
  } catch (error) {
    console.error('Error in random API:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
