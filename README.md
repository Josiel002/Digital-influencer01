# Estúdio de Persona

App para criar dossiês de influenciadoras digitais com IA: aparência,
personalidade, moodboard e prompts prontos para Midjourney, Stable Diffusion,
DALL·E e Leonardo AI. Os dados ficam salvos no navegador (localStorage).

## Publicar no Vercel (mais simples, sem terminal)

1. Crie uma conta gratuita em vercel.com (dá pra entrar com GitHub, Google ou e-mail).
2. Suba esta pasta para um repositório no GitHub:
   - Crie um repositório novo em github.com (botão "New repository").
   - Na página do repositório, use "uploading an existing file" e arraste todos
     os arquivos desta pasta (menos `node_modules`, que nem deve existir ainda).
3. No Vercel, clique em "Add New Project" → "Import Git Repository" e escolha
   esse repositório.
4. O Vercel detecta automaticamente que é um projeto Vite. Deixe as configurações
   padrão e clique em "Deploy".
5. Em cerca de 1 minuto você recebe um link público, tipo
   `estudio-influencer-ia.vercel.app`.

## Publicar no Netlify (alternativa, com deploy por arraste-e-solte)

1. Rode localmente (ou peça para alguém rodar) os comandos abaixo para gerar
   a versão final do site:
   ```
   npm install
   npm run build
   ```
   Isso cria uma pasta `dist/`.
2. Acesse app.netlify.com, crie uma conta gratuita.
3. Na tela inicial, arraste a pasta `dist` inteira para a área de deploy.
4. Pronto — o Netlify te dá o link público na hora.

## Rodar localmente para testar antes de publicar

Se em algum momento você tiver acesso a um computador com Node.js instalado:
```
npm install
npm run dev
```
Isso abre o app em `http://localhost:5173`.

## Estrutura do projeto

- `src/App.jsx` — todo o app (dossiê, moodboard, gerador de prompts, legendas)
- `src/main.jsx` — ponto de entrada do React
- `src/index.css` — estilos base (Tailwind)
- `index.html` — HTML raiz
