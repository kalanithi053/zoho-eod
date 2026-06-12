import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const body = exception.getResponse() as any;

    this.logger.error(
      `[${request.method}] ${request.url} - ${status} | ${body?.message || "An error occurred"} ${JSON.stringify(body?.errors)}`,
      exception.stack,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message: body?.message || "An error occurred",
      errors: body?.errors || [],
    });
  }
}
