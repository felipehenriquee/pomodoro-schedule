import { useState } from "react";
import { Calendar } from "./Calendar";
import { ConfirmDialog } from "./ConfirmDialog";
import { EventCreateModal } from "./EventCreateModal";
import { EventDrawer } from "./EventDrawer";
import { EventPopover } from "./EventPopover";
import { Icon } from "./Icon";
import { TemplateListModal } from "./TemplateListModal";
import { TemplateModal } from "./TemplateModal";
import { TimerHud } from "./TimerHud";
import { api, isDesktop } from "../lib/ipc";
import { fmtDuration } from "../lib/time";
import type { Block, CurrentBlock, Template, TemplateInput } from "../lib/types";

type Props = {
  blocks: Block[];
  error: string | null;
  current: CurrentBlock | null;
  soundOn: boolean;
  paused: boolean;
  debtMs: number;
  onToggleSound: () => void;
  onTogglePause: () => void;
  onOpenRecover: () => void;
  onReload: () => void;
  onRangeChange: (from: string, to: string) => void;
  onOpenFocus: () => void;
};

type Pop = { block: Block; x: number; y: number };
type TplForm = { open: boolean; initial?: TemplateInput };

function toInput(t: Template): TemplateInput {
  return {
    id: t.id,
    name: t.name,
    days_of_week: t.days_of_week,
    start_time: t.start_time,
    end_time: t.end_time,
    work_min: t.work_min,
    short_break_min: t.short_break_min,
    active: t.active,
    freq: t.freq,
    anchor_date: t.anchor_date,
    interval_days: t.interval_days,
    valid_from: t.valid_from,
    valid_until: t.valid_until,
    long_breaks: t.long_breaks.map((b) => ({
      start_time: b.start_time,
      end_time: b.end_time,
      label: b.label,
    })),
  };
}

export function AgendaView({
  blocks,
  error,
  current,
  soundOn,
  paused,
  debtMs,
  onToggleSound,
  onTogglePause,
  onOpenRecover,
  onReload,
  onRangeChange,
  onOpenFocus,
}: Props) {
  const [tplForm, setTplForm] = useState<TplForm>({ open: false });
  const [listOpen, setListOpen] = useState(false);
  const [createAt, setCreateAt] = useState<Date | null>(null);
  const [pop, setPop] = useState<Pop | null>(null);
  const [drawer, setDrawer] = useState<{ block: Block; readOnly: boolean } | null>(
    null
  );
  const [confirmBlock, setConfirmBlock] = useState<Block | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  function openEvent(id: number, x: number, y: number) {
    const block = blocks.find((b) => b.id === id);
    if (block) setPop({ block, x, y });
  }

  function askDelete(block: Block) {
    setPop(null);
    setConfirmBlock(block);
  }

  async function confirmDelete() {
    if (!confirmBlock) return;
    await api.deleteBlock(confirmBlock.id);
    setConfirmBlock(null);
    onReload();
  }

  async function restore(block: Block) {
    setPop(null);
    await api.setBlockStatus(block.id, "pending");
    onReload();
  }

  return (
    <div className="app">
      <header>
        <h1>Pomodoro</h1>

        <div className="header-right">
          <button className="chip" onClick={() => setTplForm({ open: true })}>
            + nova agenda
          </button>
          <button className="chip" onClick={() => setListOpen(true)}>
            ver agendas
          </button>

          <button
            className={`chip debt-chip ${debtMs > 1000 ? "on" : ""}`}
            title="Saldo de foco pausado"
            onClick={onOpenRecover}
          >
            saldo &minus;{fmtDuration(debtMs)}
          </button>

          <div className="header-menu-wrap">
            <button
              className="row-ico"
              title="Mais opções"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon name="more_vert" size={18} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="menu-backdrop"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="header-menu">
                  <button
                    className="header-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmClear(true);
                    }}
                  >
                    <Icon name="delete" size={16} />
                    excluir todos os eventos cancelados
                  </button>
                </div>
              </>
            )}
          </div>

          <div
            className="hud-box"
            role="button"
            tabIndex={0}
            title="Ir para o Foco"
            onClick={onOpenFocus}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpenFocus();
            }}
          >
            <TimerHud data={current} />
            <button
              className="sound-toggle"
              title={soundOn ? "Desativar som do alarme" : "Ativar som do alarme"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSound();
              }}
            >
              <Icon name={soundOn ? "notifications_active" : "notifications_off"} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="agenda-alerts">
          {!isDesktop && (
            <p className="warn">
              Rodando fora do app desktop: o calendario e o alarme so funcionam no
              app (Electron/Tauri), nao no <code>npm run dev</code> puro.
            </p>
          )}
          {error && <p className="warn">Erro ao carregar blocos: {error}</p>}
        </div>
        <div className="agenda-cal">
          <Calendar
            blocks={blocks}
            onEventClick={openEvent}
            onDateClick={(d) => setCreateAt(d)}
            onRangeChange={onRangeChange}
          />
        </div>
      </main>

      <TemplateModal
        open={tplForm.open}
        initial={tplForm.initial}
        onClose={() => setTplForm({ open: false })}
        onSaved={onReload}
      />

      <TemplateListModal
        open={listOpen}
        onClose={() => setListOpen(false)}
        onEdit={(t) => {
          setListOpen(false);
          setTplForm({ open: true, initial: toInput(t) });
        }}
        onChanged={onReload}
      />

      {createAt && (
        <EventCreateModal
          date={createAt}
          onClose={() => setCreateAt(null)}
          onCreated={onReload}
        />
      )}

      {pop && (
        <EventPopover
          block={pop.block}
          x={pop.x}
          y={pop.y}
          paused={paused}
          onTogglePause={onTogglePause}
          onView={() => {
            setDrawer({ block: pop.block, readOnly: true });
            setPop(null);
          }}
          onEdit={() => {
            setDrawer({ block: pop.block, readOnly: false });
            setPop(null);
          }}
          onDelete={() => askDelete(pop.block)}
          onRestore={() => restore(pop.block)}
          onClose={() => setPop(null)}
        />
      )}

      {drawer && (
        <EventDrawer
          block={drawer.block}
          readOnly={drawer.readOnly}
          onClose={() => setDrawer(null)}
          onSaved={onReload}
        />
      )}

      <ConfirmDialog
        open={confirmBlock !== null}
        danger
        title={
          confirmBlock?.status === "skipped"
            ? "Excluir evento"
            : "Cancelar evento"
        }
        message={
          confirmBlock?.status === "skipped"
            ? "Isso apaga o evento de vez. Não dá pra desfazer."
            : "O evento fica marcado como cancelado. Você pode retomá-lo depois."
        }
        confirmLabel={
          confirmBlock?.status === "skipped" ? "excluir" : "cancelar evento"
        }
        onConfirm={confirmDelete}
        onCancel={() => setConfirmBlock(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        danger
        title="Excluir eventos cancelados"
        message="Apaga de vez todos os eventos marcados como cancelados. Não dá pra desfazer."
        confirmLabel="excluir todos"
        onConfirm={async () => {
          await api.deleteCancelled();
          setConfirmClear(false);
          onReload();
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
