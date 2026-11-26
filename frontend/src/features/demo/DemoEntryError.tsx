// A refused server demo, with the browser-only demo as a way out.
export function DemoEntryError({ message, onOffline }: { message: string; onOffline: () => void }) {
  return (
    <p role="alert" className="max-w-sm text-center text-xs text-[var(--color-red-700)]">
      {message}{' '}
      <button type="button" onClick={onOffline} className="font-semibold underline">
        Abrir a demonstração offline
      </button>
    </p>
  )
}
