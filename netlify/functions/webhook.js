// Netlify Function: Webhook Mercado Pago
// SDK v2

const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://yyoyxanloloupwoczkhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3l4YW5sb2xvdXB3b2N6a2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODM2MjYsImV4cCI6MjA4NTI1OTYyNn0.yV9UszxZW0Ee5X6Zj8OLo1Q_uQfj99RJviaZIImiMAM';

// Inicializar Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Inicializar Mercado Pago Client - PRODUÇÃO
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

        // Mercado Pago envia notificações de diferentes tipos
        if (body.type === 'payment' || body.action === 'payment.updated') {
            const paymentId = body.data.id;
            console.log('💳 Payment ID:', paymentId);

            // Buscar informações do pagamento (SDK v2 syntax)
            const paymentInfo = await payment.get({ id: paymentId });
            
            console.log('📊 Status do pagamento:', paymentInfo.status);
            console.log('🔖 External reference:', paymentInfo.external_reference);

            // Se pagamento foi aprovado
            if (paymentInfo.status === 'approved') {
                const saleId = paymentInfo.external_reference;
                console.log('✅ Pagamento aprovado! Sale ID:', saleId);

                // Atualizar status no Supabase
                const { data, error } = await supabase
                    .from('raffle_sales')
                    .update({ 
                        payment_status: 'approved',
                        payment_id: paymentId
                    })
                    .eq('id', saleId);

                if (error) {
                    console.error('❌ Erro ao atualizar Supabase:', error);
                } else {
                    console.log('✅ Supabase atualizado com sucesso!');
                }
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        console.error('❌ Error message:', error.message);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Webhook processing failed',
                message: error.message 
            })
        };
    }
};
