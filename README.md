# ASCENSÃO 🏔️

> Da lama ao topo, dia sim dia não.

App NoFap de autodisciplina com um sistema de **100 níveis** dividido em **20 categorias** (Abismo Zero → Supremo Absoluto). O diferencial: você **sobe de nível a cada 2 dias** de foco — dia 1 = nível 1, dia 3 = nível 2, dia 5 = nível 3... até o Supremo Absoluto no dia 199.

## Funcionalidades

- ⏱️ **Contador** ao vivo (horas/dias limpos) com anel de progresso do dia
- 🏆 **100 níveis** com fotos próprias, desbloqueados dia sim, dia não
- 🔒 Níveis bloqueados aparecem em cinza; o atual em destaque dourado
- 😊 **Humor** diário com histórico
- 💬 **Motivação** com frases de foco
- 👤 **Perfil** com sequência, recorde, resets e nível atual
- 🔔 **Lembrete diário** por notificação (PWA)
- 📲 **PWA instalável** — funciona offline e vira app na tela inicial

## Como usar

Abra o `index.html` em um servidor (as notificações e o service worker exigem `http/https`, não `file://`).

```bash
python -m http.server 5599
# acesse http://localhost:5599
```

### Hospedar grátis (GitHub Pages)
Em **Settings → Pages**, selecione a branch `main` / raiz. O app fica disponível em `https://<usuario>.github.io/<repo>/` e pode ser instalado no celular via "Adicionar à tela inicial".

## Estrutura

- `index.html` — telas do app
- `style.css` — visual (dark, verde neon)
- `app.js` — lógica (contador, níveis, humor, notificações)
- `niveis.js` — manifesto dos 100 níveis
- `sw.js` — service worker (offline + notificações)
- `assets/niveis/` — imagens dos níveis
- `assets/icon-*.png` — ícone do app

---
Feito no COCRIAÇÃO LAB.
