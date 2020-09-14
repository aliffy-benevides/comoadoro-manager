import ControllerException from "../ControllerException";
import ApiException from "../../ApiException";

export function ParseId(paramId: string, errorMessage: string): number {
  const id = parseInt(paramId);
  if (isNaN(id))
    throw new ControllerException(404, errorMessage);

  return id;
}

export function ParseError(error: any, defaultMessage: string): ApiException {
  if (error instanceof ApiException)
    return error;

  return new ApiException(500, defaultMessage, error);
}