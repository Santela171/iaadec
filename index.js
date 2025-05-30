import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.PAGARME_API_KEY;

if (!API_KEY) {
  console.error('⚠️  PAGARME_API_KEY não definida no .env');
  process.exit(1);
}

// Rota para gerar card_id via API Pagar.me
app.post('/card_hash', async (req, res) => {
  try {
    const card = req.body;

    if (!card.number || !card.holder_name || !card.expiration_date || !card.cvv) {
      return res.status(400).json({ error: 'Dados do cartão incompletos' });
    }

    const response = await fetch('https://api.pagar.me/core/v5/cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ card }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao gerar card_id:', errorData);
      return res.status(response.status).json({ error: errorData.message || 'Erro na API Pagar.me' });
    }

    const data = await response.json();
    console.log('card_id gerado:', data.id);
    res.json({ card_id: data.id });
  } catch (err) {
    console.error('Erro interno no /card_hash:', err);
    res.status(500).json({ error: 'Erro interno ao gerar card_id' });
  }
});

// Rota para criar a transação (doação)
app.post('/doar', async (req, res) => {
  try {
    const { nome, email, cpf, valor, formaPagamento, card_id } = req.body;

    if (!nome || !email || !cpf || !valor || !formaPagamento) {
      return res.status(400).json({ error: 'Dados da doação incompletos' });
    }

    // Monta o corpo da requisição para a criação da transação
    const transactionBody = {
      amount: Math.round(parseFloat(valor) * 100), // valor em centavos
      payment_method: formaPagamento, // ex: "credit_card"
      card_id: card_id || undefined,
      customer: {
        name: nome,
        email: email,
        document: cpf,
      },
      // Pode ajustar outras opções aqui (como capture automatico)
      capture: true,
    };

    const response = await fetch('https://api.pagar.me/core/v5/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(transactionBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao criar transação:', errorData);
      return res.status(response.status).json({ error: errorData.message || 'Erro na criação da transação' });
    }

    const data = await response.json();
    console.log('Transação criada:', data.id);
    res.json({ message: 'Doação realizada com sucesso!', transaction_id: data.id });
  } catch (err) {
    console.error('Erro interno no /doar:', err);
    res.status(500).json({ error: 'Erro interno ao processar doação' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
