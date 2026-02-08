const https = require('https');

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
    // Decodificar URL
    let decodedLink = inspectLink;
    let previousLink = '';
    
    while (decodedLink !== previousLink) {
      previousLink = decodedLink;
      try {
        decodedLink = decodeURIComponent(decodedLink);
      } catch (e) {
        break;
      }
    }
    
    console.log('🔓 Link decodificado:', decodedLink);
    
    // Extrair parâmetros S, A, D, M
    const sMatch = decodedLink.match(/S(\d+)/);
    const aMatch = decodedLink.match(/A(\d+)/);
    const dMatch = decodedLink.match(/D(\d+)/);
    const mMatch = decodedLink.match(/M(\d+)/);
    
    if (!sMatch || !aMatch || !dMatch) {
      console.log('⚠️ Parâmetros não encontrados');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Inspect link inválido',
          float: null 
        })
      };
    }
    
    const s = sMatch[1];
    const a = aMatch[1];
    const d = dMatch[1];
    const m = mMatch ? mMatch[1] : '0';
    
    console.log(`📊 Parâmetros: S=${s}, A=${a}, D=${d}, M=${m}`);
    
    // API Key do PriceEmpire
    const apiKey = process.env.PRICEMPIRE_API_KEY;
    console.log('🔑 API Key configurada:', !!apiKey);
    
    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'PRICEMPIRE_API_KEY não configurada. Configure em: Site Settings > Environment Variables',
          float: null
        })
      };
    }
    
    // Endpoint correto: POST /api/v2/inspect
    const apiUrl = 'api.pricempire.com';
    const path = '/api/v2/inspect';
    
    console.log(`🌐 Chamando PriceEmpire: https://${apiUrl}${path}`);
    
    const postData = JSON.stringify({
      inspect_link: decodedLink
    });
    
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: apiUrl,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-api-key': apiKey,
          'User-Agent': 'Mozilla/5.0'
        }
      };
      
      const req = https.request(options, (res) => {
        let body = '';
        
        console.log('📡 Status:', res.statusCode);
        
        res.on('data', chunk => body += chunk);
        
        res.on('end', () => {
          console.log('📄 Response (500 chars):', body.substring(0, 500));
          
          if (res.statusCode === 401) {
            reject(new Error('API Key inválida. Verifique sua PRICEMPIRE_API_KEY'));
            return;
          }
          
          if (res.statusCode === 429) {
            reject(new Error('Rate limit excedido. Aguarde alguns minutos'));
            return;
          }
          
          if (res.statusCode !== 200) {
            reject(new Error(`API retornou status ${res.statusCode}: ${body}`));
            return;
          }
          
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            console.error('❌ JSON inválido:', e.message);
            reject(new Error('Resposta não é JSON válido'));
          }
        });
      });
      
      req.on('error', (err) => {
        console.error('❌ Erro na requisição:', err.message);
        reject(err);
      });
      
      req.write(postData);
      req.end();
    });
    
    console.log('✅ Dados recebidos da PriceEmpire');
    
    // Extrair float da resposta
    // A resposta pode vir em diferentes formatos, tentamos todos
    const floatValue = data?.float_value || 
                       data?.floatvalue || 
                       data?.paintwear || 
                       data?.wear || 
                       data?.iteminfo?.floatvalue ||
                       null;
    
    console.log('🎯 Float extraído:', floatValue);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        float: floatValue,
        data: data
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
