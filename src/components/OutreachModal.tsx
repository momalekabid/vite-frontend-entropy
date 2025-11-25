import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/config";

interface Candidate {
  name: string;
  linkedin_url?: string;
  email?: string;
  current_title?: string;
  current_company?: string;
}

interface OutreachModalProps {
  candidate: Candidate;
  searchQuery?: string;
  searchId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type OutreachChannel = "linkedin_invitation" | "linkedin_dm" | "email";

export default function OutreachModal({ candidate, searchQuery, searchId, onClose, onSuccess }: OutreachModalProps) {
  const [channel, setChannel] = useState<OutreachChannel>("linkedin_invitation");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichedEmail, setEnrichedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkedinAccountId, setLinkedinAccountId] = useState("");
  const [emailAccountId, setEmailAccountId] = useState("");

  // fetch unipile account ids from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings`);
        const data = await response.json();

        if (data.success && data.settings) {
          setLinkedinAccountId(data.settings.unipile_linkedin_account_id || "");
          setEmailAccountId(data.settings.unipile_email_account_id || "");
        }
      } catch (err) {
        console.error("error fetching settings:", err);
      }
    };

    fetchSettings();
  }, []);

  // fetch last used message template when channel changes
  useEffect(() => {
    const fetchLastTemplate = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/outreach/last-message-template?channel=${channel}`);
        const data = await response.json();

        if (data.success && data.message_template) {
          // replace placeholder with candidate name
          let template = data.message_template;

          // simple name replacement - handles common patterns
          if (data.recipient_name && template.includes(data.recipient_name)) {
            template = template.replace(new RegExp(data.recipient_name, 'g'), candidate.name);
          }
          // also try to replace Hi {name} patterns
          template = template.replace(/\{name\}/gi, candidate.name);
          template = template.replace(/Hi [A-Za-z]+,/i, `Hi ${candidate.name},`);

          setMessage(template);

          if (data.subject) {
            setSubject(data.subject);
          }
        } else {
          // fallback to defaults if no template found
          setDefaultMessage();
        }
      } catch (err) {
        console.error("error fetching last template:", err);
        setDefaultMessage();
      }
    };

    const setDefaultMessage = () => {
      if (channel === "linkedin_invitation") {
        setMessage(
          `Hi ${candidate.name}, I'm impressed by your work at ${candidate.current_company}. We're an early-stage VC fund focused on deep-tech startups. Would love to connect!`
        );
        setSubject("");
      } else if (channel === "linkedin_dm") {
        setMessage(
          `Hi ${candidate.name},\n\nI came across your profile and was impressed by your work at ${candidate.current_company}. We're an early-stage VC fund focused on deep-tech startups, and I'd love to chat about what you're building.\n\nWould you be open to a quick call next week?\n\nBest,\n[Your Name]`
        );
        setSubject("");
      } else {
        setSubject(`Quick intro - interested in ${candidate.current_company}`);
        setMessage(
          `Hi ${candidate.name},\n\nI hope this email finds you well. I came across your profile and was impressed by your work as ${candidate.current_title} at ${candidate.current_company}.\n\nWe're an early-stage VC fund focused on deep-tech startups, and I'd love to learn more about what you're building. Would you be open to a brief call next week?\n\nLooking forward to connecting,\n[Your Name]`
        );
      }
    };

    fetchLastTemplate();
  }, [channel, candidate]);

  // enrich email if needed
  const handleEnrichEmail = async () => {
    if (!candidate.linkedin_url) {
      setError("no linkedin url available for enrichment");
      return;
    }

    setEnriching(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/outreach/enrich-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin_url: candidate.linkedin_url })
      });

      const data = await response.json();

      if (data.success && data.email) {
        setEnrichedEmail(data.email);
      } else {
        setError(data.error || "failed to enrich email");
      }
    } catch (err) {
      setError("error enriching email: " + err);
    } finally {
      setEnriching(false);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    setError(null);

    try {
      if (channel === "linkedin_invitation") {
        if (!linkedinAccountId) {
          setError("linkedin account not configured. please configure in settings > api keys");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/outreach/send-linkedin-invitation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unipile_account_id: linkedinAccountId,
            candidate_name: candidate.name,
            candidate_linkedin_url: candidate.linkedin_url,
            message: message.trim() || undefined,
            search_query: searchQuery,
            search_id: searchId
          })
        });

        const data = await response.json();

        if (data.success) {
          onSuccess();
          onClose();
        } else {
          setError(data.error || "failed to send linkedin invitation");
        }
      } else if (channel === "linkedin_dm") {
        if (!linkedinAccountId) {
          setError("linkedin account not configured. please configure in settings > api keys");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/outreach/send-linkedin-dm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unipile_account_id: linkedinAccountId,
            candidate_name: candidate.name,
            candidate_linkedin_url: candidate.linkedin_url,
            message,
            search_query: searchQuery,
            search_id: searchId
          })
        });

        const data = await response.json();

        if (data.success) {
          onSuccess();
          onClose();
        } else {
          setError(data.error || "failed to send linkedin dm");
        }
      } else {
        // email
        if (!emailAccountId) {
          setError("email account not configured. please configure in settings > api keys");
          setLoading(false);
          return;
        }

        const emailToUse = enrichedEmail || candidate.email;

        if (!emailToUse) {
          setError("no email available. try enriching first");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/outreach/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unipile_account_id: emailAccountId,
            candidate_name: candidate.name,
            candidate_email: emailToUse,
            candidate_linkedin_url: candidate.linkedin_url,
            subject,
            message,
            search_query: searchQuery,
            search_id: searchId
          })
        });

        const data = await response.json();

        if (data.success) {
          onSuccess();
          onClose();
        } else {
          setError(data.error || "failed to send email");
        }
      }
    } catch (err) {
      setError("error sending message: " + err);
    } finally {
      setLoading(false);
    }
  };

  const emailToDisplay = enrichedEmail || candidate.email;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">reach out to {candidate.name}</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          {/* channel selector */}
          <div className="flex gap-2">
            <Button
              variant={channel === "linkedin_invitation" ? "default" : "outline"}
              size="sm"
              onClick={() => setChannel("linkedin_invitation")}
            >
              linkedin invite
            </Button>
            <Button
              variant={channel === "linkedin_dm" ? "default" : "outline"}
              size="sm"
              onClick={() => setChannel("linkedin_dm")}
            >
              linkedin dm
            </Button>
            <Button
              variant={channel === "email" ? "default" : "outline"}
              size="sm"
              onClick={() => setChannel("email")}
            >
              email
            </Button>
          </div>

          {/* email enrichment for email channel */}
          {channel === "email" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  email: {emailToDisplay || "no email available"}
                </span>
                {!emailToDisplay && candidate.linkedin_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEnrichEmail}
                    disabled={enriching}
                  >
                    {enriching ? "enriching..." : "find email"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* subject for email */}
          {channel === "email" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                placeholder="email subject..."
              />
            </div>
          )}

          {/* message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm font-mono resize-none"
              placeholder="your message..."
            />
          </div>

          {/* error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading || (channel === "email" && !emailToDisplay)}
            >
              {loading ? "sending..." : `send ${channel === "linkedin_invitation" ? "invite" : channel === "linkedin_dm" ? "dm" : "email"}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
