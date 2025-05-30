
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pagarme from '@pagarme/pagarme-js';

const app = express();
const port = process.env.PORT || 3000;

const PAGARME_API_KEY = 'sk_d78f3d78ea3d4d75a61e3f099ccd07c7';

// Liberar CORS para seu frontend na Hostinger:
const allowedOrigins = ['https://iaadec.shop'];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // Postman, etc
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'O CORS não permite essa origem.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(bodyParser.json());

// Gera card_hash no backend (dados do cartão)
app.post('/card_hash', async (req, res) => {
  try {
    const { card_number, card_holder_name, card_expiration_date, card_cvv } = req.body;

    if (!card_number || !card_holder_name || !card_expiration_date || !card_cvv) {
      return res.status(400).json({ error: 'Campos do cartão incompletos' });
    }

    const client = await pagarme.client.connect({ api_key: PAGARME_API_KEY });

    const card_hash = await client.security.encrypt({
      card_number,
      card_holder_name,
      card_expiration_date,
      card_cvv,
    });

    return res.json({ card_hash });
  } catch (error) {
    console.error('Erro ao gerar card_hash:', error);
    return res.status(500).json({ error: 'Erro ao gerar card_hash' });
  }
});

// Recebe dados e cria transação
app.post('/doar', async (req, res) => {
  try {
    const {
      nome,
      email,
      cpf,
      valor,
      formaPagamento,
      card_hash,
    } = req.body;

    if (!nome || !email || !cpf || !valor || !formaPagamento) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const amount = Math.round(parseFloat(valor) * 100);

    const client = await pagarme.client.connect({ api_key: PAGARME_API_KEY });

    const transactionParams = {
      amount,
      payment_method: formaPagamento,
      customer: {
        name: nome,
        email,
        documents: [
          {
            type: 'cpf',
            number: cpf.replace(/\D/g, ''),
          },
        ],
      },
      capture: true,
    };

    if (formaPagamento === 'credit_card') {
      if (!card_hash) {
        return res.status(400).json({ error: 'card_hash obrigatório para cartão' });
      }
      transactionParams.card_hash = card_hash;
    }

    const transaction = await client.transactions.create(transactionParams);

    return res.json({
      success: true,
      transaction_id: transaction.id,
      status: transaction.status,
    });
  } catch (error) {
    console.error('Erro na doação:', error);
    return res.status(500).json({ error: 'Erro ao processar doação' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
