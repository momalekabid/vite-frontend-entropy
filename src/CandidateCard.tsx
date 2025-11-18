import { Button } from "@/components/ui/button";
import StarRating from "./components/StarRating";
import { useState } from "react";
import OutreachModal from "./components/OutreachModal";

interface Candidate {
  id: number
  name: string
  headline?: string
  location?: string
  current_company?: string
  current_title?: string
  company_headcount?: string
  tenure_years?: number
  detected_industries: string[]
  linkedin_url?: string
  email?: string
  email_status?: string
  personal_email?: string
  phone?: string
  enrichment_status?: string
  ai_reasoning?: string
  ai_key_strengths: string[]
  ai_concerns: string[]
  ai_talking_points: string[]
  created_at?: string
  ai_fit_score?: number
}

interface CandidateCardProps {
  candidate: Candidate
  onPass?: () => void
  onAddToPipeline?: () => void
  onReachOut?: () => void
}

export default function CandidateCard({ candidate, onPass, onAddToPipeline, onReachOut }: CandidateCardProps) {
  // generate consistent random score based on candidate id (2.5-4.5 range)
  const score = candidate.ai_fit_score || (2.5 + (candidate.id % 20) / 10)
  const [copied, setCopied] = useState(false)
  const [showOutreachModal, setShowOutreachModal] = useState(false)

  const handleCopyEmail = () => {
    const email = candidate.email || candidate.personal_email
    if (email) {
      navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOutreachSuccess = () => {
    onReachOut?.()
  }

  return (
    <div className="border border-border rounded-lg p-6 space-y-4 bg-card">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-baseline gap-3 mb-1">
            <h3 className="text-lg font-medium">{candidate.name}</h3>
            <div className="flex items-center">
              <StarRating score={score} size="sm" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{candidate.current_title} @ {candidate.current_company}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          {candidate.current_company} • {candidate.location} • {candidate.tenure_years || 0} years
        </p>
        <p className="text-muted-foreground">
          industries: {candidate.detected_industries.join(", ")}
        </p>
        {candidate.headline && (
          <p className="text-sm">{candidate.headline}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPass}
          className="flex-1"
        >
          [pass]
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => candidate.linkedin_url && window.open(candidate.linkedin_url, '_blank')}
          className="flex-1"
        >
          [view linkedin]
        </Button>
        <Button
          size="sm"
          onClick={() => setShowOutreachModal(true)}
          className="flex-1 bg-green-600 text-white hover:bg-green-700"
        >
          [reach out]
        </Button>
      </div>

      {/* outreach modal */}
      {showOutreachModal && (
        <OutreachModal
          key={`outreach-${candidate.id}`}
          candidate={candidate}
          onClose={() => setShowOutreachModal(false)}
          onSuccess={handleOutreachSuccess}
        />
      )}
    </div>
  );
}
