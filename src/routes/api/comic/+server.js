import { json } from '@sveltejs/kit';
import { getComicByDate, getPreviousComic, getNextComic } from '$lib/browser/comicsClient.js';

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

    // Get navigation comics using browser-side functions
    const previousComic = await getPreviousComic(date);
    const nextComic = await getNextComic(date);

    // Transcript will be loaded client-side
    
    return json({
      success: true,
      comic,
      previousComic,
      nextComic
    });
    
  } catch (error) {
    console.error('Error in comic API:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
