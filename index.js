
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

const PAGARME_API_KEY = 'sk_d78f3d78ea3d4d75a61e3f099ccd07c7';

const allowedOrigins = ['https://iaadec.shop'];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(new Error('CORS não permite essa origem.'), false);
    }
    return callback(null, true);
  }
}));

app.use(bodyParser.json());

// Gerar card_hash via API REST
app.post('/card_hash', async (req, res) => {
  try {
    const { card_number, card_holder_name, card_expiration_date, card_cvv } = req.body;

    if (!card_number || !card_holder_name || !card_expiration_date || !card_cvv) {
      return res.status(400).json({ error: 'Campos do cartão incompletos' });
    }

    const cardData = {
      card_number,
      card_holder_name,
      card_expiration_date,
      card_cvv
    };

    const response = await axios.post('https://api.pagar.me/core/v5/cards/hash', cardData, {
      headers: {
        Authorization: `Bearer ${PAGARME_API_KEY}`
      }
    });

    const card_hash = response.data.card_hash;

    return res.json({ card_hash });

  } catch (error) {
    console.error('Erro ao gerar card_hash:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Erro ao gerar card_hash' });
  }
});

// Criar transação via API REST
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

    const response = await axios.post('https://api.pagar.me/core/v5/transactions', transactionParams, {
      headers: {
        Authorization: `Bearer ${PAGARME_API_KEY}`
      }
    });

    const transaction = response.data;

    return res.json({
      success: true,
      transaction_id: transaction.id,
      status: transaction.status,
    });

  } catch (error) {
    console.error('Erro na doação:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Erro ao processar doação' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
