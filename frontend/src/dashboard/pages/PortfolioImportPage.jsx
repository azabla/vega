import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, FileUp, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "@/api/axios";
import { useAuth } from "@/auth/context";
import { Button } from "@/components/ui/button";
import { Checkbox, FormAlert } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { ListSkeleton, LoadError, Panel } from "@/dashboard/components/Page";
import { CompletionSuggestions, ReviewEditor, ReviewNavigator } from "@/dashboard/components/PortfolioImportReview";
import { IMPORT_API, IMPORT_GROUPS, MAX_CV_SIZE, entryErrors, groupSummary, importPayload, prepareImportReview, profileChanges } from "@/dashboard/lib/portfolioImport";
import { parseApiError } from "@/dashboard/lib/records";
import { useResource } from "@/dashboard/lib/useResource";
import { clearPortfolioCache } from "@/hooks/usePortfolioData";
import { cn } from "@/lib/utils";

const stages = ["Upload", "Review", "Apply"];

const Progress = ({ step }) => (
  <ol className="grid max-w-xl grid-cols-3 gap-2 sm:gap-3" aria-label="Import progress">
    {stages.map((label, index) => (
      <li key={label} aria-current={index === step ? "step" : undefined}
        className={cn("flex min-w-0 items-center gap-2 rounded-xl border bg-card px-2.5 py-2.5 text-sm text-muted-foreground sm:px-3.5", index === step && "border-primary/50 font-medium text-foreground")}
      >
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold", index <= step && "bg-primary text-primary-foreground")}>
          {index < step ? <Check className="size-3.5" aria-hidden /> : index + 1}
        </span>
        {label}
      </li>
    ))}
  </ol>
);

const UploadForm = ({ file, setFile, useAi, setUseAi, aiAvailable, busy, onImport, error, back }) => {
  const input = useRef(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
      <form className="min-w-0 rounded-3xl border bg-card p-4 sm:p-6 lg:p-8" onSubmit={onImport}>
        <h2 className="text-lg font-semibold sm:text-xl">Upload your CV</h2>
        <p className="mt-1 text-sm text-muted-foreground">PDF, DOC, or DOCX · up to 5 MB</p>
        <input
          ref={input} type="file" accept=".pdf,.doc,.docx" className="sr-only" tabIndex={-1} aria-label="CV file"
          onChange={(event) => { setFile(event.target.files[0]); event.target.value = ""; }} disabled={busy}
        />
        <div
          onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!busy) setFile(event.dataTransfer.files[0], event.dataTransfer.files.length);
          }}
          className={cn("mt-5 grid min-w-0 justify-items-center gap-3 rounded-2xl border border-dashed bg-muted/30 px-3 py-8 text-center transition-colors sm:px-6 sm:py-10", dragging && "border-primary-ink bg-accent")}
        >
          <div className="grid size-12 place-items-center rounded-2xl border bg-card text-primary-ink">
            {file ? <FileText aria-hidden /> : <FileUp aria-hidden />}
          </div>
          {file ? (
            <div className="min-w-0 max-w-full">
              <p className="break-all text-sm font-medium">{file.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{Math.max(1, Math.round(file.size / 1024))} KB</p>
            </div>
          ) : <p className="text-sm text-muted-foreground">Drop your file here</p>}
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>
            {file ? "Choose another file" : "Choose file"}
          </Button>
        </div>
        {aiAvailable && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border bg-background px-3.5 py-3">
            <Checkbox checked={useAi} onChange={(event) => setUseAi(event.target.checked)} disabled={busy} />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-medium"><Sparkles className="size-4 text-primary-ink" aria-hidden /> Use AI to organize my CV</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">Sends the extracted text to OpenAI with your consent.</span>
            </span>
          </label>
        )}
        <FormAlert className="mt-4">{error}</FormAlert>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          {back && <Button type="button" variant="ghost" onClick={back} disabled={busy}><ArrowLeft /> Back to review</Button>}
          <Button type="submit" size="lg" disabled={!file || busy} className="ml-auto">
            {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />} {busy ? "Reading CV…" : "Review extracted data"}
          </Button>
        </div>
        {busy && <p role="status" className="mt-3 text-sm text-muted-foreground">Extracting and organizing your CV.</p>}
      </form>

      <aside className="flex min-w-0 flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-[#294d44] bg-[#12362e] p-5 text-[#f0fbf4] sm:p-7">
        <div>
          <div className="grid size-11 place-items-center rounded-xl border border-white/20 bg-white/10"><ShieldCheck className="size-5" aria-hidden /></div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Review before publishing</h2>
          <p className="mt-2 text-sm leading-6 text-[#d0ebde]">Choose exactly which profile changes and entries to add. The uploaded document stays separate from your public portfolio.</p>
        </div>
        <p className="border-t border-white/20 pt-4 text-xs leading-5 text-[#d0ebde]">PDFs need selectable text and can have up to 20 pages. For scans, upload a Word copy or run text recognition first.</p>
      </aside>
    </div>
  );
};

const ApplySummary = ({ open, close, apply, busy, error, summaries, changes, review, skipped, needsDetails }) => (
  <Modal
    open={open} onClose={close} title="Apply selected changes?"
    description="These changes will be visible on your public portfolio. Matching entries are kept."
    footer={
      <div className="grid w-full gap-2 sm:flex sm:justify-end">
        <Button type="button" variant="outline" onClick={close} disabled={busy}>Keep reviewing</Button>
        <Button type="button" onClick={apply} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Apply to portfolio</Button>
      </div>
    }
  >
    <FormAlert className="mb-4">{error}</FormAlert>
    {changes.length > 0 && (
      <ul className="mb-4 divide-y rounded-xl border px-3">
        {changes.map(({ name, label }) => (
          <li key={name} className="grid gap-1 py-2.5 text-sm">
            <span className="font-medium">{label}</span>
            <span className="line-clamp-3 break-words text-muted-foreground">{review.profile[name].value}</span>
          </li>
        ))}
      </ul>
    )}
    <ul className="grid gap-2 text-sm">
      {IMPORT_GROUPS.filter(({ key }) => summaries[key].selected).map(({ key, label }) => (
        <li key={key} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
          <span>{label}</span><span className="font-medium tabular-nums">{summaries[key].selected}</span>
        </li>
      ))}
    </ul>
    {skipped > 0 && <p className="mt-4 text-sm text-muted-foreground">{skipped} {skipped === 1 ? "entry stays out" : "entries stay out"} of this update{needsDetails > 0 ? `, including ${needsDetails} with missing details` : ""}.</p>}
  </Modal>
);

function messageFor(error) {
  const response = error?.response;
  if (response?.status === 413) return "Choose a CV no larger than 5 MB.";
  return parseApiError(error).message || "The request couldn’t be completed.";
}

const PortfolioImport = ({ context }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [sourceName, setSourceName] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(context.ai_available);
  const [aiStatus, setAiStatus] = useState("");
  const [current, setCurrent] = useState(context.profile);
  const [existing, setExisting] = useState(context.existing);
  const [review, setReview] = useState(null);
  const [stage, setStage] = useState("upload");
  const [active, setActive] = useState("profile");
  const [confirming, setConfirming] = useState(false);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const editor = useRef(null);

  useEffect(() => {
    if (!review || report) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [review, report]);

  const selectFile = (picked, count = 1) => {
    if (!picked) return;
    if (count !== 1 || !/\.(pdf|docx?)$/i.test(picked.name) || picked.size > MAX_CV_SIZE || !picked.size) {
      setFile(null);
      setError(count !== 1 ? "Choose one CV at a time." : "Choose a nonempty PDF, DOC, or DOCX file up to 5 MB.");
      return;
    }
    setFile(picked);
    setError("");
  };

  const chooseSection = (key) => {
    setActive(key);
    requestAnimationFrame(() => {
      editor.current?.focus({ preventScroll: true });
      editor.current?.scrollIntoView({ block: "nearest" });
    });
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!file || busy) return;
    setBusy("upload");
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("use_ai", String(useAi && aiAvailable));
    try {
      const { data } = await api.post(IMPORT_API, form);
      setSourceName(file.name);
      setCurrent(data.profile);
      setExisting(data.existing);
      setAiAvailable(data.ai_available);
      setAiStatus(data.ai_status);
      setReview(prepareImportReview(data.proposal, data.profile, user.username));
      setActive("profile");
      setReport(null);
      setStage("review");
      window.scrollTo(0, 0);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy("");
    }
  };

  const changeProfile = (name, patch) => setReview((previous) => ({
    ...previous, profile: { ...previous.profile, [name]: { ...previous.profile[name], ...patch } },
  }));
  const changeRows = (key, entries) => setReview((previous) => ({
    ...previous, entries: { ...previous.entries, [key]: entries },
  }));

  const apply = async () => {
    if (busy) return;
    setBusy("apply");
    setError("");
    try {
      const { data } = await api.post(IMPORT_API + "apply/", importPayload(review, current));
      clearPortfolioCache();
      setReport(data);
      setCurrent(data.profile);
      setExisting((previous) => Object.fromEntries(IMPORT_GROUPS.map(({ key }) => [key, previous[key] + data.created[key]])));
      // Keep unfinished and skipped rows available for another review without a new upload.
      setReview((previous) => ({
        ...previous,
        entries: Object.fromEntries(IMPORT_GROUPS.map((group) => [
          group.key,
          previous.entries[group.key].filter((row) => !row.included || Object.keys(entryErrors(group, row.values)).length),
        ])),
      }));
      setConfirming(false);
      setStage("done");
      window.scrollTo(0, 0);
    } catch (err) {
      const changed = err.response?.data;
      if (err.response?.status === 409 && changed.profile && Array.isArray(changed.conflict_fields)) {
        setCurrent(changed.profile);
        for (const field of changed.conflict_fields) changeProfile(field, { included: false });
        setConfirming(false);
        chooseSection("profile");
      }
      setError(messageFor(err));
    } finally {
      setBusy("");
    }
  };

  const summaries = review ? Object.fromEntries(IMPORT_GROUPS.map((group) => [group.key, groupSummary(group, review.entries[group.key])])) : {};
  const changes = review ? profileChanges(review, current) : [];
  const selected = Object.values(summaries).reduce((total, group) => total + group.selected, 0);
  const needsDetails = Object.values(summaries).reduce((total, group) => total + group.total - group.ready, 0);
  const skipped = Object.values(summaries).reduce((total, group) => total + group.total - group.selected, 0);
  const changeTotal = selected + changes.length;
  const addedTotal = report && Object.values(report.created).reduce((a, b) => a + b, 0);
  const keptTotal = report && Object.values(report.kept).reduce((a, b) => a + b, 0);
  const stageIndex = stage === "upload" ? 0 : confirming || stage === "done" ? 2 : 1;
  const resumeReview = (key) => {
    setError("");
    setReport(null);
    setStage("review");
    chooseSection(key);
  };
  const options = { current, existing, summaries, proposedTitle: review?.profile.title.included && review.profile.title.value.trim(),
    proposedBio: review?.profile.bio.included && review.profile.bio.value.trim(), choose: chooseSection };

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">Import your CV</h1>
        <p className="mt-2 mb-5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Fill your existing portfolio with details from your CV.</p>
        <Progress step={stageIndex} />
      </header>

      {stage === "upload" ? (
        <UploadForm file={file} setFile={selectFile} useAi={useAi} setUseAi={setUseAi} aiAvailable={aiAvailable}
          busy={busy === "upload"} onImport={upload} error={error}
          back={review && !report ? () => { setError(""); setStage("review"); } : null}
        />
      ) : stage === "done" ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)]">
          <Panel className="rounded-3xl">
            <CheckCircle2 className="mb-3 size-9 text-primary-ink" aria-hidden />
            <h2 className="text-2xl font-semibold tracking-tight">Portfolio updated</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {addedTotal} new {addedTotal === 1 ? "entry" : "entries"}, {report.profile_fields.length} profile {report.profile_fields.length === 1 ? "field" : "fields"} updated.
              {keptTotal > 0 && ` ${keptTotal} matching ${keptTotal === 1 ? "entry kept" : "entries kept"}.`}
            </p>
            {addedTotal > 0 && (
              <dl className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {IMPORT_GROUPS.filter(({ key }) => report.created[key] > 0).map(({ key, label }) => (
                  <div key={key} className="rounded-xl border bg-muted/25 px-3 py-2.5">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-lg font-semibold tabular-nums">{report.created[key]}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button href={report.profile.public_url}>View portfolio <ArrowRight /></Button>
              <Button href="/dashboard/appearance" variant="outline">Edit appearance</Button>
              {skipped > 0 && (
                <Button type="button" variant="outline" onClick={() => resumeReview(
                  IMPORT_GROUPS.find(({ key }) => summaries[key].total).key,
                )}>Review remaining entries</Button>
              )}
              <Button type="button" variant="ghost" onClick={() => { setFile(null); setStage("upload"); }}>Import another CV</Button>
            </div>
          </Panel>
          <CompletionSuggestions {...options} choose={resumeReview} finished />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border bg-card px-4 py-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary-ink"><FileText className="size-5" aria-hidden /></div>
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-sm font-semibold">{sourceName}</h2>
              <p className="text-xs leading-5 text-muted-foreground">
                {aiStatus === "used" ? "AI-assisted extraction. Review the details before applying."
                  : aiStatus === "unavailable" ? "AI was unavailable. The draft uses local extraction."
                  : "Review the extracted details before applying."}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => { setError(""); setStage("upload"); }}>Replace CV</Button>
          </div>
          <FormAlert className="mb-4">{!confirming ? error : ""}</FormAlert>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(15rem,0.42fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-4 xl:sticky xl:top-4">
              <ReviewNavigator active={active} select={chooseSection} summaries={summaries} profileCount={changes.length} />
              <div className="hidden xl:block"><CompletionSuggestions {...options} /></div>
            </div>
            <div className="min-w-0">
              <div ref={editor} tabIndex={-1} className="min-w-0 outline-none" aria-label="Review editor">
                <ReviewEditor key={active} active={active} review={review} current={current}
                  changeProfile={changeProfile} changeRows={changeRows} locked={Boolean(busy)}
                />
              </div>
              <div className="mt-4 xl:hidden"><CompletionSuggestions {...options} /></div>
              <div className="sticky bottom-0 z-10 mt-4 grid items-center gap-2 rounded-t-2xl border bg-background/95 p-3 backdrop-blur-sm sm:flex sm:justify-between sm:gap-3 sm:px-4">
                <p className="text-xs leading-5 text-muted-foreground sm:text-sm" aria-live="polite">
                  <span className="font-medium text-foreground">{changeTotal} selected</span>
                  {needsDetails > 0 && ` · ${needsDetails} need details`}
                </p>
                <Button type="button" onClick={() => { setError(""); setConfirming(true); }} disabled={!changeTotal || Boolean(busy)}>
                  Review selected changes <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
          <ApplySummary open={confirming} close={() => { if (busy !== "apply") setConfirming(false); }}
            apply={apply} busy={busy === "apply"} error={error} summaries={summaries} changes={changes}
            review={review} skipped={skipped} needsDetails={needsDetails}
          />
        </>
      )}
    </>
  );
};

export const PortfolioImportPage = () => {
  const context = useResource(IMPORT_API);
  if (context.loading) return <ListSkeleton rows={4} />;
  if (context.error) return <LoadError onRetry={context.reload}>Couldn’t load the portfolio importer.</LoadError>;
  return <PortfolioImport context={context.data} />;
};
