import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiService } from "../common/api.service";
import { GetTimeLogDto } from "../dto/get-time-log.dto";
import { TrackCreateDTO, TrackModuleBodyDto } from "../dto/track.dto";
import { getLogBuiilder } from "../helper/getLog.builder";
import { buildLogPayloads } from "../utils/log.utils";

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
    const header = { ...options.headers };
    if (!options.headers?.Authorization) {
      const accessToken = await this.getAccessToken();
      header.Authorization = `Zoho-oauthtoken ${accessToken}`;
    }

    return this.apiService.request<T>({
      ...options,
      url: `${this.getConfig("ZOHO_PROJECT_API_BASE_URL")}${options.url}`,
      headers: header,
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

  async postBulkLog(portalId: string, body: Record<string, any>[]) {
    this.logger.log(`Posting bulk log: ${JSON.stringify(body)}`);

    const formData = new FormData();
    formData.append("log_object", JSON.stringify(body));
    const result = await this.requestZohoProject({
      url: `portal/${portalId}/addbulktimelogs`,
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    this.logger.log(`Bulk log added: ${JSON.stringify(result)}`);
    return result;
  }

  async postLog(
    body: TrackModuleBodyDto[],
    portalId: string,
    projectId: string,
  ) {
    const payloads = buildLogPayloads(body);
    const results = [];

    for (const element of payloads) {
      results.push(
        await this.requestZohoProject({
          url: `portal/${portalId}/projects/${projectId}/log`,
          method: "POST",
          data: element,
        }),
      );
    }

    this.logger.log(`Log added ${JSON.stringify(results)}`);
    return results;
  }

  async postTask(body: TrackCreateDTO[], portalId: string, projectId: string) {
    const accessToken = await this.getAccessToken();
    const result = await Promise.all(
      body.map((task) =>
        this.requestZohoProject({
          url: `portal/${portalId}/projects/${projectId}/tasks`,
          method: "POST",
          data: task,
          headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        }),
      ),
    );

    const response = result.reduce((acc, taskRes) => {
      const { id, name, owners_and_work } = taskRes;
      acc.push({ id, name, ownerId: owners_and_work?.owners?.[0]?.zpuid });
      return acc;
    }, []);
    this.logger.log(`Task created ${JSON.stringify(response)}`);
    return response;
  }

  async getLog(query: GetTimeLogDto) {
    const { portalId, userId, startDate } = query;
    const response = await this.requestZohoProject({
      url: `portal/${portalId}/projects/105855000004264414/timelogs`,
      method: "GET",
      params: getLogBuiilder(query),
    });
    this.logger.log(
      `Total hours ${response.log_hours?.total_hours} from ${startDate} for ${userId}`,
    );
    return response;
  }

  async fetchCurrentProject() {
    const portalId = this.getConfig("ZOHO_PROJECT_PORTAL_ID");
    const response = await this.requestZohoProject({
      url: `portal/${portalId}/projects`,
      method: "GET",
    });
    const now = new Date();
    const project = response.find((project: any) => {
      const startDate = new Date(project.start_date);
      return (
        startDate.getFullYear() === now.getFullYear() &&
        startDate.getMonth() === now.getMonth()
      );
    });
    return project;
  }
}
