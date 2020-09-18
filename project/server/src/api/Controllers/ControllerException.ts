import ApiException from "../ApiException";

export default class ControllerException extends ApiException {
  detail?: string;
  error?: any;

  constructor(status?: number, message?: string, detail?: string, error?: any) {
    super(status, message);
    if (detail)
      this.detail = detail;
    if (error)
      this.error = error;
  }
}