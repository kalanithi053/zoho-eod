import { Injectable, Logger } from "@nestjs/common";
import { GetTimeLogDto } from "../dto/get-time-log.dto";
import { TrackModuleDto, TrackModulePostDto } from "../dto/track.dto";
import { GoogleService } from "../google/google.service";
import { sendResponse } from "../helper/getLog.builder";
import { generateSubject } from "../helper/stringManipulation.helper";
import { StatusMailPayload } from "../interfaces/report.interface";
import { htmlGenerator } from "../utils/mail-template";
import { ZohoService } from "../zoho/zoho.service";

@Injectable()
export class TrackService {
  private readonly logger = new Logger(TrackService.name);

  constructor(
    private readonly zohoService: ZohoService,
    private readonly googleService: GoogleService,
  ) {}

  async postLogTimeByTask(
    payload: TrackModuleDto,
  ): Promise<{ id: string; name: string }[]> {
    const { portalId, projectID, body } = payload;
    this.logger.debug(`Adding Logs to specific task ${JSON.stringify(body)}`);
    const responses = await Promise.all(
      body.map((log) => this.zohoService.postLog(log, portalId, projectID)),
    );
    return responses;
  }

  async postTask(payload: TrackModulePostDto) {
    const { portalId, projectID, body } = payload;
    this.logger.debug(`Creating task ${JSON.stringify(body)}`);
    const responses = await Promise.all(
      body.map((task) => this.zohoService.postTask(task, portalId, projectID)),
    );
    return responses;
  }

  async getLog(query: GetTimeLogDto) {
    this.logger.debug(`Getting query ${JSON.stringify(query)}`);
    const response = await this.zohoService.getLog(query);
    return sendResponse(response);
  }

  async sendStatusMail(payload: StatusMailPayload) {
    this.logger.debug(`Send Mail ${JSON.stringify(payload)}`);
    const htmlContent = htmlGenerator(payload);
    return await this.googleService.sendMail(
      generateSubject(payload.logs[0]?.name, payload.reportDate),
      htmlContent,
    );
  }

  async getLogSendIt(query: GetTimeLogDto) {
    this.logger.debug(
      `Fetching Logs and drafting mail for ${JSON.stringify(query)}`,
    );
    const logResult = await this.getLog(query);
    return this.sendStatusMail(logResult);
  }
}
