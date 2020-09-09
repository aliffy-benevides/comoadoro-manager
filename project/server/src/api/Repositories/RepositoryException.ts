import ApiException from "../ApiException";

export default class RepositoryException extends ApiException {
  constructor(status: number, message?: string) {
    super(status, message || 'Unexpected error on repository');
  }
}