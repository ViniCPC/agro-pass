import { STAGE_COPY } from './landing-content'

export function stageLabel(type: string) {
  return STAGE_COPY[type as keyof typeof STAGE_COPY]?.done ?? type
}

export function stageShort(type: string) {
  return STAGE_COPY[type as keyof typeof STAGE_COPY]?.short ?? type
}

// "10 de out.": the compact date used in tables and fragments.
export function dayMonth(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// A calendar date stored as midnight UTC (e.g. the harvest date): shown in
// UTC so the browser's time zone does not move it to the day before.
export function calendarDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
