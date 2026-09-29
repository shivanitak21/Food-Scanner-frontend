export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;
  readonly isNetwork: boolean;

  constructor(
    message: string,
    options?: { status?: number; code?: string; fieldErrors?: Record<string, string>; isNetwork?: boolean },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.code = options?.code;
    this.fieldErrors = options?.fieldErrors;
    this.isNetwork = options?.isNetwork ?? false;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function stringFrom(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function collectFieldErrors(body: Record<string, unknown>): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  const errors = asRecord(body.errors) ?? asRecord(body.fieldErrors) ?? asRecord(body.field_errors);
  if (errors) {
    for (const [key, value] of Object.entries(errors)) {
      if (typeof value === 'string' && value.trim()) {
        fieldErrors[key] = value.trim();
      } else if (Array.isArray(value)) {
        const first = value.find((item) => typeof item === 'string' && item.trim());
        if (typeof first === 'string') fieldErrors[key] = first.trim();
      }
    }
  }

  if (Array.isArray(body.detail)) {
    for (const item of body.detail) {
      const record = asRecord(item);
      if (!record) continue;
      const message = stringFrom(record.msg) ?? stringFrom(record.message);
      if (!message) continue;
      const loc = Array.isArray(record.loc) ? record.loc.map(String) : [];
      const field = [...loc].reverse().find((part) => part !== 'body' && part !== 'query' && part !== 'path');
      if (field) fieldErrors[field] = message;
    }
  }

  return fieldErrors;
}

export function parseErrorBody(
  data: unknown,
  status?: number,
): { message: string; code?: string; fieldErrors?: Record<string, string> } {
  const fallback =
    status === 401
      ? 'Email or password is incorrect, or your session has ended.'
      : status === 422 || status === 400
        ? 'Check the highlighted fields and try again.'
        : status !== undefined && status >= 500
          ? 'FoodLens had trouble completing that request. Please try again.'
          : 'Something went wrong. Please try again.';

  if (typeof data === 'string' && data.trim()) {
    return { message: data.trim() };
  }

  const body = asRecord(data);
  if (!body) return { message: fallback };
  const code = stringFrom(body.code);

  const fieldErrors = collectFieldErrors(body);
  const hasFields = Object.keys(fieldErrors).length > 0;
  const message =
    stringFrom(body.message) ??
    stringFrom(body.error) ??
    stringFrom(body.detail) ??
    (hasFields ? Object.values(fieldErrors)[0] : undefined) ??
    fallback;

  return { message, code, fieldErrors: hasFields ? fieldErrors : undefined };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
