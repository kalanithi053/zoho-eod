import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express"; // 👈 add this
import { GoogleService } from "../google/google.service";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly googleService: GoogleService) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const body = exception.getResponse() as any;
    const message = body?.message || "An error occurred";

    if (request?.url?.includes("sheet-to-report")) {
      const subject = `Zoho EOD APP [${status}] Error on ${request.method} ${request.url}`;

      const html = `
        <h2>Error Notification</h2>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Method:</strong> ${request.method}</p>
        <p><strong>URL:</strong> ${request.url}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Errors:</strong> ${JSON.stringify(body?.errors || [])}</p>
        <pre><strong>Stack:</strong> ${exception.stack}</pre>
      `;

      try {
        const transporter = await this.googleService.configTransporter();

        await transporter.verify();

        const result = await transporter.sendMail({
          from: process.env.GOOGLE_EMAIL ?? "",
          to: process.env.GOOGLE_EMAIL ?? "",
          subject,
          html,
        });

        this.logger.log(`Email sent. MessageId: ${result.messageId}`);
      } catch (mailError) {
        this.logger.error("Failed to send error notification email", mailError);
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} - ${status} | ${message} ${JSON.stringify(body?.errors)}`,
      exception.stack,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors: body?.errors || [],
    });
  }
}
