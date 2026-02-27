# Wilkins Protocol — Precision Tinted Lenses

Aplicativo clínico para prescrição de filtros cromáticos seguindo o protocolo de Arnold Wilkins (MRC Cambridge).

## Deploy no Cloudflare Pages

### Opção 1 — Git (recomendado)
1. Faça upload deste projeto para um repositório GitHub/GitLab
2. Acesse **Cloudflare Pages → Create a project → Connect to Git**
3. Selecione o repositório
4. Configure:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Clique em **Save and Deploy**

### Opção 2 — Upload direto (drag & drop)
1. Execute `npm install && npm run build` localmente
2. Acesse **Cloudflare Pages → Create a project → Upload assets**
3. Faça upload da pasta `dist/`

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## Funcionalidades

- ✅ Questionário de Sintomas (Wilkins Visual Sensitivity Scale)
- ✅ Pattern Glare Test (3 frequências espaciais)
- ✅ Rate of Reading Test (baseline e validação com filtro)
- ✅ Seleção de 9 famílias de cor do Intuitive Colorimeter
- ✅ Ajuste de saturação em 5 níveis com preview em tempo real
- ✅ Prescrição com código HEX para laboratório
- ✅ Impressão de laudo via browser
- ✅ Otimizado para iPad (touch-friendly, viewport correto, sem zoom em inputs)

---
Olhar — Clínica da Visão · CROO 1726 · Garanhuns, PE
