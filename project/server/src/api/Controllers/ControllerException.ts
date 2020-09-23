import ApiException from "../ApiException";

export default class ControllerException extends ApiException {
  detail?: string;

  constructor(status?: number, message?: string, detail?: string, error?: any) {
    super(status, message, error);
    if (detail)
      this.detail = detail;
  }
}