require('dotenv').config();
const express = require('express');
const pagarme = require('pagarme');

const app = express();
app.use(express.json());

app.post('/pagar', async (req, res) => {
  try {
    const { card_hash, cpf } = req.body;

    if (!card_hash || !cpf) {
      return res.status(400).json({ success: false, error: 'card_hash e cpf são obrigatórios' });
    }

    const client = await pagarme.client.connect({ api_key: process.env.PAGARME_API_KEY });

    const transaction = await client.transactions.create({
      amount: 1000,
      card_hash: card_hash,
      customer: {
        document_number: cpf,
        type: 'individual',
      },
      billing: {
        name: 'Cliente Santela Burger',
        document_number: cpf,
        address: {
          street: 'Rua Exemplo',
          neighborhood: 'Bairro Exemplo',
          zipcode: '12345000',
          city: 'Cidade Exemplo',
          state: 'SP',
          country: 'br',
          street_number: '100',
        }
      },
      items: [
        {
          id: '1',
          title: 'Doação - Santela Burger',
          unit_price: 1000,
          quantity: 1,
          tangible: false,
        }
      ],
      payment_method: 'credit_card',
    });

    if (transaction.status === 'authorized' || transaction.status === 'paid') {
      return res.json({ success: true, transaction });
    } else {
      return res.status(400).json({ success: false, error: 'Transação não autorizada', transaction });
    }
  } catch (err) {
    console.error('Erro no /pagar:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro interno' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
