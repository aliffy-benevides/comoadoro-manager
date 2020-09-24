import RepositoryException from "../RepositoryException";

export function ParseError(error: any, defaultMessage?: string): RepositoryException {
  if (error instanceof RepositoryException)
    return error;

  return new RepositoryException(500, defaultMessage, error);
}