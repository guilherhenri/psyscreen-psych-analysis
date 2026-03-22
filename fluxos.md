# Fluxos do PsychAnalysis

Este documento descreve o fluxo do servico de PsychAnalysis com base nos requisitos atuais.

## Entrada principal

Evento de entrada:

- `candidates.event.profile_created` (payload do CandidateProfile)

Objetivo:

- Gerar analise psicologica (score + relatorio) e publicar `psych-analysis.event.completed`.

## Fluxo 1 - Analise ao receber CandidateProfile.Created

1. Handler recebe `CandidateProfile.Created`
2. Verifica se ja existe analise para o `profileId`
   - Se status = `completed`, encerra (idempotencia)
3. Se nao existe, cria registro `PsychAnalysis` como `pending`
4. Armazena snapshot do perfil (summary, skills, rawText, etc.)
5. Monta prompt com dados estruturados do perfil
6. Chama Gemini (modelo `gemini-2.5-flash`)
7. Parseia resposta JSON e normaliza score (0-100)
8. Atualiza registro para `completed` com score + report
9. Publica `psych-analysis.event.completed`

Se falhar em qualquer etapa de analise:

- Atualiza status para `failed`
- Nao publica evento de concluido

## Fluxo 2 - Reprocessamento por criterios de vaga

Evento de entrada:

- `vacancies.event.criteria_updated`

1. Handler recebe `VacancyCriteriaUpdated`
2. Busca analises existentes por `vacancyId`
3. Para cada analise:
   - Se `criteriaVersion` ja corresponde ao evento, ignora (idempotencia)
   - Se nao houver snapshot, registra aviso e ignora
4. Recria prompt com snapshot salvo do perfil
5. Executa Gemini novamente
6. Atualiza analise existente com novo `criteriaVersion`
7. Publica `psych-analysis.event.completed`

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
- Reprocessamento por vaga evita duplicidade por `(vacancyId, criteriaVersion, candidateId)`
- Se `profileId` esta `pending/failed`, pode tentar novamente (regras definidas pelo produto)

## Qual use-case e o correto no handler?

- Se o fluxo for "evento -> analisa -> publica", o handler deve chamar `RunPsychAnalysis`.
- Se o fluxo for "evento -> cria pendente" e analise ocorre em outro processo, o handler deve chamar um use-case dedicado a isso.

Pelos requisitos atuais, o correto e:

- `RunPsychAnalysis` no handler do `CandidateProfile.Created`.
- `RunPsychAnalysis` no handler de `VacancyCriteriaUpdated` quando houver snapshot do perfil.
