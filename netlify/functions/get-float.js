exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const inspectLink = event.queryStringParameters?.url;

  console.log('📥 Inspect link:', inspectLink);

  if (!inspectLink) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'URL obrigatória' })
    };
  }

  try {
    // Chamada real para API de inspect
    const apiUrl = `https://api.csfloat.com/?url=${encodeURIComponent(inspectLink)}`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const data = await response.json();

    console.log('📦 CSFloat response:', data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        float: data?.iteminfo?.floatvalue || null
      })
    };

  } catch (error) {
    console.error('💥 Erro:', error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        float: null,
        error: error.message
      })
    };
  }
};
