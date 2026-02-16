export interface ErrorResponseBody {
  code: string;
  message: string;
  details: unknown;
  request_id: string | null;
}

export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: unknown;

  constructor(status: number, code: string, message: string, details: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const buildErrorResponse = (
  code: string,
  message: string,
  details: unknown,
  requestId: string | null,
): ErrorResponseBody => ({
  code,
  message,
  details,
  request_id: requestId,
});
