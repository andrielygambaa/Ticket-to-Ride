# Ticket to Ride: Neon Edition 🚆✨

Protótipo web do jogo Ticket to Ride com estética dark/hacker neon.

## Estrutura
- `index.html` — tabuleiro (SVG), HUD e modais
- `css/style.css` — tema dark/neon, glow, responsivo
- `js/game.js` — lógica do jogo (ES6+), interações, AJAX
- `php/db.php` / `php/api.php` — API de persistência
- `sql/schema.sql` — criação do banco MySQL/MariaDB

## Como rodar
1. Importe `sql/schema.sql` no MySQL (cria o banco `ttr_neon`).
2. Ajuste credenciais em `php/db.php`.
3. Sirva a pasta com PHP: `php -S localhost:8000` e abra http://localhost:8000
4. Sem servidor PHP, o jogo funciona em modo demo usando `localStorage`.

## Mecânicas (MVP)
- 2 jogadores hotseat, 20 trens cada
- Ações por turno: comprar 2 cartas de trem, comprar bilhetes, reivindicar rota
- Cartas abertas: clique para pegar (coringa aberto = compra única)
- Rotas cinzas: qualquer cor uniforme + coringas
- Bilhetes: +pontos se conectados no fim, −pontos se falharem
- Fim: jogador com ≤2 trens → oponente tem mais um turno → placar final
