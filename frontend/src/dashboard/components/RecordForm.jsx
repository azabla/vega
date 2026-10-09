import { useState } from "react";
import { FormAlert } from "@/components/ui/form";
import { FormFields } from "@/dashboard/components/FormFields";
import { SaveButton } from "@/dashboard/components/Page";
import { initialValues, parseApiError, saveRecord } from "@/dashboard/lib/records";

/**
 * Edit one record. `record` is null for a new one.
 * `footer(saveButton)` lets the caller place extra buttons next to Save.
 */
export const RecordForm = ({ endpoint, record, fields, extra, singleton, onSaved, footer, id }) => {
  const [values, setValues] = useState(() => initialValues(fields, record));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const onChange = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const saved = await saveRecord({ endpoint, record, fields, values, extra, singleton });
      setErrors({});
      setValues(initialValues(fields, saved));
      onSaved?.(saved);
    } catch (error) {
      const parsed = parseApiError(error, fields);
      setErrors(parsed.fieldErrors);
      setMessage(parsed.message || (Object.keys(parsed.fieldErrors).length ? "Please fix the highlighted fields." : ""));
    } finally {
      setSaving(false);
    }
  };

  const save = <SaveButton saving={saving} form={id} />;

  return (
    <form id={id} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert>{message}</FormAlert>
      <FormFields fields={fields} values={values} errors={errors} onChange={onChange} disabled={saving} />
      {footer ? footer(save) : <div className="flex justify-end">{save}</div>}
    </form>
  );
};
