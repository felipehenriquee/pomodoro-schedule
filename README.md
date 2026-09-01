# Pomodoro Schedule

App desktop onde você cadastra **agendas recorrentes** e recebe **alarme sonoro
+ notificação** nas trocas de bloco do pomodoro.

Exemplo de agenda: `seg-sex, 08:00-18:00, 50 min de foco, 10 min de pausa, pausa
longa 12:00-14:00`. Como `50 + 10 = 60`, o alarme cai sempre no minuto `:50`
(fim do foco) e no `:00` (volta ao foco).

## Stack

```
pomodoro/
├─ front/       React + Vite + TypeScript + FullCalendar (UI, Web Audio)
└─ back-node/   Electron + TypeScript + better-sqlite3
```

- `back/` guarda uma versão anterior do backend em **Rust/Tauri**, mantida só
  como referência (fora deste repo). Veja `back/TAURI.md`.

## Rodar em desenvolvimento

```bash
cd front && npm install && npm run gen-sounds && cd ..
cd back-node && npm install     # postinstall recompila o better-sqlite3 p/ Electron
npm run dev                     # dentro de back-node/: sobe o Vite do front + a janela Electron
```

Rode sempre por um terminal normal, **não pelo terminal integrado do VSCode**
instalado via snap (ele injeta `LD_LIBRARY_PATH` do snap e quebra o Electron).

## Gerar instalador

```bash
cd back-node
npm run package                 # -> back-node/dist/
```

Linux: `.AppImage` (portável) e `.deb` (`sudo apt install ./...deb`, instala em
`/opt/Pomodoro/`). Gerar `.exe` (Windows) exige buildar num Windows/CI porque o
`better-sqlite3` é módulo nativo.

## Arquitetura do back-node

| Peça | Onde |
|---|---|
| Domínio (motor de blocos + recorrência), **com testes** (`npm test`) | `src/main/domain/` |
| Camada de dados desacoplada (repository pattern) | `src/main/db/repositories/` — `types.ts` (interfaces) + `sqlite/` (impl). Trocar de banco = nova pasta com a mesma interface |
| Orquestração (materialize, updateBlock, createBlock, ...) | `src/main/services/agenda.ts` |
| Scheduler de alarmes | `src/main/scheduler.ts` — `setTimeout` no processo main (não sofre throttling; roda minimizado na bandeja) |
| IPC | `src/main/ipc.ts` (`ipcMain.handle`) + `src/preload/index.ts` (`window.api`) + `src/channels.ts` |
| Janela, bandeja, fechar-pra-bandeja, instância única | `src/main/index.ts` |

Banco: `~/.config/Pomodoro/pomodoro.sqlite` (Linux) /
`%APPDATA%\Pomodoro\pomodoro.sqlite` (Windows). Criado no primeiro uso; o
usuário não instala banco nenhum. Esquema aplicado por `user_version`
(`src/main/db/schema.ts` + migrations em `db/index.ts`).

## Como funciona o alarme

O `scheduler` (processo main) dorme até a próxima borda de bloco. Ao chegar:

1. emite `block-boundary` -> o renderer toca `alarm-end.wav` (`:50`) ou
   `alarm-start.wav` (`:00`) via elemento `<audio>`;
2. dispara a **notificação nativa** do SO;
3. marca o bloco como concluído.

O som é liberado sem gesto do usuário (`webPreferences.autoplayPolicy`) e a
preferência (ligado/desligado) fica no `localStorage` (`pomodoro:soundOn`,
default ligado) — abre já no estado que você deixou. Troque os sons colocando
arquivos seus em `front/public/` com os mesmos nomes.

**Fechar a janela = minimizar pra bandeja** (o app segue vivo alarmando). Menu
da bandeja -> "Sair" pra encerrar. No GNOME o ícone da bandeja precisa da
extensão AppIndicator (o Ubuntu costuma já trazer).

## Agendas

Uma agenda (template) é permanente e recorrente — você nunca recria.

- Frequência: `Não repetir` (uma data), `Todos os dias`, `Dias da semana`
  (toggles) ou `Intervalo de dias` (a cada N dias a partir de uma data).
- Janela de validade opcional: `válido de` / `válido até` (o "de" fica travado
  ao editar).
- O `materialize` mantém sempre ~120 dias à frente gerados (na criação/edição e
  1x por dia pelo scheduler). Navegar no calendário carrega a semana visível.
- Header da Agenda: **"+ nova agenda"**, **"ver agendas"** (lista com editar /
  excluir), botão de **saldo**, e **⋮** -> "excluir todos os eventos cancelados".

### Editar agenda

Salva de **hoje em diante** (passado nunca muda). Para cada dia futuro não
editado à mão: se ainda ocorre -> regenera com a config nova; se **deixou de
ocorrer** (mudou a recorrência/validade) -> os eventos que ainda não começaram
viram **cancelados** (não são apagados), na cor `#CE2D4F`.

## Eventos

Cada bloco tem `seq` = posição 1-based dentro do mesmo tipo no dia (foco1,
foco2, pausa1...). `block_slot(template_id, kind, seq)` guarda override de
nome / duração / atraso por posição.

- **Criar** avulso: clique num horário do calendário. Se colidir, os eventos
  seguintes do dia são empurrados ("estaciona e recoloca" pra não violar o
  UNIQUE). Fica com `block.manual = 1` e trava o dia.
- **Editar** (gaveta lateral): nome + horário. Ao salvar escolhe **só este
  evento** ou **todos os dias dessa agenda**. Evento em andamento ou já passado:
  o horário fica bloqueado (nome ainda pode).
- **Cancelar** (botão no popover, com confirmação): evento de agenda vira
  `status = 'skipped'` (dá pra **retomar** depois); evento avulso é apagado.
- **Excluir** um evento já cancelado: apaga de vez (com confirmação).

## Pausar / saldo de foco

Botão "pausar" em qualquer evento em andamento (tela de Foco e popover). Não
mexe em horário — só silencia o alarme enquanto pausado.

O tempo pausado **enquanto o evento atual é foco** vira um **saldo**
(`localStorage` `pomodoro:debt:<data>`, zera por dia). Pausa curta/longa não
conta. Botão de saldo no header; quando a agenda do dia acaba com saldo, abre um
modal:

- **fazer agora** — bloco de foco começando agora;
- **⋮** -> **adicionar ao fim do dia**, **escolher data + horário**, **zerar
  saldo**;
- **agora não** — mantém.

## Ainda por fazer

- Botão de export/import (JSON) na UI — os comandos já existem no back
- Toggle de autostart no login
- Estatísticas a partir de `session_log`
