import api from "@/api/axios";

/** Download a file from an authenticated endpoint (a plain link can't send the token). */
export const downloadFile = async (url, filename) => {
    const { data } = await api.get(url, { responseType: "blob" });
    const href = URL.createObjectURL(data);
    const link = Object.assign(document.createElement("a"), { href, download: filename });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
};
