import { json } from '@sveltejs/kit';

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

    // Return transcript URL for client-side fetching
    const year = date.split('-')[0];
    const transcriptUrl = `/dilbert-transcripts/${year}/${date}.json`;
    
    return json({
      success: true,
      transcriptUrl,
      date,
      message: 'Use transcriptUrl for client-side fetching'
    });
    
  } catch (error) {
    console.error('Error in transcript API:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
