import ApiException from "../ApiException";

export default class ControllerException extends ApiException {
  detail?: string;

  constructor(status?: number, message?: string, detail?: string) {
    super(status, message);
    if (detail)
      this.detail = detail;
  }
}