// Points a control at its FormField hint or error.
export function describedBy(id: string, error?: string | null) {
  return error ? `${id}-error` : `${id}-hint`
}
