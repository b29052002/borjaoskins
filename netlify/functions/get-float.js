const cache = {};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const inspect = event.queryStringParameters?.url;
  if (!inspect) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'URL obrigatória' })
    };
  }

  // Cache por 5 minutos
  if (cache[inspect] && Date.now() - cache[inspect].time < 300000) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cache[inspect].data)
    };
  }

  try {
    const api = `https://api.csfloat.com/?url=${encodeURIComponent(inspect)}`;

    const response = await fetch(api);
    const data = await response.json();

    const result = {
      success: true,
      float: data?.iteminfo?.floatvalue || null
    };

    cache[inspect] = {
      time: Date.now(),
      data: result
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
