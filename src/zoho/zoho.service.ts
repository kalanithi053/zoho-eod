import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiService } from "../common/api.service";
import { GetTimeLogDto } from "../dto/get-time-log.dto";
import { TrackCreateDTO, TrackModuleBodyDto } from "../dto/track.dto";
import { getLogBuiilder } from "../helper/getLog.builder";

@Injectable()
export class ZohoService {
  private readonly logger = new Logger(ZohoService.name);

  private accessToken: string | null = null;
  private expiresAt = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly apiService: ApiService,
  ) {}

  private getConfig(key: string): string {
    return this.configService.getOrThrow<string>(key);
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.accessToken && now < this.expiresAt) {
      return this.accessToken;
    }

    const response = await this.retry(() =>
      this.apiService.request({
        url: `${this.getConfig("ZOHO_AUTH_URL")}/oauth/v2/token`,
        method: "POST",
        params: {
          refresh_token: this.getConfig("ZOHO_REFRESH_TOKEN"),
          client_id: this.getConfig("ZOHO_CLIENT_ID"),
          client_secret: this.getConfig("ZOHO_CLIENT_SECRET"),
          grant_type: "refresh_token",
        },
      }),
    );

    this.accessToken = response.access_token;
    this.expiresAt = now + (response.expires_in - 60) * 1000;

    this.logger.log("Zoho access token refreshed");

    return this.accessToken ?? "";
  }

  async requestZohoProject<T = any>(options: {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    params?: Record<string, any>;
    data?: any;
    headers?: Record<string, string>;
  }): Promise<T> {
    const accessToken = await this.getAccessToken();

    return this.apiService.request<T>({
      ...options,
      url: `${this.getConfig("ZOHO_PROJECT_API_BASE_URL")}${options.url}`,
      headers: {
        ...options.headers,
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });
  }
  private async retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (
        retries > 0 &&
        ["ECONNRESET", "ETIMEDOUT", "ECONNABORTED"].includes(error.code)
      ) {
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.retry(fn, retries - 1, delay * 2);
      }

      throw error;
    }
  }

  async postLog(body: TrackModuleBodyDto, portalId: string, projectId: string) {
    const result = await this.requestZohoProject({
      url: `portal/${portalId}/projects/${projectId}/log`,
      method: "POST",
      data: {
        ...body,
        frompage: "taskdetails",
        notes: "<div>Worked on API integration</div>",
        bill_status: "Billable",
        for_timer: false,
      },
    });
    this.logger.log(`Log added ${JSON.stringify(result)}`);
    return result;
  }

  async postTask(body: TrackCreateDTO, portalId: string, projectId: string) {
    const result = await this.requestZohoProject({
      url: `portal/${portalId}/projects/${projectId}/tasks`,
      method: "POST",
      data: body,
    });
    const { id, name } = result;
    this.logger.log(`Task created ${JSON.stringify({ id, name })}`);
    return { id, name };
  }

  async getLog(query: GetTimeLogDto) {
    const { portalId, userId, startDate, endDate } = query;
    const response = await this.requestZohoProject({
      url: `portal/${portalId}/projects/105855000004264414/timelogs`,
      method: "GET",
      params: getLogBuiilder(query),
    });
    this.logger.log(
      `Total hours ${response.log_hours?.total_hours} from ${startDate} to ${endDate} for ${userId}`,
    );
    return response;
  }
}
