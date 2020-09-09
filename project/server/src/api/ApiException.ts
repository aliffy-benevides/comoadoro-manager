export default class ApiException {
  status: number;
  message: string;
  error?: any;

  constructor(status?: number, message?: string, error?: any) {
    this.status = status || 500;
    this.message = message || 'Unexpected error';
    if (error)
      this.error = error;
  }
}