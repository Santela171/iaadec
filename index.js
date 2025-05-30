import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 10000;
const PAGARME_API_KEY = 'sk_d78f3d78ea3d4d75a61e3f099ccd07c7';

app.use(cors({
  origin: ['https://iaadec.shop'],
  methods: ['POST'],
}));
app.use(express.json());

app.post('/card_hash', async (req, res) => {
  try {
    const { card_number, card_holder_name, card_expiration_date, card_cvv } = req.body;

    const response = await axios.post('https://api.pagar.me/core/v5/cards', {
      number: card_number,
      holder_name: card_holder_name,
      exp_month: card_expiration_date.slice(0, 2),
      exp_year: '20' + card_expiration_date.slice(2, 4),
      cvv: card_cvv
    }, {
      headers: {
        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    const card_id = response.data.id;
    res.json({ card_id });

  } catch (err) {
    console.error('Erro ao gerar card_id:', err.response?.data || err.message); // ⬅ AQUI
    res.status(500).json({ error: 'Erro ao gerar card_id' });
  }
});

app.post('/doar', async (req, res) => {
  try {
    const { nome, email, cpf, valor, formaPagamento, card_id } = req.body;

    const payload = {
      amount: Math.round(parseFloat(valor) * 100),
      payment_method: formaPagamento,
      customer: {
        name: nome,
        email: email,
        type: 'individual',
        documents: [{ type: 'cpf', number: cpf }],
      },
    };

    const payment = formaPagamento === 'credit_card'
      ? { payment_method: 'credit_card', credit_card: { card_id } }
      : { payment_method: 'pix' };

    const response = await axios.post('https://api.pagar.me/core/v5/orders', {
      items: [{ name: "Doação", quantity: 1, amount: payload.amount }],
      customer: payload.customer,
      payments: [payment]
    }, {
      headers: {
        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ transaction_id: response.data.id });

  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao processar doação' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
