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
    // Extrair float do D-value no inspect link
    // Formato: steam://rungame/730/.../+csgo_econ_action_preview S{owner}A{asset}D{float_encoded}
    const dMatch = inspectLink.match(/D(\d+)/);
    
    if (!dMatch) {
      console.log('⚠️ Nenhum D-value encontrado');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          float: null,
          error: 'No D-value found in link'
        })
      };
    }

    const dValue = dMatch[1];
    console.log('🔍 D-value:', dValue);

    // Converter D-value para float
    // Float = D-value / (2^64 - 1)
    // Aproximação: D-value / 10^16
    const floatValue = parseFloat(dValue) / 10000000000000000;
    
    console.log('🎯 Float:', floatValue);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        float: floatValue,
        method: 'd_value'
      })
    };

  } catch (error) {
    console.error('💥 Erro:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        float: null,
        success: false
      })
    };
  }
};
