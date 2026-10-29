import { downloadFile } from "@/dashboard/lib/download";
import { parseApiError } from "@/dashboard/lib/records";
import { toast } from "@/hooks/use-toast";

export const toastError = (title, error) =>
  toast({ variant: "destructive", title, description: parseApiError(error).message || "Please try again." });

export const downloadCv = (cv) =>
  downloadFile(`/me/cvs/${cv.id}/pdf/`, `${cv.slug}.pdf`).catch((error) => toastError("Couldn't download", error));
