type CustomErrorProps = {
  message: string;
  statusCode: number;
};

export default class CustomError extends Error {
  public readonly statusCode: number;

  constructor({ message, statusCode }: CustomErrorProps) {
    super(message);
    this.name = "CustomError";
    this.statusCode = statusCode;
  }
}
