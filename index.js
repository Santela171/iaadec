import express from 'express';
import cors from 'cors';
import pagarme from 'pagarme';

const app = express();
const PORT = process.env.PORT || 10000;
const PAGARME_API_KEY = process.env.PAGARME_API_KEY || 'sk_d78f3d78ea3d4d75a61e3f099ccd07c7';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API backend doações funcionando');
});

// Rota para gerar card_hash (card_id na API pagar.me)
app.post('/card_hash', async (req, res) => {
  try {
    console.log('Recebido no /card_hash:', req.body);

    const client = await pagarme.client.connect({ api_key: PAGARME_API_KEY });
    const card = await client.cards.create(req.body);

    console.log('card_id gerado:', card.id);

    res.json({ card_id: card.id });
  } catch (err) {
    console.error('Erro ao gerar card_id:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Erro ao gerar card_id' });
  }
});

// Rota para processar doação
app.post('/doar', async (req, res) => {
  try {
    console.log('Recebido no /doar:', req.body);

    const { nome, email, cpf, valor, formaPagamento, card_id } = req.body;

    const client = await pagarme.client.connect({ api_key: PAGARME_API_KEY });

    const transaction = await client.transactions.create({
      amount: valor * 100, // valor em centavos
      payment_method: formaPagamento,
      card_id: card_id,
      customer: {
        name: nome,
        email,
        documents: [{ type: 'cpf', number: cpf }],
      },
      // configure demais campos conforme necessidade
      // e conforme documentação Pagar.me v5
    });

    console.log('Transação realizada:', transaction.id);

    res.json({ success: true, transaction_id: transaction.id });
  } catch (err) {
    console.error('Erro na doação:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Erro ao processar doação' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
