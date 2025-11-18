import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Brain, Trash2 } from "lucide-react";
import { API_BASE } from "@/config";

interface PassedCandidate {
  id: number;
  candidate_name: string;
  candidate_linkedin_url?: string;
  current_title?: string;
  current_company?: string;
  headline?: string;
  pass_reason?: string;
  title_complexity_score?: number;
  has_advisor_roles: boolean;
  has_mentor_roles: boolean;
  has_multiple_roles: boolean;
  has_awards_in_title: boolean;
  created_at?: string;
}

interface FilteredCandidate {
  id: number;
  name: string;
  linkedin_url?: string;
  current_title?: string;
  current_company?: string;
  headline?: string;
  filter_reason: string;
  filtered_at?: string;
}

export default function Memory() {
  const [passes, setPasses] = useState<PassedCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/outreach/pass-history?limit=50`);
      const data = await response.json();
      setPasses(data.passes || []);
    } catch (err) {
      console.error("error fetching memory data:", err);
    } finally {
      setLoading(false);
    }
  };

  const deletePass = async (passId: number, name: string) => {
    if (!confirm(`Remove ${name} from memory? They will be unblacklisted and can appear in searches again.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/outreach/pass/${passId}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (data.success) {
        // refresh passes
        await fetchData();
      }
    } catch (err) {
      console.error("error deleting pass:", err);
      alert("error deleting pass");
    }
  };

  return (
    <div className="space-y-4">
      {/* content */}
      <div className="bg-card border border-border rounded-lg">
        <div className="divide-y divide-border max-h-[calc(100vh-350px)] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              loading memory...
            </div>
          ) : (
            passes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Brain className="mx-auto mb-4 text-muted-foreground/50" size={48} />
                <p className="font-medium mb-2">no learning data yet</p>
                <p className="text-sm">when you pass on candidates, they're stored here to train the system</p>
              </div>
            ) : (
              passes.map((pass) => (
                <div key={pass.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base">{pass.candidate_name}</h3>
                        {pass.candidate_linkedin_url && (
                          <a
                            href={pass.candidate_linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>

                      {pass.headline && (
                        <div className="text-sm mb-2 font-mono text-muted-foreground">
                          {pass.headline}
                        </div>
                      )}

                      {pass.current_title && (
                        <div className="text-sm text-muted-foreground mb-3">
                          {pass.current_title} {pass.current_company && `@ ${pass.current_company}`}
                        </div>
                      )}

                      {/* AI-generated red flags */}
                      {pass.pass_reason && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-md border border-border">
                          <div className="text-xs font-semibold text-muted-foreground mb-1">RED FLAGS</div>
                          <div className="text-sm">{pass.pass_reason}</div>
                        </div>
                      )}

                      {pass.created_at && (
                        <div className="text-xs text-muted-foreground mt-3">
                          stored {new Date(pass.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deletePass(pass.id, pass.candidate_name)}
                      className="p-2 hover:bg-red-500/10 rounded-md transition-colors text-muted-foreground hover:text-red-600"
                      title="Remove from memory"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
