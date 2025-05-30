
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pagarme from 'pagarme';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.PAGARME_API_KEY;

app.post('/pagar', async (req, res) => {
  try {
    const { card_hash, cpf } = req.body;

    if (!card_hash || !cpf) {
      return res.status(400).json({ error: 'card_hash e cpf são obrigatórios' });
    }

    const client = await pagarme.client.connect({ api_key: API_KEY });

    const transaction = await client.transactions.create({
      amount: 1000, // R$10,00 em centavos
      card_hash,
      capture: true,
      customer: {
        document_number: cpf.replace(/\D/g, ''),
      },
    });

    res.json({ success: true, transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Erro interno' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
