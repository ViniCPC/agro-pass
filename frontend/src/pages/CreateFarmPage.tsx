import { useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, Loader2, LocateFixed, PackagePlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField, INPUT_CLASS } from '@/components/FormField'
import { describedBy } from '@/components/form'
import { PageContainer } from '@/components/PageContainer'
import { useAuth } from '@/contexts/auth-context'
import { RoleHandoff } from '@/features/auth/RoleHandoff'
import { canCreateFarm } from '@/features/auth/roles'
import {
  EMPTY_FARM_FORM,
  parseDecimal,
  UF_OPTIONS,
  validateFarmForm,
  type FarmFormErrors,
  type FarmFormValues,
} from '@/features/farms/farm-form'
import { useActingRole } from '@/hooks/useActingRole'
import { useCreateFarm, useProducers } from '@/hooks/useFarms'
import { apiErrorMessage } from '@/lib/api-error'
import type { Farm } from '@/types/api'

const CARD =
  'rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]'
const PRIMARY =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-teal-600)] disabled:cursor-not-allowed disabled:opacity-60'
const SECONDARY =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-700)]'

function Header() {
  const navigate = useNavigate()
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => navigate('/farms')}
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] shadow-sm hover:text-[var(--color-ink)]"
        aria-label="Voltar para fazendas"
      >
        <ArrowLeft size={15} />
      </button>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">Cadastrar propriedade</h1>
        <p className="mt-0.5 max-w-xl text-sm text-[var(--color-ink-subtle)]">
          A propriedade é a origem dos lotes. Município, localização aproximada e CAR aparecem no passaporte público.
        </p>
      </div>
    </div>
  )
}

function FarmCreated({ farm, isDemoMode, onAnother }: { farm: Farm; isDemoMode: boolean; onAnother: () => void }) {
  return (
    <section className={`${CARD} max-w-2xl`} aria-live="polite">
      <p className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-[var(--color-green-50)] px-2.5 py-1 text-xs font-semibold text-[var(--color-green-700)]">
        <CheckCircle2 size={12} />
        Propriedade cadastrada
      </p>
      <h2 className="mt-3 text-lg font-semibold text-[var(--color-ink)]">{farm.name}</h2>
      <p className="text-sm text-[var(--color-ink-subtle)]">
        {farm.city}/{farm.state}
        {farm.carNumber ? ` · CAR ${farm.carNumber}` : ''}
      </p>
      <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
        O próximo passo é criar um lote com origem nesta propriedade. Cada etapa registrada depois vira um evento
        encadeado no passaporte.
      </p>
      {isDemoMode && (
        <p className="mt-3 rounded-lg bg-[var(--color-amber-50)] px-3 py-2 text-xs text-[var(--color-amber-700)]">
          Demonstração: a propriedade fica salva só neste navegador e some ao sair da demo.
        </p>
      )}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link to={`/batches/new?farmId=${encodeURIComponent(farm.id)}`} className={PRIMARY}>
          <PackagePlus size={15} />
          Criar primeiro lote
        </Link>
        <Link to={`/farms/${encodeURIComponent(farm.id)}`} className={SECONDARY}>
          Ver propriedade
        </Link>
        <button type="button" onClick={onAnother} className={SECONDARY}>
          Cadastrar outra
        </button>
      </div>
    </section>
  )
}

export function CreateFarmPage() {
  const { user } = useAuth()
  const { role, isDemoMode } = useActingRole()
  const [values, setValues] = useState<FarmFormValues>(EMPTY_FARM_FORM)
  const [errors, setErrors] = useState<FarmFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [created, setCreated] = useState<Farm | null>(null)

  const producerMode = isDemoMode ? 'name' : role === 'ADMIN' ? 'select' : 'own'
  const producers = useProducers(producerMode === 'select')
  const createFarm = useCreateFarm()

  if (!canCreateFarm(role)) {
    return (
      <PageContainer className="space-y-5">
        <Header />
        <RoleHandoff role="PRODUCER">Propriedades são cadastradas pelo produtor ou por um administrador.</RoleHandoff>
      </PageContainer>
    )
  }

  if (producerMode === 'own' && !user?.producerId) {
    return (
      <PageContainer className="space-y-5">
        <Header />
        <p className="rounded-lg bg-[var(--color-amber-50)] px-4 py-3 text-sm text-[var(--color-amber-700)]">
          Sua conta de produtor ainda não está vinculada a um cadastro de produtor. Peça a um administrador para
          fazer o vínculo antes de cadastrar propriedades.
        </p>
      </PageContainer>
    )
  }

  if (created) {
    return (
      <PageContainer className="space-y-5">
        <Header />
        <FarmCreated
          farm={created}
          isDemoMode={isDemoMode}
          onAnother={() => {
            setCreated(null)
            setValues(EMPTY_FARM_FORM)
          }}
        />
      </PageContainer>
    )
  }

  function setField(key: keyof FarmFormValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setSubmitError(null)
  }

  function fillMyLocation() {
    if (!('geolocation' in navigator)) {
      setSubmitError('Este navegador não informa a localização. Digite as coordenadas.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        setField('latitude', position.coords.latitude.toFixed(6))
        setField('longitude', position.coords.longitude.toFixed(6))
      },
      () => {
        setLocating(false)
        setSubmitError('Não foi possível obter a localização. Digite as coordenadas.')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateFarmForm(values, producerMode)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const base = {
      name: values.name.trim(),
      city: values.city.trim(),
      state: values.state,
      latitude: parseDecimal(values.latitude)!,
      longitude: parseDecimal(values.longitude)!,
      carNumber: values.carNumber.trim() || undefined,
      totalAreaHa: parseDecimal(values.totalAreaHa) ?? undefined,
    }
    try {
      const farm = await createFarm.mutateAsync(
        producerMode === 'name'
          ? { mode: 'demo', input: { ...base, producerName: values.producerName } }
          : {
              mode: 'live',
              input: { ...base, producerId: producerMode === 'own' ? user!.producerId! : values.producerId },
            },
      )
      setCreated(farm)
    } catch (error) {
      setSubmitError(apiErrorMessage(error, 'Não foi possível cadastrar a propriedade.'))
    }
  }

  const pending = createFarm.isPending
  const input = (key: keyof FarmFormValues, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => ({
    id: `farm-${key}`,
    value: values[key],
    disabled: pending,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setField(key, event.target.value),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': describedBy(`farm-${key}`, errors[key]),
    className: INPUT_CLASS,
    ...extra,
  })

  return (
    <PageContainer className="space-y-5">
      <Header />

      <form onSubmit={handleSubmit} noValidate className={`${CARD} max-w-3xl space-y-6`}>
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-[var(--color-ink)]">Identificação</legend>
          <FormField id="farm-name" label="Nome da propriedade" error={errors.name}>
            <input {...input('name', { placeholder: 'Ex.: Fazenda Boa Esperança', autoComplete: 'off' })} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <FormField id="farm-city" label="Município" error={errors.city}>
              <input {...input('city', { placeholder: 'Ex.: Patrocínio', autoComplete: 'address-level2' })} />
            </FormField>
            <FormField id="farm-state" label="UF" error={errors.state}>
              <select
                id="farm-state"
                value={values.state}
                disabled={pending}
                onChange={(event) => setField('state', event.target.value)}
                aria-invalid={Boolean(errors.state)}
                aria-describedby={describedBy('farm-state', errors.state)}
                className={INPUT_CLASS}
              >
                <option value="">UF</option>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-[var(--color-ink)]">Localização</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField id="farm-latitude" label="Latitude" error={errors.latitude} hint="Ex.: -18,9439">
              <input {...input('latitude', { inputMode: 'decimal' })} />
            </FormField>
            <FormField id="farm-longitude" label="Longitude" error={errors.longitude} hint="Ex.: -46,9925">
              <input {...input('longitude', { inputMode: 'decimal' })} />
            </FormField>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--color-ink-subtle)]">
              Graus decimais, como no Google Maps. O passaporte público arredonda para 2 casas (cerca de 1 km).
            </p>
            <button type="button" onClick={fillMyLocation} disabled={pending || locating} className={`${SECONDARY} shrink-0`}>
              {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
              Usar minha localização
            </button>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-[var(--color-ink)]">Registro</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="farm-carNumber"
              label="Número do CAR"
              optional
              error={errors.carNumber}
              hint="Recibo do Cadastro Ambiental Rural."
            >
              <input {...input('carNumber', { placeholder: 'UF-0000000-XXXX...', autoComplete: 'off' })} />
            </FormField>
            <FormField id="farm-totalAreaHa" label="Área total (ha)" optional error={errors.totalAreaHa}>
              <input {...input('totalAreaHa', { inputMode: 'decimal', placeholder: 'Ex.: 312,4' })} />
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-base font-semibold text-[var(--color-ink)]">Produtor responsável</legend>
          {producerMode === 'own' && (
            <p className="rounded-lg bg-[var(--color-page)] px-3 py-2.5 text-sm text-[var(--color-ink-muted)]">
              Vinculada à sua conta de produtor{user?.name ? `: ${user.name}` : ''}.
            </p>
          )}
          {producerMode === 'select' && (
            <FormField id="farm-producerId" label="Produtor" error={errors.producerId}>
              <select
                id="farm-producerId"
                value={values.producerId}
                disabled={pending || producers.isLoading}
                onChange={(event) => setField('producerId', event.target.value)}
                aria-invalid={Boolean(errors.producerId)}
                aria-describedby={describedBy('farm-producerId', errors.producerId)}
                className={INPUT_CLASS}
              >
                <option value="">{producers.isLoading ? 'Carregando produtores...' : 'Selecione o produtor'}</option>
                {producers.data?.data.map((producer) => (
                  <option key={producer.id} value={producer.id}>
                    {producer.name}
                  </option>
                ))}
              </select>
              {producers.error && (
                <p className="text-xs text-[var(--color-red-700)]">Não foi possível carregar os produtores.</p>
              )}
            </FormField>
          )}
          {producerMode === 'name' && (
            <FormField
              id="farm-producerName"
              label="Nome do produtor"
              error={errors.producerName}
              hint="Demonstração: use um nome fictício. Ele aparece no passaporte público."
            >
              <input {...input('producerName', { placeholder: 'Ex.: Helena Duarte', autoComplete: 'off' })} />
            </FormField>
          )}
        </fieldset>

        {submitError && (
          <p role="alert" className="rounded-lg bg-[var(--color-red-50)] px-3 py-2 text-sm text-[var(--color-red-700)]">
            {submitError}
          </p>
        )}

        <div className="flex flex-col gap-2 border-t border-[var(--color-border-soft)] pt-5 sm:flex-row sm:justify-end">
          <Link to="/farms" className={SECONDARY}>
            Cancelar
          </Link>
          <button type="submit" disabled={pending} className={PRIMARY}>
            {pending && <Loader2 size={15} className="animate-spin" />}
            {pending ? 'Cadastrando...' : 'Cadastrar propriedade'}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}
