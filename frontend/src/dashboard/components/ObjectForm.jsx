import { ListSkeleton, LoadError } from "@/dashboard/components/Page";
import { RecordForm } from "@/dashboard/components/RecordForm";
import { useResource } from "@/dashboard/lib/useResource";
import { toast } from "@/hooks/use-toast";

/** Edit a single object endpoint such as /me/profile/ or /me/about/. */
export const ObjectForm = ({ endpoint, fields, resource: shared, successTitle = "Saved" }) => {
  const own = useResource(shared ? null : endpoint);
  const { data, loading, error, reload, mutate } = shared ?? own;

  if (loading) return <ListSkeleton rows={4} />;
  if (error) return <LoadError onRetry={reload} />;

  return (
    <RecordForm
      key={data?.id}
      endpoint={endpoint}
      record={data}
      fields={fields}
      singleton
      onSaved={(saved) => {
        mutate(saved);
        toast({ title: successTitle });
      }}
      footer={(save) => (
        // Stays reachable at the bottom of the screen on long forms
        <div className="sticky bottom-0 -mx-4 -mb-4 flex justify-end border-t bg-card/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
          {save}
        </div>
      )}
    />
  );
};
