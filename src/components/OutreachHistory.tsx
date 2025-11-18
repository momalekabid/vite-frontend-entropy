import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/config";

interface OutreachItem {
  id: number;
  candidate_name: string;
  candidate_linkedin_url?: string;
  candidate_email?: string;
  channel: string;
  status: string;
  message_sent?: string;
  subject?: string;
  sent_at?: string;
  search_query?: string;
  error_message?: string;
}

export default function OutreachHistory() {
  const [history, setHistory] = useState<OutreachItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "linkedin_invitation" | "linkedin_dm" | "email">("all");
  const [exporting, setExporting] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/outreach/history?limit=100`;

      if (filter !== "all") {
        url += `&channel=${filter}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("error fetching outreach history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${API_BASE}/api/outreach/export-emails`);
      const data = await response.json();

      // create csv
      const csv = [
        "name,email,linkedin_url,channel,sent_at,search_query",
        ...data.contacts.map((c: any) =>
          `"${c.name}","${c.email}","${c.linkedin_url || ""}","${c.channel}","${c.sent_at || ""}","${c.search_query || ""}"`
        )
      ].join("\n");

      // download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `outreach-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch (err) {
      console.error("error exporting:", err);
    } finally {
      setExporting(false);
    }
  };

  const sendEmailList = async () => {
    // you can implement this to email yourself the list
    alert("feature coming soon - will email you the list");
  };

  // calculate analytics
  const analytics = {
    total: history.length,
    sent: history.filter(h => h.status === "sent").length,
    replied: history.filter(h => h.status === "replied").length,
    failed: history.filter(h => h.status === "failed").length,
    byChannel: {
      linkedin_invitation: history.filter(h => h.channel === "linkedin_invitation").length,
      linkedin_dm: history.filter(h => h.channel === "linkedin_dm").length,
      email: history.filter(h => h.channel === "email").length,
    },
    replyRate: history.length > 0 ? Math.round((history.filter(h => h.status === "replied").length / history.filter(h => h.status === "sent").length) * 100) : 0
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">outreach history</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? "hide stats" : "show stats"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={sendEmailList}
            >
              email me list
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "exporting..." : "export csv"}
            </Button>
          </div>
        </div>

        {/* analytics */}
        {showAnalytics && (
          <div className="mb-4 p-3 bg-muted rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">total sent</div>
              <div className="text-lg font-semibold">{analytics.sent}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">replied</div>
              <div className="text-lg font-semibold">{analytics.replied}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">reply rate</div>
              <div className="text-lg font-semibold">{analytics.replyRate}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">failed</div>
              <div className="text-lg font-semibold">{analytics.failed}</div>
            </div>
          </div>
        )}

        {/* filters */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            all ({analytics.total})
          </Button>
          <Button
            size="sm"
            variant={filter === "linkedin_invitation" ? "default" : "outline"}
            onClick={() => setFilter("linkedin_invitation")}
          >
            invites ({analytics.byChannel.linkedin_invitation})
          </Button>
          <Button
            size="sm"
            variant={filter === "linkedin_dm" ? "default" : "outline"}
            onClick={() => setFilter("linkedin_dm")}
          >
            dms ({analytics.byChannel.linkedin_dm})
          </Button>
          <Button
            size="sm"
            variant={filter === "email" ? "default" : "outline"}
            onClick={() => setFilter("email")}
          >
            emails ({analytics.byChannel.email})
          </Button>
        </div>
      </div>

      {/* history list */}
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            loading...
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            no outreach history yet
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{item.candidate_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.channel === "linkedin_invitation"
                        ? "bg-cyan-500/10 text-cyan-500"
                        : item.channel === "linkedin_dm"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-purple-500/10 text-purple-500"
                    }`}>
                      {item.channel.replace("_", " ")}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.status === "sent"
                        ? "bg-green-500/10 text-green-500"
                        : item.status === "replied"
                        ? "bg-blue-500/10 text-blue-500"
                        : item.status === "failed"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {item.candidate_email && (
                      <div>email: {item.candidate_email}</div>
                    )}
                    {item.subject && (
                      <div>subject: {item.subject}</div>
                    )}
                    {item.sent_at && (
                      <div>sent: {new Date(item.sent_at).toLocaleString()}</div>
                    )}
                    {item.search_query && (
                      <div className="text-xs italic">query: {item.search_query}</div>
                    )}
                    {item.error_message && (
                      <div className="text-red-500 text-xs">error: {item.error_message}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.candidate_linkedin_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(item.candidate_linkedin_url, "_blank")}
                    >
                      linkedin
                    </Button>
                  )}
                </div>
              </div>
              {item.message_sent && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    view message
                  </summary>
                  <div className="mt-2 p-2 bg-muted rounded text-xs whitespace-pre-wrap font-mono">
                    {item.message_sent}
                  </div>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
