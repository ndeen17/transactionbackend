export class ApiError extends Error {
  statusCode: number;
  code?: string;
  errors?: unknown;

  constructor(statusCode: number, message: string, code?: string, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}
