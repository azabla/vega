import { Copy, Download, FileText, Loader2, Lock, Plus, Star, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { TemplatePicker, TemplateThumb } from "@/dashboard/components/cv/Pickers";
import { EmptyState, ListSkeleton, LoadError, PageHeader } from "@/dashboard/components/Page";
import { downloadCv, toastError } from "@/dashboard/lib/cvActions";
import { useResource } from "@/dashboard/lib/useResource";
import { toast } from "@/hooks/use-toast";
import { templateOf } from "@/lib/cv";
import { professionOf } from "@/lib/professions";
import { resolveSettings } from "@/lib/settings";

const updated = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

// ---------------------------------------------------------------- list

const NewCvModal = ({ open, onClose, onCreated, count, profession }) => {
  const [name, setName] = useState("");
  const [picked, setTemplate] = useState(null);
  // until the owner picks one, start from the template that suits their profession
  const suggested = professionOf(profession).cvTemplate;
  const template = picked ?? suggested;
  const [saving, setSaving] = useState(false);
  const id = useId();

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/me/cvs/", { name: name.trim() || (count ? `CV ${count + 1}` : "General"), template });
      onCreated(data);
    } catch (error) {
      toastError("Couldn't create the CV", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New CV"
      description={
        profession && profession !== "general"
          ? `Pick a starting template (suggested for ${professionOf(profession).name}: ${templateOf(suggested).name}). You can change the template, colours and content at any time.`
          : "Pick a starting template. You can change the template, colours and content at any time."
      }
      className="sm:max-w-3xl"
      footer={
        <>
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={`${id}-form`} size="lg" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Create
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={create} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-name`}>Name</Label>
          <Input id={`${id}-name`} value={name} maxLength={120} placeholder="e.g. General, Backend roles, Scholarship" onChange={(e) => setName(e.target.value)} />
          <FieldHint>Only you see it. Make one version per kind of job you apply for.</FieldHint>
        </div>
        <TemplatePicker name={`${id}-template`} value={template} onChange={setTemplate} />
      </form>
    </Modal>
  );
};

export const CVListPage = () => {
  const { data, loading, error, reload, mutate } = useResource("/me/cvs/");
  const profile = useResource("/me/profile/");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const duplicate = async (cv) => {
    try {
      const { data: copy } = await api.post(`/me/cvs/${cv.id}/duplicate/`);
      mutate((list) => [...list, copy]);
      toast({ title: "CV duplicated", description: copy.name });
    } catch (err) {
      toastError("Couldn't duplicate", err);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/me/cvs/${deleting.id}/`);
      reload(); // another CV may have become the default
      setDeleting(null);
      toast({ title: "CV deleted" });
    } catch (err) {
      toastError("Couldn't delete", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="CV & résumé"
        description="Make a version for each kind of job. Every version is built from your profile, so it stays up to date; here you choose the design and what goes on it."
        action={
          <Button type="button" size="lg" className="self-start px-4" onClick={() => setCreating(true)}>
            <Plus /> New CV
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <LoadError onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No CV versions yet"
          action={
            <Button type="button" size="lg" onClick={() => setCreating(true)}>
              <Plus /> Create your first CV
            </Button>
          }
        >
          Your portfolio already offers a Classic PDF. Create a CV to pick a template, colours, photo and what it includes.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {data.map((cv) => (
            <li key={cv.id} className="surface flex flex-col overflow-hidden">
              <Link to={`/dashboard/cv/${cv.id}`} className="block border-b bg-muted/40 px-8 pt-6" tabIndex={-1} aria-hidden>
                <TemplateThumb template={cv.template} className="h-44 rounded-b-none border-b-0 shadow-sm" />
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">
                    <Link to={`/dashboard/cv/${cv.id}`} className="hover:underline">
                      {cv.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {templateOf(cv.template).name} · updated {updated.format(new Date(cv.updated_at))}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {cv.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                        <Star className="size-3" /> On your portfolio
                      </span>
                    )}
                    {!cv.is_public && (
                      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-muted-foreground">
                        <Lock className="size-3" /> Private
                      </span>
                    )}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1.5">
                  <Button href={`/dashboard/cv/${cv.id}`} size="sm">
                    Edit
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => downloadCv(cv)}>
                    <Download /> PDF
                  </Button>
                  <span className="ml-auto flex">
                    <Button type="button" variant="ghost" size="icon-lg" aria-label={`Duplicate ${cv.name}`} title="Duplicate" onClick={() => duplicate(cv)}>
                      <Copy />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-lg" aria-label={`Delete ${cv.name}`} title="Delete" onClick={() => setDeleting(cv)}>
                      <Trash2 />
                    </Button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewCvModal
        open={creating}
        profession={profile.data ? resolveSettings(profile.data.settings).profession : undefined}
        count={data?.length ?? 0}
        onClose={() => setCreating(false)}
        onCreated={(cv) => navigate(`/dashboard/cv/${cv.id}`)}
      />
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this CV?"
        description={deleting ? `“${deleting.name}” and its link stop working. Your profile isn't affected.` : ""}
        footer={
          <>
            <Button type="button" variant="outline" size="lg" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" size="lg" disabled={busy} onClick={remove}>
              {busy && <Loader2 className="animate-spin" />} Delete
            </Button>
          </>
        }
      />
    </>
  );
};
