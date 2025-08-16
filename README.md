# 3D Coin Runner (HTML + Three.js)

Um mini jogo 3D em HTML/JS. Mova a esfera para coletar moedas e evite os blocos em movimento.

## Rodar localmente

1. Inicie um servidor estático (exemplos abaixo) na pasta do projeto.
   - Python 3:
     ```bash
     python3 -m http.server 5173 --directory .
     ```
   - Node (http-server):
     ```bash
     npx http-server -p 5173 -c-1 .
     ```
2. Abra `http://localhost:5173` no navegador.
3. Clique em "Começar" e jogue com WASD ou setas.

## Tecnologias
- Three.js via CDN (módulos ES)
- Sem build/bundler; apenas arquivos estáticos

## Estrutura
- `index.html` – página e HUD
- `styles.css` – estilos
- `main.js` – lógica do jogo Three.js
