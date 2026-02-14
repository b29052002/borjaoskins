const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Log para debug
    console.log('🔵 reserve-numbers chamada');
    console.log('Method:', event.httpMethod);
    console.log('Body:', event.body);

    // Apenas POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse do body
        let requestData;
        try {
            requestData = JSON.parse(event.body);
        } catch (parseError) {
            console.error('❌ Erro ao fazer parse do JSON:', parseError);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'JSON inválido' })
            };
        }

        const { raffle_id, buyer_name, buyer_phone, numbers, total_amount } = requestData;

        console.log('📦 Dados recebidos:', { raffle_id, buyer_name, buyer_phone, numbers, total_amount });

        // Validações
        if (!raffle_id || !buyer_name || !buyer_phone || !numbers || !Array.isArray(numbers) || numbers.length === 0) {
            console.error('❌ Dados inválidos:', { raffle_id, buyer_name, buyer_phone, numbers });
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Dados inválidos. Verifique raffle_id, buyer_name, buyer_phone e numbers.' })
            };
        }

        // Verificar variáveis de ambiente
        if (!process.env.SUPABASE_URL) {
            console.error('❌ SUPABASE_URL não configurada');
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Configuração do servidor incompleta: SUPABASE_URL' })
            };
        }

        if (!process.env.SUPABASE_SERVICE_KEY) {
            console.error('❌ SUPABASE_SERVICE_KEY não configurada');
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Configuração do servidor incompleta: SUPABASE_SERVICE_KEY' })
            };
        }

        console.log('✅ Variáveis de ambiente OK');

        // Conectar ao Supabase com SERVICE KEY
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        console.log('✅ Supabase client criado');

        // Verificar números já vendidos/reservados
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        
        console.log('🔍 Buscando vendas existentes...');
        console.log('Raffle ID:', raffle_id);
        console.log('2 minutos atrás:', twoMinutesAgo);

        const { data: existingSales, error: fetchError } = await supabase
            .from('raffle_sales')
            .select('numbers')
            .eq('raffle_id', raffle_id)
            .or(`payment_status.eq.approved,and(payment_status.eq.reserved,created_at.gte.${twoMinutesAgo})`);

        if (fetchError) {
            console.error('❌ Erro ao buscar vendas:', fetchError);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    error: 'Erro ao verificar números',
                    details: fetchError.message 
                })
            };
        }

        console.log('✅ Vendas encontradas:', existingSales ? existingSales.length : 0);

        // Verificar conflitos
        const numerosJaVendidos = new Set();
        if (existingSales && existingSales.length > 0) {
            existingSales.forEach(sale => {
                if (sale.numbers && Array.isArray(sale.numbers)) {
                    sale.numbers.forEach(num => numerosJaVendidos.add(num));
                }
            });
        }

        console.log('🔢 Números já vendidos:', Array.from(numerosJaVendidos));
        console.log('🔢 Números solicitados:', numbers);

        const conflictingNumbers = numbers.filter(num => numerosJaVendidos.has(num));

        if (conflictingNumbers.length > 0) {
            console.log('⚠️ Conflito detectado:', conflictingNumbers);
            return {
                statusCode: 409,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Números já reservados',
                    conflicting_numbers: conflictingNumbers
                })
            };
        }

        console.log('✅ Nenhum conflito. Criando venda...');

        // Criar venda
        const saleData = {
            raffle_id,
            buyer_name,
            buyer_phone,
            numbers: numbers.sort((a, b) => a - b),
            total_amount,
            payment_status: 'reserved'
        };

        console.log('📝 Dados da venda:', saleData);

        const { data: newSale, error: insertError } = await supabase
            .from('raffle_sales')
            .insert(saleData)
            .select()
            .single();

        if (insertError) {
            console.error('❌ Erro ao inserir venda:', insertError);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    error: 'Erro ao reservar números',
                    details: insertError.message 
                })
            };
        }

        console.log('✅ Venda criada com sucesso:', newSale.id);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                sale: newSale
            })
        };

    } catch (error) {
        console.error('❌ Erro geral:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: error.message || 'Erro interno do servidor',
                stack: error.stack
            })
        };
    }
};
