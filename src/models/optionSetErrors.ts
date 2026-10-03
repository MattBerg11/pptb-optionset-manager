export class OptionSetError extends Error {
  public readonly code: string;

  public constructor(message: string, code: string) {
    super(message);
    this.name = "OptionSetError";
    this.code = code;
  }
}

export class OptionSetValidationError extends OptionSetError {
  public readonly issues: string[];

  public constructor(message: string, issues: string[]) {
    super(message, "VALIDATION_ERROR");
    this.name = "OptionSetValidationError";
    this.issues = issues;
  }
}

export class OptionSetOperationError extends OptionSetError {
  public readonly operationStep: string;
  public readonly details?: unknown;

  public constructor(
    message: string,
    operationStep: string,
    details?: unknown,
  ) {
    super(message, "OPERATION_ERROR");
    this.name = "OptionSetOperationError";
    this.operationStep = operationStep;
    this.details = details;
  }
}
