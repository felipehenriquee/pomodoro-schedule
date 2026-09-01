import type { Template, TemplateInput } from "../models";
import { isoDate } from "../lib/time";
import { api } from "./ipc";

/** Maps a persisted Template back to the editable TemplateInput shape. */
export function toTemplateInput(t: Template): TemplateInput {
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

/**
 * A TemplateInput for cloning: no id (so it's created, not edited), the name
 * gets a " clone" suffix, and any date that's already in the past is bumped to
 * today.
 */
export function toCloneInput(t: Template): TemplateInput {
  const base = toTemplateInput(t);
  const today = isoDate(new Date());
  const notPast = (d: string | null) => (d && d < today ? today : d);
  return {
    ...base,
    id: undefined,
    name: `${t.name} clone`,
    anchor_date: notPast(base.anchor_date),
    valid_from: notPast(base.valid_from),
    valid_until: notPast(base.valid_until),
  };
}

export const templateService = {
  list: (): Promise<Template[]> => api.listTemplates(),
  save: (input: TemplateInput): Promise<number> => api.saveTemplate(input),
  remove: (id: number): Promise<void> => api.deleteTemplate(id),
  toInput: toTemplateInput,
  toClone: toCloneInput,
};
