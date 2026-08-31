# Pomodoro (agenda + alarme)

App desktop onde voce cadastra agendas recorrentes e recebe
**alarme sonoro + notificacao** nas trocas de bloco do pomodoro.

Exemplo de agenda: `seg-sex, 09:00-18:00, 50 min de foco, 10 min de pausa,
pausa longa 12:00-14:00`. Como `50 + 10 = 60`, o alarme cai sempre no
minuto `:50` (fim do foco) e no `:00` (volta ao foco).

## Estrutura

```
pomodoro/
├─ front/       React + Vite + TS + FullCalendar (UI, Web Audio) - compartilhado
├─ back-node/   Electron + TypeScript + better-sqlite3  <-- versao ATIVA
└─ back/        Tauri 2 / Rust  (mantida como referencia)
```

O `front/` detecta em runtime qual back esta rodando (`window.api` do Electron
ou `invoke()` do Tauri), entao os dois continuam funcionando.

## back-node (Electron) — rodar

```bash
# 1. deps
cd front && npm install && npm run gen-sounds && cd ..
cd back-node && npm install        # postinstall recompila o better-sqlite3 p/ Electron

# 2. dev (sobe o Vite do front + a janela Electron)
npm run dev            # dentro de back-node/

# 3. instalador (.AppImage / .exe / .dmg)
npm run package        # gera em back-node/dist/
```

- Domino (motor de blocos + recorrencia): `back-node/src/main/domain/` (com testes: `npm test`)
- Camada de dados desacoplada: `back-node/src/main/db/repositories/` (interfaces em
  `types.ts`, implementacao SQLite em `sqlite/`) — trocar de banco = nova pasta
  implementando a mesma interface
- Orquestracao (o que eram os commands): `back-node/src/main/services/agenda.ts`
- Scheduler de alarmes: `back-node/src/main/scheduler.ts` (`setTimeout` no processo
  main do Electron, nao sofre throttling)
- IPC: `back-node/src/main/ipc.ts` (handlers) + `back-node/src/preload/index.ts`
  (`window.api`)
- Banco: `~/.config/Pomodoro/pomodoro.sqlite` (Linux) /
  `%APPDATA%\Pomodoro\pomodoro.sqlite` (Windows). O usuario nao instala banco
  nenhum — o arquivo e criado no primeiro uso.

Pre-requisitos p/ empacotar no Linux: `build-essential` (ja instalado antes).
Gerar `.exe` a partir do Linux exige buildar num Windows/CI (modulo nativo).

---

## back (Tauri / Rust) — referencia

Versao original em Rust, mantida como referencia. Os itens abaixo sao do Tauri.

- `back/src/domain/blocks.rs`  — motor que gera os blocos do dia (com testes)
- `back/src/domain/recurrence.rs` — recorrencia por dia da semana
- `back/src/commands.rs` — API chamada pelo front via `invoke()`
- `back/src/scheduler.rs` — tarefa de fundo que dispara evento + notificacao na borda
- `back/migrations/` — schema SQLite
- Banco: `~/.local/share/com.felipe.pomodoro/pomodoro.sqlite` (Linux) /
  `%APPDATA%\com.felipe.pomodoro\` (Windows) — sobrevive a desligar o PC.

## Pre-requisitos

1. **Node** 18+ e **Rust** (via <https://rustup.rs>)
2. **Tauri CLI**: `cargo install tauri-cli --version '^2'`
3. **Libs de sistema (Linux/Ubuntu/Debian)**:
   ```bash
   sudo apt update && sudo apt install -y \
     libwebkit2gtk-4.1-dev build-essential curl wget file \
     libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
   ```
   (Windows: WebView2 — ja vem no Win10/11. macOS: Xcode Command Line Tools.)

## Rodar em desenvolvimento

```bash
# 1. deps do front + assets gerados
cd front
npm install
npm run gen-sounds          # cria front/public/alarm-*.wav
cd ..

# 2. icone placeholder do app (uma vez)
node back/scripts/gen-icon.mjs
#    opcional: set completo de icones (ico/icns/tamanhos)
#    cd back && cargo tauri icon icons/icon.png

# 3. sobe tudo (Vite + janela Tauri)
cd back
cargo tauri dev
```

O `cargo tauri dev` roda o `beforeDevCommand` (a partir da raiz do projeto,
pasta acima de `back/`) que inicia o Vite em `localhost:1420` automaticamente.

## Empacotar (instalador nativo)

```bash
cd back
cargo tauri build
```

Gera `.deb`/`.AppImage` (Linux), `.msi`/`.exe` (Windows) ou `.dmg` (macOS)
em `back/target/release/bundle/`.

## Como funciona o alarme

1. No primeiro uso, clique em **"Ativar som do alarme"** (navegadores exigem
   um gesto pra liberar audio).
2. O `scheduler` no backend dorme ate a proxima borda de bloco. Ao chegar:
   - emite o evento `block-boundary` → o front toca `alarm-end.wav` (`:50`)
     ou `alarm-start.wav` (`:00`);
   - dispara uma **notificacao nativa** do SO;
   - marca o bloco como concluido.
3. **Fechar a janela = minimizar pra bandeja** (o processo segue vivo pra
   continuar alarmando). Use o menu da bandeja → "Sair" pra encerrar de vez.
4. Para o app subir junto com o PC, habilite o autostart (plugin ja incluso).

Troque os sons colocando seus proprios arquivos em `front/public/` com os
mesmos nomes (`alarm-end.wav`, `alarm-start.wav`).

## Backup dos dados

Comandos `export_data` / `import_data` (JSON) ja existem no backend — falta
so ligar um botao na UI. O arquivo `.sqlite` tambem pode ser copiado direto.

## Frequencia da agenda

Ao criar: `Nao repetir` (uma data), `Todos os dias`, `Dias da semana` (toggles) ou
`Intervalo de dias` (a cada N dias a partir de uma data). Guardado em
`schedule_template.freq` / `anchor_date` / `interval_days`.

## Editar / excluir evento

Cada bloco tem um `seq` = posicao 1-based dentro do mesmo `kind` no dia
(foco1, foco2, pausa1...). Tabela `block_slot(template_id, kind, seq)` guarda
override de nome/duracao por posicao.

Clique num evento -> popover (ver / editar / excluir / fechar + pausar).
"Ver"/"Editar" abrem a gaveta lateral: muda nome e horario; ao salvar escolhe:

- **so este evento**: muda so aquele bloco + empurra os seguintes do dia +
  trava o dia (`day_agenda.locked = 1`, `materialize` nao regenera mais).
- **todos os dias dessa agenda**: aplica **de hoje em diante** (dias passados
  nunca sao alterados). Foco/pausa curta -> override em `block_slot`
  (nome, `duration_min`, `offset_min` = atraso propagado). Pausa longa -> edita
  a linha `long_break` do template. Depois regenera os dias >= hoje nao travados
  e re-materializa ~90 dias. **Nunca** altera o nome da agenda.

Mudar o horario empurra os blocos seguintes do dia pela diferenca ("estaciona e
recoloca" pra nao colidir no UNIQUE). Evento **em andamento**: o front bloqueia a
edicao do horario (nome ainda pode).

## Pausar / saldo de foco

Botao "pausar" so aparece em eventos de **foco** (popover + tela de Foco).
Nao mexe em horario; so nao toca o alarme enquanto pausado.

O tempo somado em pausa vira um **saldo** (localStorage `pomodoro:debt:<data>`,
zera a cada dia). Um botao no header da Agenda (ao lado de "nova agenda") mostra
`saldo -MM:SS`. Quando a agenda do dia acaba (nada em andamento nem a seguir) e
ha saldo, abre um modal "Ficaram X de foco em pausa, deseja fazer agora?":
- **fazer agora** cria um bloco de foco de X comecando agora (empurra colisoes);
- **zerar saldo** descarta;
- **agora nao** mantem.

## Criar evento na agenda

Clique num horario do calendario -> modal "Novo evento": tipo (foco / pausa
curta / pausa longa), nome, inicio e fim. Se colidir com eventos existentes do
dia, os antigos sao empurrados em cadeia pra depois do novo terminar e a UI
avisa. Evento avulso fica com `block.manual = 1` e trava o dia (`locked`).

## Agendas (templates)

- Header da Agenda: **"+ nova agenda"** e **"ver agendas"**.
- "ver agendas" -> modal lista as agendas criadas (nome, frequencia, horario) com
  botao de **editar** e **excluir**.
- Editar uma agenda salva o template e **regenera os eventos futuros** dela
  (`saveTemplate` com id chama `clearFutureUnlockedBlocks`); dias editados a mao
  (`locked`) e dias passados nao mudam.
- Excluir remove o template e, por FK `ON DELETE CASCADE`, todos os
  `day_agenda` + `block` dele.

## Ainda por fazer

- Botao de export/import na UI
- Toggle de autostart na UI
- Marcar bloco como "pulado"
- Estatisticas a partir de `session_log`
