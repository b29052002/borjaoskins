// Netlify Function: Webhook Mercado Pago
// SDK v2

const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

// ===== SUPABASE =====
const SUPABASE_URL = 'https://yyoyxanloloupwoczkhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3l4YW5sb2xvdXB3b2N6a2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODM2MjYsImV4cCI6MjA4NTI1OTYyNn0.yV9UszxZW0Ee5X6Zj8OLo1Q_uQfj99RJviaZIImiMAM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== MERCADO PAGO =====
const client = new MercadoPagoConfig({
  accessToken: 'APP_USR-861897508909678-020211-124d4fa380e582c73f57be0350a9945a-136456359'
});

const payment = new Payment(client);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('📩 Webhook recebido:', body);

    // Aceita os dois formatos que o MP envia
    const paymentId =
      body?.data?.id ||
      body?.id;

    if (!paymentId) {
      console.log('⚠️ Nenhum paymentId encontrado');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ignored: true })
      };
    }

    console.log('💳 Payment ID:', paymentId);

    // BUSCAR PAGAMENTO NO MP
    const paymentInfo = await payment.get(paymentId);

    console.log('📊 Status:', paymentInfo.status);
    console.log('🔖 External Reference:', paymentInfo.external_reference);

    if (paymentInfo.status === 'approved') {
      const saleId = paymentInfo.external_reference;

      if (!saleId) {
        console.log('⚠️ Pagamento aprovado sem external_reference');
      } else {
        const { error } = await supabase
          .from('raffle_sales')
          .update({
            payment_status: 'approved',
            payment_id: paymentId,
            paid_at: new Date().toISOString()
          })
          .eq('id', saleId);

        if (error) {
          console.error('❌ Erro Supabase:', error);
        } else {
          console.log('✅ Venda atualizada no Supabase');
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('❌ Erro no webhook:', err);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Webhook error',
        message: err.message
      })
    };
  }
};
