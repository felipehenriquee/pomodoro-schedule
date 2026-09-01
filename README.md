# Pomodoro Schedule

App desktop onde voce cadastra **agendas recorrentes** e recebe **alarme sonoro
+ notificacao** nas trocas de bloco do pomodoro.

Exemplo de agenda: `seg-sex, 08:00-18:00, 50 min de foco, 10 min de pausa, pausa
longa 12:00-14:00`. Como `50 + 10 = 60`, o alarme cai sempre no minuto `:50`
(fim do foco) e no `:00` (volta ao foco).

## Stack

```
pomodoro/
├─ front/       React + Vite + TypeScript + FullCalendar (UI, Web Audio)
└─ back-node/   Electron + TypeScript + better-sqlite3
```

- `back/` guarda uma versao anterior do backend em **Rust/Tauri**, mantida so
  como referencia (fora deste repo). Veja `back/TAURI.md`.

## Rodar em desenvolvimento

```bash
cd front && npm install && npm run gen-sounds && cd ..
cd back-node && npm install     # postinstall recompila o better-sqlite3 p/ Electron
npm run dev                     # dentro de back-node/: sobe o Vite do front + a janela Electron
```

Rode sempre por um terminal normal, **nao pelo terminal integrado do VSCode**
instalado via snap (ele injeta `LD_LIBRARY_PATH` do snap e quebra o Electron).

## Gerar instalador

```bash
cd back-node
npm run package                 # -> back-node/dist/
```

Linux: `.AppImage` (portavel) e `.deb` (`sudo apt install ./...deb`, instala em
`/opt/Pomodoro/`). Gerar `.exe` (Windows) exige buildar num Windows/CI porque o
`better-sqlite3` e modulo nativo.

## Arquitetura do back-node

| Peca | Onde |
|---|---|
| Dominio (motor de blocos + recorrencia), **com testes** (`npm test`) | `src/main/domain/` |
| Camada de dados desacoplada (repository pattern) | `src/main/db/repositories/` — `types.ts` (interfaces) + `sqlite/` (impl). Trocar de banco = nova pasta com a mesma interface |
| Orquestracao (materialize, updateBlock, createBlock, ...) | `src/main/services/agenda.ts` |
| Scheduler de alarmes | `src/main/scheduler.ts` — `setTimeout` no processo main (nao sofre throttling; roda minimizado na bandeja) |
| IPC | `src/main/ipc.ts` (`ipcMain.handle`) + `src/preload/index.ts` (`window.api`) + `src/channels.ts` |
| Janela, bandeja, fechar-pra-bandeja, instancia unica | `src/main/index.ts` |

Banco: `~/.config/Pomodoro/pomodoro.sqlite` (Linux) /
`%APPDATA%\Pomodoro\pomodoro.sqlite` (Windows). Criado no primeiro uso; o
usuario nao instala banco nenhum. Esquema aplicado por `user_version`
(`src/main/db/schema.ts` + migrations em `db/index.ts`).

## Como funciona o alarme

O `scheduler` (processo main) dorme ate a proxima borda de bloco. Ao chegar:

1. emite `block-boundary` -> o renderer toca `alarm-end.wav` (`:50`) ou
   `alarm-start.wav` (`:00`) via elemento `<audio>`;
2. dispara a **notificacao nativa** do SO;
3. marca o bloco como concluido.

O som e liberado sem gesto do usuario (`webPreferences.autoplayPolicy`) e a
preferencia (ligado/desligado) fica no `localStorage` (`pomodoro:soundOn`,
default ligado) — abre ja no estado que voce deixou. Troque os sons colocando
arquivos seus em `front/public/` com os mesmos nomes.

**Fechar a janela = minimizar pra bandeja** (o app segue vivo alarmando). Menu
da bandeja -> "Sair" pra encerrar. No GNOME o icone da bandeja precisa da
extensao AppIndicator (o Ubuntu costuma ja trazer).

## Agendas

Uma agenda (template) e permanente e recorrente — voce nunca recria.

- Frequencia: `Nao repetir` (uma data), `Todos os dias`, `Dias da semana`
  (toggles) ou `Intervalo de dias` (a cada N dias a partir de uma data).
- Janela de validade opcional: `valido de` / `valido ate` (o "de" fica travado
  ao editar).
- O `materialize` mantem sempre ~120 dias a frente gerados (na criacao/edicao e
  1x por dia pelo scheduler). Navegar no calendario carrega a semana visivel.
- Header da Agenda: **"+ nova agenda"**, **"ver agendas"** (lista com editar /
  excluir), botao de **saldo**, e **⋮** -> "excluir todos os eventos cancelados".

### Editar agenda

Salva de **hoje em diante** (passado nunca muda). Para cada dia futuro nao
editado a mao: se ainda ocorre -> regenera com a config nova; se **deixou de
ocorrer** (mudou a recorrencia/validade) -> os eventos que ainda nao comecaram
viram **cancelados** (nao sao apagados), na cor `#CE2D4F`.

## Eventos

Cada bloco tem `seq` = posicao 1-based dentro do mesmo tipo no dia (foco1,
foco2, pausa1...). `block_slot(template_id, kind, seq)` guarda override de
nome / duracao / atraso por posicao.

- **Criar** avulso: clique num horario do calendario. Se colidir, os eventos
  seguintes do dia sao empurrados ("estaciona e recoloca" pra nao violar o
  UNIQUE). Fica com `block.manual = 1` e trava o dia.
- **Editar** (gaveta lateral): nome + horario. Ao salvar escolhe **so este
  evento** ou **todos os dias dessa agenda**. Evento em andamento ou ja passado:
  o horario fica bloqueado (nome ainda pode).
- **Cancelar** (botao no popover, com confirmacao): evento de agenda vira
  `status = 'skipped'` (da pra **retomar** depois); evento avulso e apagado.
- **Excluir** um evento ja cancelado: apaga de vez (com confirmacao).

## Pausar / saldo de foco

Botao "pausar" em qualquer evento em andamento (tela de Foco e popover). Nao
mexe em horario — so silencia o alarme enquanto pausado.

O tempo pausado **enquanto o evento atual e foco** vira um **saldo**
(`localStorage` `pomodoro:debt:<data>`, zera por dia). Pausa curta/longa nao
conta. Botao de saldo no header; quando a agenda do dia acaba com saldo, abre um
modal:

- **fazer agora** — bloco de foco comecando agora;
- **⋮** -> **adicionar ao fim do dia**, **escolher data + horario**, **zerar
  saldo**;
- **agora nao** — mantem.

## Ainda por fazer

- Botao de export/import (JSON) na UI — os comandos ja existem no back
- Toggle de autostart no login
- Estatisticas a partir de `session_log`
