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
  
  console.log('📥 Inspect link recebido:', inspectLink);
  
  if (!inspectLink) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Inspect link obrigatório', float: null })
    };
  }
  
  try {
    // Decodificar URL (caso venha com %20 ou %2520)
    const decodedLink = decodeURIComponent(inspectLink);
    console.log('🔓 Link decodificado:', decodedLink);
    
    // Extrair D-value do inspect link
    // Formato: steam://rungame/730/.../+csgo_econ_action_preview S{owner}A{asset}D{float}
    const dMatch = decodedLink.match(/D(\d+)/);
    
    if (!dMatch) {
      console.log('⚠️ D-value não encontrado no link');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'D-value não encontrado',
          float: null 
        })
      };
    }
    
    const dValue = dMatch[1];
    console.log('🔍 D-value encontrado:', dValue);
    
    // Converter D-value para float
    // Float = D-value / (2^64 - 1) ≈ D-value / 10^16
    const floatValue = parseFloat(dValue) / 10000000000000000;
    
    console.log('🎯 Float calculado:', floatValue);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        float: floatValue,
        method: 'd_value',
        d_value: dValue
      })
    };
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        float: null
      })
    };
  }
};
