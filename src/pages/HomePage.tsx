import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { FloatingWhatsApp } from '../components/layout/FloatingWhatsApp'
import { Hero } from '../components/home/Hero'
import { DecisionHub } from '../components/home/DecisionHub'
import { ServiceExplorer } from '../components/home/ServiceExplorer'
import { ProcessTimeline } from '../components/home/ProcessTimeline'
import { TrustSection } from '../components/home/TrustSection'
import { CounterSection } from '../components/home/CounterSection'
import { CompaniesSection } from '../components/home/CompaniesSection'
import { ProfessionalsSection } from '../components/home/ProfessionalsSection'
import { ProfessionalsGrid } from '../components/home/ProfessionalsGrid'
import { OpportunitiesSection } from '../components/home/OpportunitiesSection'
import { AboutSection } from '../components/home/AboutSection'
import { EditorialSection } from '../components/home/EditorialSection'
import { FAQ } from '../components/home/FAQ'
import { FinalCTA } from '../components/home/FinalCTA'
import { ContactWizard } from '../components/wizard/ContactWizard'
import { WizardProvider } from '../components/wizard/WizardContext'

/**
 * Agência Tia Sam — Cuidado que conecta.
 * Narrativa: quem somos → o que resolvemos → como trabalhamos → por que confiar → como contratar.
 */
export default function HomePage() {
  return (
    <WizardProvider>
      <div className="min-h-screen overflow-x-clip bg-cream text-ink">
        <a
          href="#inicio"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-grape focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>

        <Header />

        <main>
          <Hero />
          <DecisionHub />
          <ServiceExplorer />
          <ProcessTimeline />
          <TrustSection />
          <CounterSection />
          <CompaniesSection />
          <ProfessionalsSection />
          <ProfessionalsGrid />
          <OpportunitiesSection />
          <AboutSection />
          <EditorialSection />
          <FAQ />
          <FinalCTA />
        </main>

        <Footer />
        <FloatingWhatsApp />
        <ContactWizard />
      </div>
    </WizardProvider>
  )
}
