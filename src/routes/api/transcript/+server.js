import { json } from '@sveltejs/kit';
import { getTranscriptByDate } from '$lib/server/comicsServer.js';

export async function GET({ url }) {
  try {
    const date = url.searchParams.get('date');
    
    if (!date) {
      return json({ success: false, error: 'Date parameter required' }, { status: 400 });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Fetch transcript independently using server-side function
    const transcript = await getTranscriptByDate(date);
    
    if (!transcript) {
      return json({ success: false, error: 'Transcript not found' }, { status: 404 });
    }
    
    return json({
      success: true,
      transcript,
      date
    });
    
  } catch (error) {
    console.error('Error in transcript API:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
