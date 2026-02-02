// Netlify Function: Create PIX Payment
// Path: netlify/functions/create-pix.js

const mercadopago = require('mercadopago');

// Configurar Access Token do Mercado Pago
const ACCESS_TOKEN = 'TEST-861897508909678-020211-a341f8eaad70bcc352afa028a9339b8d-136456359';

exports.handler = async (event, context) => {
    // Permitir CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { transaction_amount, description, payer, external_reference } = JSON.parse(event.body);

        // Configurar Mercado Pago
        mercadopago.configure({
            access_token: ACCESS_TOKEN
        });

        // Criar pagamento PIX
        const payment = await mercadopago.payment.create({
            transaction_amount: parseFloat(transaction_amount),
            description: description,
            payment_method_id: 'pix',
            payer: {
                email: payer.email,
                first_name: payer.first_name,
                last_name: payer.last_name || payer.first_name
            },
            external_reference: external_reference,
            notification_url: `https://www.borjaoskins.com/.netlify/functions/webhook`
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(payment.body)
        };

    } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Erro ao criar pagamento',
                message: error.message 
            })
        };
    }
};
