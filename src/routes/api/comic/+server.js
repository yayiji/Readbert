import { json } from '@sveltejs/kit';
import { getComicByDate, getPreviousComic, getNextComic, getComicsForYear, getTranscriptByDate } from '$lib/server/comicsServer.js';

export async function GET({ url }) {
  try {
    const date = url.searchParams.get('date');
    
    if (!date) {
      return json({ success: false, error: 'Date parameter required' }, { status: 400 });
    }
    
    const comic = await getComicByDate(date);
    
    if (!comic) {
      return json({ success: false, error: 'Comic not found' }, { status: 404 });
    }

    // Get navigation comics using the cross-year navigation functions
    const previousComic = await getPreviousComic(date);
    const nextComic = await getNextComic(date);

    // Load transcript for the current comic
    const transcript = await getTranscriptByDate(date);
    
    return json({
      success: true,
      comic,
      previousComic,
      nextComic,
      transcript
    });
    
  } catch (error) {
    console.error('Error in comic API:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
