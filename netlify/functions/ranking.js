import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL, // variável de ambiente do Netlify
  process.env.SUPABASE_KEY  // variável de ambiente do Netlify
);

export async function handler(event, context) {
  try {
    const { data, error } = await supabase
      .from('ranking_points')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(100);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
