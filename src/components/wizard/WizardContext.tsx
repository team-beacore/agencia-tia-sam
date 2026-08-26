import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { WizardFlowId } from '../../config/wizard'

type WizardContextValue = {
  activeFlow: WizardFlowId | null
  prefill: Record<string, string>
  openWizard: (flow: WizardFlowId, prefill?: Record<string, string>) => void
  closeWizard: () => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [activeFlow, setActiveFlow] = useState<WizardFlowId | null>(null)
  const [prefill, setPrefill] = useState<Record<string, string>>({})

  const openWizard = useCallback((flow: WizardFlowId, pre?: Record<string, string>) => {
    setPrefill(pre ?? {})
    setActiveFlow(flow)
  }, [])

  const closeWizard = useCallback(() => setActiveFlow(null), [])

  const value = useMemo(
    () => ({ activeFlow, prefill, openWizard, closeWizard }),
    [activeFlow, prefill, openWizard, closeWizard],
  )

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard deve ser usado dentro de WizardProvider')
  return ctx
}
