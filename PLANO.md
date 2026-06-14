# 📋 Plano de Criação — Academia em Casa

> Aplicativo de treino em casa para iniciantes e sedentários, sem aparelhos,
> pensado para treinar em família (você e sua esposa juntos).

---

## 1. Visão do Produto

**Para quem é:** pessoas hoje sedentárias, acima do peso, que querem começar a
se exercitar em casa, sem equipamentos de academia, sozinhas ou em conjunto
(casal/família).

**O que o app faz:** monta uma sequência diária de exercícios adaptada ao tempo
disponível da pessoa, guia o treino com cronômetro regressivo ajustável,
demonstra cada movimento com um avatar animado, toca música motivacional e
solta palavras de incentivo durante o treino.

**Princípios do produto:**

1. **Zero barreira de entrada** — sem aparelhos, sem cadastro complicado, sem
   conhecimento prévio. Abriu, treinou.
2. **Gentil com iniciantes** — exercícios de baixo impacto no início,
   progressão lenta, foco em criar o hábito antes da intensidade.
3. **Treinar junto é mais fácil** — o modo casal/família é cidadão de primeira
   classe, não um extra.
4. **Segurança primeiro** — aquecimento sempre, alongamento sempre, alertas de
   "pare se sentir dor".

---

## 2. Funcionalidades Principais (o que você pediu)

### 2.1 Plano de treino diário programado
- Programa progressivo de semanas (ex.: programa "Do Sofá ao Movimento" de 8 semanas).
- Cada dia tem um treino montado automaticamente conforme:
  - **Tempo disponível** informado naquele dia (ex.: 10, 15, 20 ou 30 minutos);
  - **Nível atual** do usuário (começa no nível "Iniciante absoluto");
  - **Dia da semana / fase do programa** (alterna grupos musculares e inclui dias de descanso ativo).
- Estrutura de cada treino: **Aquecimento → Circuito de exercícios → Alongamento/Volta à calma**.

### 2.2 Cronômetro regressivo ajustável
- Cada exercício roda por tempo (padrão inicial: **30 segundos de exercício + 15–30 segundos de descanso**).
- O usuário pode ajustar **a cada dia**:
  - duração do exercício (ex.: 20s, 30s, 40s, 45s);
  - duração do intervalo de descanso entre exercícios;
  - número de rodadas do circuito.
- Contagem visual grande (círculo regressivo) + sinal sonoro nos 3 últimos segundos e ao trocar de exercício.
- Botões de **pausar / pular / repetir** exercício.
- Durante o descanso, o app já mostra **uma prévia do próximo exercício**.

### 2.3 Avatar demonstrando os movimentos
- Avatar animado executa o movimento em loop durante todo o exercício.
- **Abordagem técnica em fases:**
  - **Fase 1 (MVP):** animações prontas em **Lottie** (JSON animado, leve e gratuito — há bibliotecas com exercícios) ou GIFs/vídeos curtos em loop.
  - **Fase 2:** avatar 3D próprio (ex.: modelo do **Mixamo**, da Adobe, que tem animações de exercício gratuitas, renderizado com Three.js) — permite escolher avatar masculino/feminino e até personalizar.
- Junto do avatar: nome do exercício, dica de execução em 1 linha ("mantenha as costas retas") e indicação dos músculos trabalhados.

### 2.4 Exercícios sem aparelhos (ou com objetos de casa)
- **Banco de exercícios** com peso do corpo: polichinelo, agachamento, marcha estacionária, elevação de joelhos, prancha (com variação nos joelhos), flexão na parede, ponte de glúteo, abdominais adaptados, etc.
- **Categoria "objetos da casa":**
  - cadeira → agachamento na cadeira, tríceps no banco, subida de degrau;
  - garrafas PET com água/areia → halteres improvisados para rosca, elevação lateral, remada;
  - toalha → exercícios de deslizamento e alongamento;
  - mochila com livros → "colete de peso" para agachamento;
  - parede → flexão na parede, "cadeirinha" isométrica;
  - escada de casa → cardio de degraus.
- Cada exercício terá **3 níveis de variação** (fácil / médio / difícil) — ex.: flexão na parede → flexão nos joelhos → flexão completa. Assim o app progride sem trocar o exercício.
- Marcação de **baixo impacto** (sem pulos) para proteger joelhos de quem está acima do peso — o programa inicial usa só baixo impacto.

### 2.5 Música de academia
- Player de música integrado ao treino:
  - **Fase 1 (MVP):** playlists internas com músicas **royalty-free** energéticas (eletrônica/workout), com volume que abaixa automaticamente quando o app fala (ducking).
  - **Fase 2:** integração com **Spotify/YouTube Music** para o usuário usar as próprias playlists.
- Música mais intensa no circuito, mais calma no alongamento.

### 2.6 Palavras de incentivo durante o treino
- Mensagens faladas (texto-para-voz ou áudios gravados) e visuais em momentos-chave:
  - início do treino ("Hoje é mais um passo. Vamos juntos!");
  - metade do treino ("Metade já foi! Você é mais forte do que ontem.");
  - últimos 10 segundos de um exercício difícil ("Só mais um pouquinho, não pare agora!");
  - fim do treino ("Treino concluído! Seu eu do futuro agradece. 👏").
- Tom configurável: **motivacional suave** ou **estilo personal trainer animado**.
- Frases específicas para o modo casal: "Olha pro lado — vocês estão fazendo isso juntos!"

---

## 3. Ideias Extras (minhas sugestões)

### 3.1 Modo Casal / Família 👫 (a alma do app)
- **Treino espelhado:** os dois treinam juntos na mesma tela (celular apoiado ou TV), com o mesmo cronômetro.
- **Perfis separados** com progresso individual, mas **conquistas de dupla**: "5 treinos juntos", "Primeira semana completa em casal".
- **Revezamento:** modo em que um faz o exercício enquanto o outro descansa e incentiva — ótimo para iniciantes.
- **Desafio amigável da semana:** quem completar mais treinos ganha (o prêmio vocês combinam 😄).

### 3.2 Acompanhamento e motivação de longo prazo
- **Sequência de dias (streak)** com tolerância: 1 dia de folga por semana não quebra a sequência (importante para não desanimar iniciante).
- **Registro de peso e medidas** (opcional e privado) com gráfico de evolução — foco em tendência, não no número do dia.
- **Calendário visual** com os dias treinados pintados.
- **Conquistas/medalhas:** "Primeiro treino", "7 dias", "1 mês", "Primeiro treino de 30 min", "100 polichinelos acumulados".
- **Fotos de progresso** privadas (antes/depois mensal, só no aparelho).

### 3.3 Saúde e segurança
- **Questionário inicial (anamnese simples):** idade, peso aproximado, dores nas articulações, condições como hipertensão → adapta o plano (ex.: remove pulos, aumenta descansos).
- **Aviso médico claro** na primeira abertura: "consulte um médico antes de iniciar".
- **Botão "Está muito difícil"** durante o treino → troca na hora pela variação mais fácil do exercício.
- **Lembrete de hidratação** no meio de treinos longos.
- **Dias de descanso ativo:** caminhada leve + alongamento, para o corpo se recuperar.

### 3.4 Conveniência
- **Lembrete diário** no horário que o casal escolher ("Hora do treino de vocês! 💪").
- **Treino offline** — tudo funciona sem internet depois de instalado.
- **Modo TV / tela grande** — interface pensada para apoiar o celular longe ou espelhar na TV da sala.
- **"Treino expresso" de 7 minutos** para dias corridos — melhor 7 minutos do que zero.
- **Resumo pós-treino:** tempo total, exercícios feitos, calorias estimadas, frase de parabéns.

### 3.5 Para o futuro (não entra agora)
- Dicas simples de alimentação (sem dieta — só hábitos: água, verduras, evitar refrigerante).
- Comunidade/grupos de famílias.
- Correção de movimento pela câmera (visão computacional).

---

## 4. Tecnologia Proposta

### Recomendação: **PWA (aplicativo web progressivo)**

| Critério | Por que PWA |
|---|---|
| Instalação | Adiciona à tela inicial do celular sem loja de apps, sem taxa |
| Multi-tela | Funciona no celular, tablet, notebook e TV (essencial p/ treino em casal) |
| Custo | Hospedagem gratuita (GitHub Pages / Vercel) |
| Offline | Service Worker deixa o treino funcionar sem internet |
| Evolução | Pode virar app de loja depois (Capacitor) sem reescrever |

### Pilha técnica

- **Front-end:** React + Vite + TypeScript
- **Estilo:** Tailwind CSS (visual moderno rápido), tema escuro com cores energéticas
- **Animações do avatar:** Lottie (`lottie-react`) no MVP → Three.js/Mixamo na fase 2
- **Áudio:** Web Audio API (bipes do cronômetro, ducking da música) + Web Speech API (frases de incentivo faladas em pt-BR, grátis e offline)
- **Dados:** LocalStorage/IndexedDB no aparelho (sem servidor no MVP — privacidade total)
- **Notificações/offline:** Service Worker (PWA)
- **Hospedagem:** GitHub Pages (deploy automático via GitHub Actions deste próprio repositório)

### Modelo de dados (simplificado)

```
Exercicio        { id, nome, descricao, dicaExecucao, musculos[], impacto,
                   equipamento (nenhum|cadeira|garrafa|toalha|parede|escada),
                   variacoes { facil, medio, dificil }, animacao }

PlanoSemanal     { semana, diasDeTreino[], foco, nivel }

Treino           { data, duracaoEscolhida, exercicios[], tempoExercicio,
                   tempoDescanso, rodadas, concluido }

Perfil           { nome, avatar, nivel, streak, conquistas[], historico[],
                   pesoRegistros[] (opcional) }

Casal            { perfis[2], conquistasDeDupla[], desafioDaSemana }
```

---

## 5. Telas do Aplicativo

1. **Boas-vindas / Questionário inicial** — nome dos dois, objetivos, condição física, aviso médico.
2. **Início (Home)** — treino do dia em destaque, botão grande "COMEÇAR", streak, seletor de tempo disponível hoje.
3. **Pré-treino** — lista dos exercícios de hoje, ajuste do cronômetro (tempo de exercício/descanso/rodadas), escolher música, modo solo ou casal.
4. **Tela de Treino** (a principal) — avatar animado grande, cronômetro regressivo gigante, barra de progresso do treino, nome do exercício + dica, próximo exercício, botões pausar/pular/"está difícil".
5. **Pós-treino** — parabéns 🎉, resumo, conquistas desbloqueadas, registrar como se sentiu (emoji).
6. **Progresso** — calendário, gráficos, medalhas, evolução de peso (opcional).
7. **Biblioteca de exercícios** — todos os exercícios com demonstração, filtros por objeto da casa.
8. **Configurações** — perfis, horário do lembrete, voz do incentivo, sons.

---

## 6. Fases de Desenvolvimento

### 🟢 Fase 1 — MVP "Já dá pra treinar" ✅ CONCLUÍDA
- [x] Estrutura do projeto (React + Vite + PWA)
- [x] Banco inicial de 28 exercícios sem aparelho (com variações fácil/médio/difícil)
- [x] Gerador de treino por tempo disponível (7/10/15/20/30 min) com aquecimento e alongamento
- [x] Tela de treino com cronômetro regressivo ajustável + sons
- [x] Demonstração dos exercícios (avatar SVG animado por código, sem dependências)
- [x] Frases de incentivo (texto na tela + voz pt-BR via Web Speech)
- [x] Música de academia gerada no aparelho (antecipada da Fase 2): trilha eletrônica via Web Audio com 3 climas (aquecimento/circuito/alongamento) e ducking quando a voz fala
- [x] Salvamento do progresso no aparelho + streak
- [x] Deploy no GitHub Pages

### 🟡 Fase 2 — "Treinando junto" ✅ CONCLUÍDA
- [x] Modo casal: conquistas de dupla + modo revezamento (um faz, o outro incentiva)
- [x] Programa progressivo de 8 semanas ("Do Sofá ao Movimento"), com sugestão de ajustes por semana
- [x] ~~Música integrada~~ → antecipada para a Fase 1 (trilha gerada no aparelho)
- [x] Exercícios com objetos da casa (parede, cadeira, garrafas, escada)
- [x] Calendário do mês, gráfico de minutos por semana e registro de peso por pessoa
- [x] Lembrete diário (notificação, com horário ajustável)

> Observação: o modo casal trata o casal como dupla treinando junta na mesma
> tela (espelhado/revezamento). Perfis totalmente separados com login
> individual ficaram fora do escopo por não combinarem com o uso real (um
> aparelho, dois treinando juntos).

### 🔵 Fase 3 — "Capricho"
- [ ] Avatar 3D personalizável (Mixamo + Three.js)
- [x] ~~Integração Spotify~~ → antecipada: player embutido com playlist personalizável
- [x] Modo TV / tela grande (textos e avatar ampliados + tela cheia)
- [ ] Fotos de progresso
- [ ] Desafios semanais do casal

---

## 7. Próximos Passos

1. **Você valida este plano** (ou pede ajustes — nomes, prioridades, ideias).
2. Definimos o **nome do app** (sugestões: "Academia em Casa", "Treino em Família", "MexeJunto", "Casal Fit em Casa").
3. Começamos a **Fase 1**: estrutura do projeto + banco de exercícios + tela de treino com cronômetro.
