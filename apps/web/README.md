# apps/web — site + painel do dono (React + Vite)

SPA única em **React** (JS puro, sem TypeScript) com **React Router**: `/` = loja, `/checkout` = finalização da compra, `/privacidade` = LGPD, `/admin` = painel do dono (carregado por lazy-load, chunk separado). Mesmo visual de antes: os CSS (`src/styles.css`, `src/admin.css`) e as classes são os mesmos — só o motor virou React.

```bash
npm start   # na RAIZ do monorepo → builda (se preciso) e sobe http://localhost:8123 (/admin = painel)
npm run dev # na raiz → Vite na 5173 com hot-reload + API na 8123 (proxy /api)
```

Estrutura: `index.html` é a única entrada do Vite; o código fica em `src/` (`loja/` = site + checkout + privacidade, `admin/` = painel, `lib/` = compartilhado). O build vai para `dist/`, que o `apps/api` serve com fallback de SPA: rotas sem extensão (ex.: `/checkout`) devolvem o `index.html`, `/admin.html` redireciona para `/admin` e arquivos com extensão inexistente continuam dando 404.

> Com React/Vite o site precisa de servidor para abrir (os módulos ES não rodam por `file://`). O `npm start` da raiz resolve: builda na primeira vez e sobe tudo junto. O guia completo (API, segurança, dados) está no `README.md` da raiz do monorepo.
