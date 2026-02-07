const cache = {};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const name = event.queryStringParameters?.name;
  if (!name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Nome da skin obrigatório' })
    };
  }

  // Cache 10 min
  if (cache[name] && Date.now() - cache[name].time < 600000) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cache[name].data)
    };
  }

  try {
    const searchUrl = `https://buff.163.com/api/market/goods/search?game=csgo&page_num=1&search=${encodeURIComponent(name)}`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const data = await res.json();

    const item = data?.data?.items?.[0];

    const result = {
      success: true,
      price: item?.sell_min_price || null,
      name: item?.name || null
    };

    cache[name] = {
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
