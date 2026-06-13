# 🏠💪 Academia em Casa

Aplicativo de treino em casa para quem está começando: sem aparelhos de
academia, com exercícios usando só o peso do corpo ou objetos da casa
(cadeira, garrafas com água, parede, escada). Pensado para treinar em
família — você e quem treina com você.

📋 O plano completo do projeto está em [PLANO.md](PLANO.md).

## O que já funciona (Fase 1 — MVP)

- ✅ Treino do dia gerado automaticamente conforme o tempo disponível (7 a 30 min), sempre com aquecimento → circuito → alongamento
- ✅ 28 exercícios sem aparelhos, cada um com 3 níveis de variação (leve/média/forte)
- ✅ Cronômetro regressivo ajustável (tempo de exercício e de descanso) com bipes
- ✅ Avatar animado demonstrando cada movimento
- ✅ Frases de incentivo na tela e faladas em português (voz do navegador)
- ✅ Botão "Tá difícil" que troca na hora pela versão mais leve do exercício
- ✅ Sequência de dias (streak), calendário e conquistas — salvos no aparelho
- ✅ Funciona offline depois da primeira visita (PWA) e pode ser instalado na tela inicial

## Rodando localmente

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # build de produção (pasta dist/)
```

Ferramenta de desenvolvimento: `npx tsx scripts/render-poses.ts` gera uma
folha de contato em `/tmp/screens/poses.png` com todas as poses do avatar.

## Publicação

O deploy é automático no GitHub Pages a cada push na branch `main`
(workflow em `.github/workflows/deploy.yml`). Para ativar: em
**Settings → Pages**, escolha **Source: GitHub Actions**.

## Saúde primeiro ⚠️

Consulte um médico antes de iniciar qualquer programa de exercícios e pare
imediatamente se sentir dor, tontura ou falta de ar intensa.
