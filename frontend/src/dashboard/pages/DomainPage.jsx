import { BadgeCheck, CircleAlert, ExternalLink, Globe, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/CopyButton";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/form";
import { ListSkeleton, LoadError, PageHeader, Panel } from "@/dashboard/components/Page";
import { toastError } from "@/dashboard/lib/cvActions";
import { parseApiError } from "@/dashboard/lib/records";
import { useResource } from "@/dashboard/lib/useResource";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const bare = (url) => url.replace(/^https?:\/\//, "");

const Address = ({ label, url, main, note }) => (
  <li className="flex flex-col gap-2 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm font-medium">
        {label}
        {main && <span className="rounded-full bg-accent px-2 py-0.5 text-[0.7rem] text-accent-foreground">Main address</span>}
      </p>
      <p className="truncate font-mono text-xs text-muted-foreground">{bare(url)}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
    <div className="flex shrink-0 gap-2">
      <CopyButton value={url} className="px-3 py-1.5 text-xs">
        Copy
      </CopyButton>
      <Button href={url} variant="outline" size="sm">
        <ExternalLink /> Open
      </Button>
    </div>
  </li>
);

const Check = ({ ok, yes, no }) => (
  <p className={cn("flex items-start gap-2 text-sm", ok ? "text-success" : "text-muted-foreground")}>
    {ok ? <BadgeCheck className="mt-0.5 size-4 shrink-0" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />}
    {ok ? yes : no}
  </p>
);

/** /dashboard/domain: where the portfolio lives, and connecting the owner's own domain. */
export const DomainPage = () => {
  const state = useResource("/me/domain/");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null); // "connect" | "verify" | "remove"
  const [check, setCheck] = useState(null);
  const id = useId();

  if (state.loading) return <ListSkeleton rows={3} />;
  if (state.error) return <LoadError onRetry={state.reload} />;
  const d = state.data;

  const run = async (kind, request) => {
    setBusy(kind);
    setError("");
    try {
      const { data } = await request();
      state.mutate(data);
      return data;
    } catch (err) {
      const parsed = parseApiError(err, [{ name: "domain" }]);
      if (parsed.fieldErrors.domain) setError(parsed.fieldErrors.domain);
      else toastError("Couldn't update the domain", err);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const connect = async (e) => {
    e.preventDefault();
    const data = await run("connect", () => api.put("/me/domain/", { domain: value }));
    if (data) {
      setValue("");
      setCheck(null);
    }
  };
  const verify = async () => {
    const data = await run("verify", () => api.post("/me/domain/verify/"));
    if (!data) return;
    setCheck(data.check);
    if (data.verified) toast({ title: "Domain verified", description: `${data.domain} now shows your portfolio once it points here.` });
  };
  const remove = async () => {
    const data = await run("remove", () => api.delete("/me/domain/"));
    if (data) setCheck(null);
  };

  return (
    <>
      <PageHeader title="Domain" description="Where your portfolio lives on the web, and how to use a domain you own." />
      <div className="flex flex-col gap-6">
        <Panel title="Your addresses" description="All of them show the same portfolio. The main address goes on your QR code and CV.">
          <ul className="divide-y overflow-hidden rounded-xl border">
            {d.addresses.custom && <Address label="Your domain" url={d.addresses.custom} main={d.public_url === d.addresses.custom} />}
            {d.addresses.subdomain && <Address label="Your Vega address" url={d.addresses.subdomain} main={d.public_url === d.addresses.subdomain} />}
            <Address label="Portfolio link" url={d.addresses.path} main={d.public_url === d.addresses.path} />
          </ul>
        </Panel>

        <Panel title="Use your own domain" description="For example hana.com, or cv.hana.com if the main domain is used for something else.">
          {!d.custom_domains_enabled ? (
            <p className="text-sm text-muted-foreground">Custom domains aren't available on this site yet.</p>
          ) : !d.domain ? (
            <form onSubmit={connect} className="flex flex-col gap-2">
              <Label htmlFor={id}>Domain</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={id}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="hana.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-invalid={error ? true : undefined}
                  required
                />
                <Button type="submit" size="lg" className="h-11 shrink-0" disabled={busy === "connect"}>
                  {busy === "connect" ? <Loader2 className="animate-spin" /> : <Globe />} Connect
                </Button>
              </div>
              <FieldError>{error}</FieldError>
              <FieldHint>You'll get two DNS records to add where you bought the domain. Nothing changes until they're in place.</FieldHint>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 truncate font-mono text-sm">{d.domain}</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    d.verified ? "text-success" : "text-warning"
                  )}
                >
                  {d.verified ? <BadgeCheck className="size-3.5" /> : <CircleAlert className="size-3.5" />}
                  {d.verified ? "Verified" : "Waiting for DNS"}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium">{d.verified ? "DNS records" : "Add these records at your domain provider"}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The TXT record proves the domain is yours. Then point it here: use the CNAME for a subdomain like cv.hana.com or www.hana.com,
                  or the A record for a root domain like hana.com (most providers don't allow a CNAME there).
                </p>
                <div className="mt-3 overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">Type</th>
                        <th scope="col" className="px-3 py-2 font-medium">Name</th>
                        <th scope="col" className="px-3 py-2 font-medium">Value</th>
                        <th scope="col" className="px-3 py-2 font-medium"><span className="sr-only">Copy</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {d.records.map((r) => (
                        <tr key={`${r.type}-${r.name}`}>
                          <td className="px-3 py-2 font-mono text-xs">{r.type}</td>
                          <td className="max-w-48 px-3 py-2 font-mono text-xs break-all">{r.name}</td>
                          <td className="max-w-64 px-3 py-2 font-mono text-xs break-all">{r.value}</td>
                          <td className="px-3 py-2 text-right">
                            <CopyButton value={r.value} className="px-2.5 py-1 text-xs">
                              Copy
                            </CopyButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {check && (
                <div className="flex flex-col gap-1.5 rounded-xl border p-3" aria-live="polite">
                  <Check ok={check.owned} yes="Ownership record found." no="Ownership (TXT) record not found yet. DNS changes can take up to an hour to show." />
                  <Check ok={check.points_here} yes="The domain points here." no="The domain doesn't point here yet: add the CNAME or A record." />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={verify} disabled={busy === "verify"}>
                  {busy === "verify" ? <Loader2 className="animate-spin" /> : <RefreshCw />} {d.verified ? "Check again" : "Verify"}
                </Button>
                <Button type="button" variant="ghost" className="text-destructive" onClick={remove} disabled={busy === "remove"}>
                  <Trash2 /> Remove domain
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
};
