export default class RepositoryError {
  status: number;
  message: string;

  constructor(status: number, message?: string) {
    this.status = status;
    this.message = message || 'Unexpected error on repository';
  }
}