import api from "@/api/axios";

const FILE_TYPES = new Set(["image", "file"]);
export const isFileField = (field) => FILE_TYPES.has(field.type);

/** Form values for a record: API values, or each field's default for a new one. */
export const initialValues = (fields, record) =>
    Object.fromEntries(
        fields.map((f) => {
            const value = record?.[f.name];
            if (value !== undefined && value !== null) return [f.name, value];
            if (record && isFileField(f)) return [f.name, null];
            if (f.default !== undefined) return [f.name, f.default];
            if (f.type === "checkbox") return [f.name, false];
            if (f.type === "multiselect") return [f.name, []];
            return [f.name, ""];
        })
    );

// Blank optional inputs must be sent as null for dates, numbers and foreign keys
const toApiValue = (field, value) => {
    switch (field.type) {
        case "checkbox":
            return Boolean(value);
        case "number":
        case "date":
            return value === "" || value === null ? null : value;
        case "select":
            return value === "" ? (field.nullable ? null : "") : value;
        case "multiselect":
            return value ?? [];
        default:
            return value ?? "";
    }
};

const toFormData = (data) => {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) value.forEach((v) => form.append(key, v));
        else form.append(key, value);
    });
    return form;
};

/**
 * Create (POST) or update (PATCH) a record.
 *
 * Files can't travel in JSON, and empty lists or nulls can't travel in
 * multipart, so an update sends the data as JSON first and then any newly
 * picked files in a second, multipart PATCH. A create with files goes as one
 * multipart POST (some files are required, e.g. a gallery image).
 * `singleton` endpoints (/me/profile/, /me/about/) are updated in place.
 */
export const saveRecord = async ({ endpoint, record, fields, values, extra = {}, singleton = false }) => {
    const data = { ...extra };
    const files = {};
    fields.forEach((field) => {
        if (field.readOnly) return;
        const value = values[field.name];
        if (isFileField(field)) {
            if (value instanceof File) files[field.name] = value;
            else if (value === null && record?.[field.name]) data[field.name] = null; // removed
            return;
        }
        data[field.name] = toApiValue(field, value);
    });
    const hasFiles = Object.keys(files).length > 0;

    if (!record) {
        if (!hasFiles) return (await api.post(endpoint, data)).data;
        return (await api.post(endpoint, toFormData({ ...data, ...files }))).data;
    }

    const url = singleton ? endpoint : `${endpoint}${record.id}/`;
    let saved = (await api.patch(url, data)).data;
    if (hasFiles) saved = (await api.patch(url, toFormData(files))).data;
    return saved;
};

/** Split a DRF error response into per-field messages and one form-level message. */
export const parseApiError = (error, fields = []) => {
    const body = error?.response?.data;
    if (!error?.response) return { fieldErrors: {}, message: "Can't reach the server. Check your connection." };
    if (error.response.status >= 500) return { fieldErrors: {}, message: "Something went wrong on the server." };
    if (!body || typeof body !== "object") return { fieldErrors: {}, message: "Request failed." };

    const known = new Set(fields.map((f) => f.name));
    const fieldErrors = {};
    const other = [];
    Object.entries(body).forEach(([key, value]) => {
        const text = Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : JSON.stringify(value);
        if (known.has(key)) fieldErrors[key] = text;
        else if (key === "detail" || key === "non_field_errors") other.push(text);
        else other.push(`${key.replaceAll("_", " ")}: ${text}`);
    });
    return { fieldErrors, message: other.join(" ") };
};
