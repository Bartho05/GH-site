# apps/web — site + painel do dono (React + Vite)

Frontend em **React** (JS puro, sem TypeScript), construído com Vite. Mesmo visual de antes: os CSS (`src/styles.css`, `src/admin.css`) e as classes são os mesmos — só o motor virou React.

```bash
npm start   # na RAIZ do monorepo → builda (se preciso) e sobe http://localhost:8123
npm run dev # na raiz → Vite na 5173 com hot-reload + API na 8123 (proxy /api)
```

Estrutura: `index.html`/`admin.html` são as entradas do Vite; o código fica em `src/` (`loja/` = site, `admin/` = painel, `lib/` = compartilhado). O build vai para `dist/`, que o `apps/api` serve em produção.

> Com React/Vite o site precisa de servidor para abrir (os módulos ES não rodam por `file://`). O `npm start` da raiz resolve: builda na primeira vez e sobe tudo junto. O guia completo (API, segurança, dados) está no `README.md` da raiz do monorepo.
