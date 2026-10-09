import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ListSkeleton, LoadError } from "@/dashboard/components/Page";
import { RecordForm } from "@/dashboard/components/RecordForm";
import { parseApiError } from "@/dashboard/lib/records";
import { useResource } from "@/dashboard/lib/useResource";
import { toast } from "@/hooks/use-toast";

/**
 * List + add/edit/delete for one owner API collection.
 *
 * describe(item) -> { title, subtitle, meta, image, extra } for the list row.
 * params filter the list and are sent with every new record (e.g. { project: 3 }).
 * Pass `resource` to share an already-loaded list with the rest of the page.
 */
export const ResourceManager = ({
  endpoint,
  params,
  resource: shared,
  fields,
  describe,
  noun,
  emptyIcon,
  emptyText,
  max,
  sort,
  onChange,
  rowActions,
}) => {
  const own = useResource(shared ? null : endpoint, params);
  const { data, loading, error, reload, mutate } = shared ?? own;
  const [editing, setEditing] = useState(null); // null | "new" | record
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const items = data ? (sort ? [...data].sort(sort) : data) : [];
  const canAdd = !max || items.length < max;
  const label = noun.toLowerCase();

  const onSaved = (saved) => {
    const isNew = editing === "new";
    mutate((list) => (isNew ? [...(list ?? []), saved] : list.map((i) => (i.id === saved.id ? saved : i))));
    setEditing(null);
    toast({ title: isNew ? `${noun} added` : `${noun} saved` });
    onChange?.();
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`${endpoint}${deleting.id}/`);
      mutate((list) => list.filter((i) => i.id !== deleting.id));
      toast({ title: `${noun} deleted` });
      setDeleting(null);
      onChange?.();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't delete", description: parseApiError(err).message });
    } finally {
      setBusy(false);
    }
  };

  const addButton = canAdd && (
    <Button type="button" size="lg" className="px-3.5" onClick={() => setEditing("new")}>
      <Plus /> Add {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <LoadError onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={`No ${label}s yet`} action={addButton}>
          {emptyText}
        </EmptyState>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {items.map((item) => {
              const row = describe(item);
              return (
                <li key={item.id} className="surface flex items-center gap-3 p-3 sm:p-4">
                  {row.image !== undefined &&
                    (row.image ? (
                      <img src={row.image} alt="" className="size-12 shrink-0 rounded-lg border object-cover" />
                    ) : (
                      <span className="size-12 shrink-0 rounded-lg bg-muted" />
                    ))}
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate font-medium">{row.title}</p>
                    {row.subtitle && <p className="truncate text-sm text-muted-foreground">{row.subtitle}</p>}
                    {row.meta && <div className="mt-1.5 flex flex-wrap gap-1.5">{row.meta}</div>}
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    {rowActions?.(item)}
                    <Button type="button" variant="ghost" size="icon-lg" aria-label={`Edit ${row.title}`} onClick={() => setEditing(item)}>
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      aria-label={`Delete ${row.title}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          {addButton && <div className="flex justify-end">{addButton}</div>}
        </>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? `Add ${label}` : `Edit ${label}`}
      >
        {editing !== null && (
          <RecordForm
            key={editing === "new" ? "new" : editing.id}
            endpoint={endpoint}
            record={editing === "new" ? null : editing}
            fields={fields}
            extra={params}
            onSaved={onSaved}
            footer={(save) => (
              <div className="sticky -bottom-5 -mx-5 -mb-5 flex justify-end gap-2 border-t bg-card px-5 py-3.5">
                <Button type="button" variant="outline" size="lg" className="px-4" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                {save}
              </div>
            )}
          />
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => !busy && setDeleting(null)}
        title={`Delete this ${label}?`}
        className="m-auto h-auto max-w-[calc(100%-2rem)] rounded-2xl border sm:max-w-md"
        footer={
          <>
            <Button type="button" variant="outline" size="lg" className="px-4" disabled={busy} onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              className="bg-destructive px-4 text-white hover:bg-destructive/90"
              disabled={busy}
              onClick={onDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{deleting && describe(deleting).title}</span> will be removed
          from your portfolio. This can't be undone.
        </p>
      </Modal>
    </div>
  );
};
