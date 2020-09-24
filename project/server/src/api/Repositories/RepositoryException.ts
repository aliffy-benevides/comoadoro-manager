import ApiException from "../ApiException";

export default class RepositoryException extends ApiException {
  constructor(status: number, message?: string, error?: any) {
    super(status, message || 'Unexpected error on repository', error);
  }
}