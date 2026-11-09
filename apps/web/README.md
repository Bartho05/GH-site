# apps/web — site + painel do dono

Frontend estático (HTML/CSS/JS puro, sem build). Serve o `apps/api` na raiz do monorepo:

```bash
npm start   # na raiz → http://localhost:8123 (loja) e /admin.html (painel)
```

Sem servidor, os arquivos também funcionam abertos direto no navegador (file://) — nesse caso a config usa o padrão + `localStorage`. O guia completo (API, segurança, dados) está no `README.md` da raiz do monorepo.
