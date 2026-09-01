import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { AgendaHeader } from "./AgendaHeader";
import { Calendar } from "../Calendar";
import { ConfirmDialog } from "../ConfirmDialog";
import { EventCreateModal } from "../EventCreateModal";
import { EventDrawer } from "../EventDrawer";
import { EventPopover } from "../EventPopover";
import { TemplateListModal } from "../TemplateListModal";
import { TemplateModal } from "../TemplateModal";
import { blockService, isDesktop, templateService } from "../../services";
import type { Block, CurrentBlock, TemplateInput } from "../../models";

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
  const [confirmClear, setConfirmClear] = useState(false);
  const { t } = useTranslation();

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
    await blockService.remove(confirmBlock.id);
    setConfirmBlock(null);
    onReload();
  }

  async function restore(block: Block) {
    setPop(null);
    await blockService.restore(block.id);
    onReload();
  }

  return (
    <div className="app">
      <AgendaHeader
        current={current}
        soundOn={soundOn}
        debtMs={debtMs}
        onNewTemplate={() => setTplForm({ open: true })}
        onOpenList={() => setListOpen(true)}
        onOpenRecover={onOpenRecover}
        onClearCancelled={() => setConfirmClear(true)}
        onToggleSound={onToggleSound}
        onOpenFocus={onOpenFocus}
      />

      <main>
        <div className="agenda-alerts">
          {!isDesktop && (
            <p className="warn">
              <Trans i18nKey="agenda.alerts.notDesktop">
                Rodando fora do app desktop: o calendário e o alarme só
                funcionam no app (Electron/Tauri), não no{" "}
                <code>npm run dev</code> puro.
              </Trans>
            </p>
          )}
          {error && (
            <p className="warn">{t("agenda.alerts.loadError", { error })}</p>
          )}
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
        onEdit={(tpl) => {
          setListOpen(false);
          setTplForm({ open: true, initial: templateService.toInput(tpl) });
        }}
        onClone={(tpl) => {
          setListOpen(false);
          setTplForm({ open: true, initial: templateService.toClone(tpl) });
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
            ? t("agenda.confirm.deleteTitle")
            : t("agenda.confirm.cancelTitle")
        }
        message={
          confirmBlock?.status === "skipped"
            ? t("agenda.confirm.deleteMessage")
            : t("agenda.confirm.cancelMessage")
        }
        confirmLabel={
          confirmBlock?.status === "skipped"
            ? t("agenda.confirm.deleteConfirm")
            : t("agenda.confirm.cancelConfirm")
        }
        onConfirm={confirmDelete}
        onCancel={() => setConfirmBlock(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        danger
        title={t("agenda.confirm.clearTitle")}
        message={t("agenda.confirm.clearMessage")}
        confirmLabel={t("agenda.confirm.clearConfirm")}
        onConfirm={async () => {
          await blockService.clearCancelled();
          setConfirmClear(false);
          onReload();
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
