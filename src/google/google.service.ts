import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google } from "googleapis";
import * as nodemailer from "nodemailer";
import { recipent } from "../common/recipent";

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMail(subject: string, html: string): Promise<void> {
    const clientId = this.configService.getOrThrow<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.configService.getOrThrow<string>(
      "GOOGLE_CLIENT_SECRET",
    );
    const refreshToken = this.configService.getOrThrow<string>(
      "GOOGLE_REFRESH_TOKEN",
    );
    const email = this.configService.getOrThrow<string>("GOOGLE_EMAIL");

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      this.configService.getOrThrow<string>("GOOGLE_OAUTH_API"),
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const accessTokenResult = await oauth2Client.getAccessToken();

    if (!accessTokenResult.token) {
      throw new Error("Unable to generate access token");
    }

    this.logger.debug(
      `Access token generated: ${accessTokenResult.token.substring(0, 20)}...`,
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: email,
        clientId,
        clientSecret,
        refreshToken,
        accessToken: accessTokenResult.token,
      },
      logger: true,
      debug: true,
    });

    await transporter.verify();

    this.logger.log("SMTP authentication successful");

    const result = await transporter.sendMail({
      from: email,
      sender: email,
      ...recipent,
      subject,
      html,
    });

    this.logger.log(`Email sent successfully. MessageId: ${result.messageId}`);
  }
}
