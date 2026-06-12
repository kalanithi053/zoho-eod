import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google, sheets_v4 } from "googleapis";
import { recipent } from "../common/recipent";
import * as nodemailer from "nodemailer";
@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  constructor(private readonly configService: ConfigService) {}

  private getConfig(key: string): string {
    return this.configService.getOrThrow<string>(key);
  }

  private getOAuth2Client() {
    const oauth2Client = new google.auth.OAuth2(
      this.getConfig("GOOGLE_CLIENT_ID"),
      this.getConfig("GOOGLE_CLIENT_SECRET"),
      this.getConfig("GOOGLE_OAUTH_API"),
    );
    oauth2Client.setCredentials({
      refresh_token: this.getConfig("GOOGLE_REFRESH_TOKEN"),
    });
    return oauth2Client;
  }

  private getSheetsClient(): sheets_v4.Sheets {
    const auth = this.getOAuth2Client();
    return google.sheets({ version: "v4", auth });
  }

  async sendMail(subject: string, html: string): Promise<void> {
    const oauth2Client = this.getOAuth2Client();
    const accessTokenResult = await oauth2Client.getAccessToken();

    if (!accessTokenResult.token) {
      throw new Error("Unable to generate access token");
    }

    const clientId = this.getConfig("GOOGLE_CLIENT_ID");
    const clientSecret = this.getConfig("GOOGLE_CLIENT_SECRET");
    const refreshToken = this.getConfig("GOOGLE_REFRESH_TOKEN");
    const email = this.getConfig("GOOGLE_EMAIL");
    const nodeEnv = this.getConfig("NODE_ENV");

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
    });

    await transporter.verify();

    const emails = recipent[nodeEnv as keyof typeof recipent] ?? recipent.DEV;
    const result = await transporter.sendMail({
      ...emails,
      from: emails.sender,
      subject,
      html,
    });

    this.logger.log(`Email sent. MessageId: ${result.messageId}`);
  }

  async getSheetRows(
    range: string = "Sheet1!A:C",
  ): Promise<{ task: string; duration: number }[]> {
    const sheets = this.getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: this.getConfig("GOOGLE_SHEETS_ID"),
      range,
    });

    const [_header, ...rows] = (response.data.values as string[][]) ?? [];
    const today = new Date().toISOString().split("T")[0];

    const rowResult = rows
      .filter((row) => row.length > 0 && row[2] === today)
      .map((row) => ({
        task: row[0],
        duration: Number(row[1]),
      }));
    this.logger.debug(`respoonse from sheets ${JSON.stringify(rowResult)}`);
    return rowResult;
  }
}
