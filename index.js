import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pagarme from 'pagarme';

const app = express();
const port = process.env.PORT || 3000;

const PAGARME_API_KEY = 'sk_d78f3d78ea3d4d75a61e3f099ccd07c7';

// Ajuste o domínio do seu frontend aqui:
const allowedOrigins = ['https://iaadec.shop/']; 

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

// Endpoint para gerar card_hash no backend (recebe dados do cartão)
app.post('/card_hash', async (req, res) => {
  try {
    const { card_number, card_holder_name, card_expiration_date, card_cvv } = req.body;

    if (!card_number || !card_holder_name || !card_expiration_date || !card_cvv) {
      return res.status(400).json({ error: 'Campos do cartão incompletos' });
    }

    const client = await pagarme.client.connect({ api_key: PAGARME_API_KEY });

    // A API v5 da pagarme gera o card_hash com método client.transactions.cardHash
    // Porém a lib oficial paga.me Node.js v5 não expõe esse método diretamente.
    // Uma alternativa: usar o SDK antigo ou gerar card_hash via chamada REST POST em /card_hash (não documentado)
    // Mas para backend com PCI, é comum usar a lib antiga (pagarme-js) no backend ou implementar a geração manual.

    // Infelizmente, pagarme Node.js oficial não tem método direto para gerar card_hash.
    // Então a forma correta é: usar a lib pagarme-js (npm) para gerar o card_hash no backend.

    // Como alternativa rápida, aqui vamos usar pagarme-js para gerar card_hash:

    // Importar pagarme-js:
    const pagarmeJs = require('pagarme');

    const clientJs = await pagarmeJs.client.connect({ api_key: PAGARME_API_KEY });

    const card_hash = await clientJs.security.encrypt({
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

// Endpoint para processar a doação
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
