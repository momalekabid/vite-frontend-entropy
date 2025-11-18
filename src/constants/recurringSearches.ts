// pre-composed recurring searches for continuous monitoring

export interface RecurringSearch {
  id: string
  name: string
  description: string
  query: string
  location?: string
  industry?: string
  isMonitoring: boolean
}

export const RECURRING_SEARCHES: RecurringSearch[] = [
  {
    id: "deeptech-founders-sf",
    name: "Deeptech Founders - SF Bay",
    description: "Founded companies in deeptech, hardware, or AI in San Francisco Bay Area",
    query: "founders who started companies in deeptech, robotics, or ai in san francisco bay area",
    location: "San Francisco Bay Area",
    industry: "Deeptech",
    isMonitoring: true,
  },
  {
    id: "climate-tech-leaders",
    name: "Climate Tech Leaders",
    description: "Senior engineers and founders focused on climate/clean energy",
    query: "climate tech founders and senior engineers focused on renewable energy or carbon reduction",
    location: "San Francisco Bay Area",
    industry: "Clean Energy",
    isMonitoring: true,
  },
  {
    id: "ai-safety-researchers",
    name: "AI Safety Researchers",
    description: "Researchers and engineers working on AI safety and alignment",
    query: "ai safety researchers and engineers with machine learning and ai alignment background",
    location: "United States",
    industry: "Artificial Intelligence",
    isMonitoring: true,
  },
  {
    id: "robotics-engineers",
    name: "Robotics Engineers",
    description: "Senior roboticists with startup or research experience",
    query: "senior robotics engineers and founders with experience in autonomous systems or industrial robotics",
    location: "San Francisco Bay Area",
    industry: "Robotics",
    isMonitoring: true,
  },
  {
    id: "biotech-founders-ny",
    name: "Biotech Founders - NYC",
    description: "Biotechnology founders and senior researchers",
    query: "biotech founders and researchers with synthetic biology or pharmaceutical background in new york",
    location: "New York, NY",
    industry: "Biotechnology",
    isMonitoring: true,
  },
  {
    id: "quantum-computing-experts",
    name: "Quantum Computing Experts",
    description: "Quantum engineers and researchers from major labs",
    query: "quantum computing engineers and physicists with experience at google, ibm, or academic labs",
    location: "United States",
    industry: "Quantum Computing",
    isMonitoring: true,
  },
  {
    id: "enterprise-software-founders",
    name: "Enterprise Software Founders",
    description: "SaaS founders with b2b software experience",
    query: "saas founders and entrepreneurs who built enterprise software companies",
    location: "United States",
    industry: "Enterprise Software",
    isMonitoring: true,
  },
  {
    id: "aerospace-engineers",
    name: "Aerospace Engineers",
    description: "Engineers from aerospace and defense companies",
    query: "aerospace engineers from spacex, blue origin, or defense contractors",
    location: "United States",
    industry: "Aerospace & Defense",
    isMonitoring: true,
  },
  {
    id: "fintech-builders",
    name: "Fintech Builders",
    description: "Founders and engineers in financial technology",
    query: "fintech founders and engineers who built payment, lending, or trading platforms",
    location: "San Francisco Bay Area",
    industry: "Fintech",
    isMonitoring: true,
  },
  {
    id: "cyber-security-leaders",
    name: "Cybersecurity Leaders",
    description: "Security researchers and enterprise security founders",
    query: "cybersecurity founders and senior engineers with enterprise security or incident response background",
    location: "United States",
    industry: "Cybersecurity",
    isMonitoring: true,
  },
  {
    id: "hardware-manufacturing",
    name: "Hardware Manufacturing",
    description: "Hardware founders with manufacturing expertise",
    query: "hardware founders with manufacturing and supply chain experience",
    location: "San Francisco Bay Area",
    industry: "Hardware Manufacturing",
    isMonitoring: true,
  },
  {
    id: "data-ai-engineers-london",
    name: "Data & AI Engineers - London",
    description: "Data scientists and ML engineers in UK",
    query: "machine learning and data engineers working on ai applications in london",
    location: "London, United Kingdom",
    industry: "Machine Learning",
    isMonitoring: true,
  },
]
