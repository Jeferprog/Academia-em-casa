# Requisitos do avatar 3D (MexeJunto)

Especificação do que um avatar precisa ter para funcionar no nosso sistema de
treino. Útil para encomendar/gerar um avatar personalizado (sua foto, foto de
casal, etc.) em qualquer ferramenta.

## Como o nosso sistema usa o avatar

O avatar 3D **não é um vídeo nem uma imagem**. É um personagem 3D com
**esqueleto (rig)**, e nós animamos cada exercício **girando os ossos** por
código (ombro, cotovelo, quadril, joelho, tornozelo...). Por isso o arquivo
precisa de um formato e um rig bem específicos — qualquer avatar bonito não
serve; tem que ser "riggado" do jeito certo.

## Requisitos obrigatórios

| Item | Exigência |
|---|---|
| Formato | **glTF binário (`.glb`)**, arquivo único |
| Tipo | Personagem **humanoide 3D com malha "skinada"** (presa ao esqueleto) |
| Esqueleto | **Rig humanoide padrão Mixamo**, ossos com prefixo `mixamorig` |
| Pose de repouso | **T-pose** (em pé, braços esticados na horizontal para os lados), de frente |
| Orientação dos ossos | Eixos locais alinhados ao mundo em repouso (é o que o auto-rig do Mixamo entrega) |
| Corpo | **Corpo inteiro, da cabeça aos pés** (mostramos de perfil/lado) |
| Tamanho | Humanoide de ~1,7–1,8 m (a escala nós detectamos automaticamente) |
| Malha | Leve para web — ideal **< 5 MB** (o atual tem ~28 mil vértices, 2,9 MB) |
| Materiais | Simples (1 material). Pode ter textura realista de pele/roupa; nós conseguimos recolorir |
| Animações embutidas | **Não precisa** — a animação é nossa, por ossos |
| Morph targets / visemes | Não precisa |

## Ossos que o sistema controla

O rig completo do Mixamo tem 67 ossos; usamos este subconjunto (precisam existir
com estes nomes):

```
mixamorigHips
mixamorigSpine, mixamorigSpine1, mixamorigSpine2
mixamorigNeck, mixamorigHead
mixamorigLeftShoulder,  mixamorigLeftArm,  mixamorigLeftForeArm,  mixamorigLeftHand
mixamorigRightShoulder, mixamorigRightArm, mixamorigRightForeArm, mixamorigRightHand
mixamorigLeftUpLeg,  mixamorigLeftLeg,  mixamorigLeftFoot,  mixamorigLeftToeBase
mixamorigRightUpLeg, mixamorigRightLeg, mixamorigRightFoot, mixamorigRightToeBase
```

## Estilo (para a versão personalizada)

- Pessoa de **corpo inteiro**, em pé, T-pose, olhando para frente.
- Rosto pode ser realista (gerado da foto).
- Roupa **justa/esportiva** lê melhor de longe (silhueta limpa); evitar roupas
  muito largas/esvoaçantes, que escondem o movimento.
- Realista ou semi-estilizado, ambos funcionam.

## Caminho recomendado para "foto → avatar 3D riggado"

O vmake.ai gera **vídeo 2D** de avatar falante — ótimo para um vídeo de
boas-vindas, mas **não exporta modelo 3D `.glb` com rig**, então não serve para
o boneco que faz os exercícios. Ferramentas que entregam o que precisamos a
partir de uma selfie:

1. **Avaturn** (avaturn.me) — selfie → avatar 3D realista de corpo inteiro,
   exporta `.glb` e é compatível com animações Mixamo. (melhor encaixe)
2. **Ready Player Me** (readyplayer.me) — selfie → avatar `.glb` riggado;
   funciona com Mixamo via re-targeting.
3. Se a ferramenta der só a **malha 3D** (sem rig): subir o modelo em T-pose no
   **Mixamo** (mixamo.com, grátis) → o auto-rig gera exatamente o esqueleto
   `mixamorig` que usamos → exportar. (Pode sair em `.fbx`; aí converter para
   `.glb`.)

Depois é só substituir o arquivo `src/assets/avatar3d.glb` pelo novo.

## Sobre o avatar de casal

Hoje a tela mostra **um** avatar por vez (o modo revezamento alterna os nomes,
mas o boneco é único). Mostrar **duas pessoas** (casal) lado a lado é uma
melhoria de código viável — dá para carregar dois `.glb` e posicioná-los lado a
lado, ou trocar conforme quem está ativo. Se quiser, é uma tarefa separada.
