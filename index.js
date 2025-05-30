import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// CHAVE DE API REAL DA PAGAR.ME (v5)
const PAGARME_API_KEY = 'sk_d78f3d78ea3d4d75a61e3f099ccd07c7';

app.post('/card_hash', async (req, res) => {
  try {
    const { card_number, card_holder_name, card_expiration_date, card_cvv } = req.body;

    const response = await axios.post(
      'https://api.pagar.me/core/v5/cards',
      {
        number: card_number,
        holder_name: card_holder_name,
        exp_month: card_expiration_date.substring(0, 2),
        exp_year: '20' + card_expiration_date.substring(2, 4),
        cvv: card_cvv,
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ card_id: response.data.id });
  } catch (error) {
    console.error('Erro ao gerar card_id:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar card_id' });
  }
});

app.post('/doar', async (req, res) => {
  try {
    const { nome, email, cpf, valor, formaPagamento, card_id } = req.body;

    const customer = {
      name: nome,
      email,
      type: 'individual',
      documents: [{ type: 'cpf', number: cpf.replace(/\D/g, '') }],
    };

    const body = {
      items: [
        {
          amount: Math.round(parseFloat(valor) * 100),
          description: 'Doação',
          quantity: 1,
        },
      ],
      customer,
    };

    if (formaPagamento === 'credit_card') {
      body.payments = [
        {
          payment_method: 'credit_card',
          credit_card: { card_id },
        },
      ];
    } else {
      body.payments = [
        {
          payment_method: formaPagamento,
        },
      ];
    }

    const response = await axios.post(
      'https://api.pagar.me/core/v5/orders',
      body,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ sucesso: true, transacao: response.data });
  } catch (error) {
    console.error('Erro na doação:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao processar doação' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${P
