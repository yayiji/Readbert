import { json } from '@sveltejs/kit';
import { getAvailableYears, getRandomComicFromYear, getPreviousComic, getNextComic, getTranscriptByDate } from '$lib/server/comicsServer.js';

export async function GET() {
  try {
    // Get random comic from all available years
    const availableYears = await getAvailableYears();
    
    if (availableYears.length === 0) {
      return json({ success: false, error: 'No comics found' }, { status: 404 });
    }
    
    // Pick a random year and then a random comic from that year
    const randomYear = availableYears[Math.floor(Math.random() * availableYears.length)];
    const comic = await getRandomComicFromYear(randomYear);
    
    if (!comic) {
      return json({ success: false, error: 'No comics found' }, { status: 404 });
    }

    // Get navigation comics using cross-year navigation functions
    const previousComic = await getPreviousComic(comic.date);
    const nextComic = await getNextComic(comic.date);

    // Load transcript for the random comic
    const transcript = await getTranscriptByDate(comic.date);
    
    return json({
      success: true,
      comic,
      previousComic,
      nextComic,
      transcript
    });
    
  } catch (error) {
    console.error('Error in random API:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
