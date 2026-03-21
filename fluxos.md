# Fluxos do PsychAnalysis

Este documento descreve o fluxo correto do servico de PsychAnalysis com base nos requisitos do MVP.

## Entrada principal (MVP)

Evento de entrada:

- `candidates.event.profile_created` (payload do CandidateProfile)

Objetivo:

- Gerar analise psicologica (score + relatorio) e publicar `psych-analysis.event.completed`.

## Fluxo 1 - Analise ao receber CandidateProfile.Created

1. Handler recebe `CandidateProfile.Created`
2. Verifica se ja existe analise para o `profileId`
   - Se status = `completed`, encerra (idempotencia)
3. Se nao existe, cria registro `PsychAnalysis` como `pending`
4. Monta prompt com dados estruturados do perfil
5. Chama Gemini (modelo `gemini-2.5-flash`)
6. Parseia resposta JSON e normaliza score (0-100)
7. Atualiza registro para `completed` com score + report
8. Publica `psych-analysis.event.completed`

Se falhar em qualquer etapa de analise:

- Atualiza status para `failed`
- Nao publica evento de concluido

## Fluxo 2 - Reprocessamento (futuro)

Evento de entrada (nao implementado no MVP):

- `vacancies.event.criteria_updated`

1. Reprocessar candidatos da vaga
2. Recriar prompt com novos pesos/criterios
3. Executar Gemini novamente
4. Atualizar analises existentes e republicar `psych-analysis.event.completed`

## Estados e transicoes

- `pending`: criado quando o evento chega
- `completed`: Gemini executou e resultado persistido
- `failed`: erro na execucao ou parse

Regras:

- Nunca sobrescrever `completed` sem reprocessamento explicito
- `failed` pode ser reprocessado quando houver trigger valido

## Idempotencia

- Unicidade por `profileId`
- Se `profileId` ja esta `completed`, handler encerra
- Se `profileId` esta `pending/failed`, pode tentar novamente (regras definidas pelo produto)

## Qual use-case e o correto no handler?

- Se o fluxo for "evento -> analisa -> publica", o handler deve chamar `RunPsychAnalysis`.
- Se o fluxo for "evento -> cria pendente" e analise ocorre em outro processo, o handler deve chamar um use-case dedicado a isso.

Pelos requisitos do MVP, o correto e:

- `RunPsychAnalysis` no handler do `CandidateProfile.Created`.
