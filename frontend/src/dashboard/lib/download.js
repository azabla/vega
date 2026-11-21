import api from "@/api/axios";

/** Download a file from an authenticated endpoint (a plain link can't send the token). */
export const downloadFile = async (url, filename) => {
    const { data } = await api.get(url, { responseType: "blob" });
    saveBlob(data, filename);
};

export const saveBlob = (blob, filename) => {
  const href = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), { href, download: filename });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
};
