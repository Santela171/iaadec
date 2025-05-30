
# Backend Pagar.me para Doações

## Como usar

1. Copie o arquivo `.env.example` para `.env` e coloque sua chave secreta do Pagar.me:
   ```
   PAGARME_API_KEY=sk_sua_chave_secreta_aqui
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Rode o servidor:
   ```
   npm start
   ```

4. O backend estará rodando na porta 3000 por padrão, ou na porta configurada na variável de ambiente `PORT`.

5. Use o endpoint POST `/pagar` enviando JSON com `card_hash` e `cpf`.

## Exemplo de JSON para enviar:

```json
{
  "card_hash": "hash_gerado_no_frontend",
  "cpf": "00000000000"
}
```
