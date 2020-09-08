export default class ControllerError {
  status: number;
  message: string;
  detail?: string;

  constructor(status?: number, message?: string, detail?: string) {
    this.status = status || 500;
    this.message = message || 'Unexpected error';
    this.detail = detail;
  }
}