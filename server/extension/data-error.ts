export class DataError extends Error {
  constructor(public code?: number, message?: string) {
    super(message);
  }
}
