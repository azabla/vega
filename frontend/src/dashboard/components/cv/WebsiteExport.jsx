import { Download, Laptop, Loader2, Smartphone } from "lucide-react";
import { useEffect, useId, useState } from "react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/dashboard/components/Choices";
import { saveBlob } from "@/dashboard/lib/download";
import { resolveDesign } from "@/lib/cv";
import { cn } from "@/lib/utils";

export const WebsiteExport = ({ cv, onClose }) => {
  const id = useId();
  const [options, setOptions] = useState(() => ({
    layout: "editorial",
    mode: "light",
    accent: resolveDesign(cv.design).accent,
    include_contact: false,
  }));
  const [phone, setPhone] = useState(false);
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const fresh = result?.options === options && result.attempt === attempt;
  const html = fresh ? result.html : null;
  const update = (patch) => setOptions((previous) => ({ ...previous, ...patch }));

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data, headers } = await api.get(`/me/cvs/${cv.id}/website/`, {
          params: options,
          responseType: "text",
          signal: controller.signal,
        });
        const filename = /filename="([^"]+)"/.exec(headers["content-disposition"] ?? "")?.[1];
        if (!controller.signal.aborted) setResult({ options, attempt, html: data, filename });
      } catch {
        if (!controller.signal.aborted) setResult({ options, attempt, html: null });
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cv.id, options, attempt]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Generate website"
      description={`Preview a standalone website using the sections and wording saved in “${cv.name}”.`}
      className="sm:max-w-6xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button
            type="button"
            disabled={!html}
            onClick={() => saveBlob(new Blob([html], { type: "text/html;charset=utf-8" }), result.filename ?? `${cv.slug}-website.html`)}
          >
            <Download /> Download HTML
          </Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-layout`}>Layout</Label>
            <select id={`${id}-layout`} value={options.layout} onChange={(e) => update({ layout: e.target.value })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="editorial">Editorial</option>
              <option value="cards">Cards</option>
              <option value="compact">Compact</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-mode`}>Colour mode</Label>
            <select id={`${id}-mode`} value={options.mode} onChange={(e) => update({ mode: e.target.value })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`${id}-accent`}>Accent colour</Label>
            <input id={`${id}-accent`} type="color" value={options.accent} onChange={(e) => update({ accent: e.target.value })} className="h-9 w-12 cursor-pointer rounded-md border bg-background" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Contact details</span>
            <Switch checked={options.include_contact} onChange={(include_contact) => update({ include_contact })} label="Include the CV’s contact details" />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Review the preview before sharing. Contact details written inside CV sections will also appear in the file.</p>
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex justify-end gap-1" role="group" aria-label="Preview width">
            <Button type="button" size="sm" variant={phone ? "ghost" : "secondary"} aria-pressed={!phone} onClick={() => setPhone(false)}>
              <Laptop /> Wide
            </Button>
            <Button type="button" size="sm" variant={phone ? "secondary" : "ghost"} aria-pressed={phone} onClick={() => setPhone(true)}>
              <Smartphone /> Phone
            </Button>
          </div>
          <div className={cn("relative mx-auto h-[28rem] overflow-hidden rounded-xl border bg-muted/30", phone && "max-w-[390px]")}>
            {html ? (
              <iframe key={attempt} title="Generated website preview" srcDoc={html} sandbox="" className="block size-full border-0" />
            ) : (
              <div className="grid h-full place-content-center justify-items-center gap-3 px-4 text-center text-sm text-muted-foreground" role="status">
                {fresh ? (
                  <>
                    <p>Couldn't generate the website.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
                  </>
                ) : (
                  <><Loader2 className="size-5 animate-spin" /> Generating preview…</>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
