const { MercadoPagoConfig, Payment } = require('mercadopago');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        console.log('🔵 create-pix chamada');
        console.log('📥 Body:', event.body);

        const body = JSON.parse(event.body);
        const { sale_id, amount, buyer_email, buyer_name } = body;

        console.log('📦 Dados:', { sale_id, amount, buyer_email, buyer_name });

        // Validações
        if (!amount || isNaN(amount) || amount <= 0) {
            console.error('❌ Valor inválido:', amount);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid amount' })
            };
        }

        if (!buyer_email) {
            console.error('❌ Email faltando');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Buyer email required' })
            };
        }

        if (!process.env.MP_ACCESS_TOKEN) {
            console.error('❌ MP_ACCESS_TOKEN não configurado');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Mercado Pago não configurado' })
            };
        }

        console.log('✅ Validações OK');

        // Mercado Pago Client
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN
        });

        const payment = new Payment(client);

        // Separar nome
        const nameParts = (buyer_name || 'Cliente').split(' ');
        const firstName = nameParts[0] || 'Cliente';
        const lastName = nameParts.slice(1).join(' ') || 'PIX';

        const paymentData = {
            transaction_amount: parseFloat(amount),
            description: `Rifa - Venda ${sale_id || 'N/A'}`,
            payment_method_id: 'pix',
            payer: {
                email: buyer_email,
                first_name: firstName,
                last_name: lastName
            },
            external_reference: sale_id || `PIX-${Date.now()}`,
            notification_url: `${process.env.URL || 'https://www.borjaoskins.com'}/.netlify/functions/webhook`
        };

        console.log('📤 Enviando para MP:', {
            amount: paymentData.transaction_amount,
            email: paymentData.payer.email,
            reference: paymentData.external_reference
        });

        const result = await payment.create({ body: paymentData });

        console.log('✅ PIX criado:', {
            id: result.id,
            status: result.status,
            amount: result.transaction_amount
        });

        // Extrair QR Code
        const qrCode = result.point_of_interaction?.transaction_data?.qr_code || result.qr_code;
        const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64 || result.qr_code_base64;

        console.log('🔍 QR Code:', !!qrCode);
        console.log('🔍 QR Base64:', !!qrCodeBase64);

        if (!qrCode || !qrCodeBase64) {
            console.error('❌ QR Code não retornado pelo MP');
            console.error('Resposta completa:', JSON.stringify(result, null, 2));
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'QR Code não gerado',
                    payment_id: result.id
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                payment_id: result.id,
                qr_code: qrCode,
                qr_code_base64: qrCodeBase64,
                status: result.status
            })
        };

    } catch (error) {
        console.error('❌ Erro:', error);
        console.error('Stack:', error.stack);
        console.error('Response:', error.response?.data);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Payment creation failed',
                message: error.message,
                details: error.response?.data || error.stack
            })
        };
    }
};
