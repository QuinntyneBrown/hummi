import { FieldProblem } from '@hummi/api';
import { FormError } from '@hummi/components';

/** Client-side checks that mirror the server's rules word for word (L2-027 AC2, L2-029 AC2). */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/** Field errors keyed by the request body's field name, as both the client and a 422 report them. */
export type FieldErrors = Record<string, string>;

/** Merges a 422's field problems into the form's field errors. */
export function fromProblem(errors: Record<string, FieldProblem>): FieldErrors {
  return Object.fromEntries(Object.entries(errors).map(([field, problem]) => [field, problem.message]));
}

/** The error summary entries, in the form's field order, each linking to its input id. */
export function summaryOf(errors: FieldErrors, ids: Record<string, string>): FormError[] {
  return Object.keys(ids)
    .filter((field) => errors[field])
    .map((field) => ({ fieldId: ids[field], message: errors[field] }));
}

/** Only same-app paths are honoured as a return URL; anything else goes Home. */
export function safeReturnUrl(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}
