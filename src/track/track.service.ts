import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  CreateEodDto,
  GetTimeLogDto,
  TaskLogDto,
  // TaskLogDto,
} from "../dto/get-time-log.dto";
import {
  TrackModuleBodyDto,
  TrackModuleDto,
  TrackModulePostDto,
} from "../dto/track.dto";
import { GoogleService } from "../google/google.service";
import { sendResponse } from "../helper/getLog.builder";
import { generateSubject } from "../helper/stringManipulation.helper";
import { StatusMailPayload } from "../interfaces/report.interface";
import { htmlGenerator } from "../utils/mail-template";
import { ZohoService } from "../zoho/zoho.service";
import { ConfigService } from "@nestjs/config";
import { buildLogPayloads } from "../utils/log.utils";
import { format } from "date-fns";
import { TimeLogTaskDto } from "../dto/time-log-task.dto";
import { isValidDuration } from "../utils/time.utils";

@Injectable()
export class TrackService {
  private readonly logger = new Logger(TrackService.name);

  constructor(
    private readonly zohoService: ZohoService,
    private readonly googleService: GoogleService,
    private readonly configService: ConfigService,
  ) {}
  private portalId = this.configService.getOrThrow("ZOHO_PROJECT_PORTAL_ID");
  async postLogTimeByTask(
    payload: TrackModuleDto,
  ): Promise<{ id: string; name: string }[]> {
    const { portalId, projectID, body } = payload;
    this.logger.debug(`Adding Logs to specific task ${JSON.stringify(body)}`);

    return this.zohoService.postLog(body, portalId, projectID);
  }

  async postTask(payload: TrackModulePostDto) {
    const { portalId, projectID, body } = payload;
    this.logger.debug(`Creating task ${JSON.stringify(body)}`);

    return this.zohoService.postTask(body, portalId, projectID);
  }

  async postBulkLog(
    portalId: string,
    projectID: string,
    body: TrackModuleBodyDto[],
  ) {
    const payloads = buildLogPayloads(body).map((bulk) => ({
      project_id: projectID,
      item_id: bulk.module.id,
      type: bulk.module.type,
      date: bulk.date,
      bill_status: bulk.bill_status,
      notes: bulk.notes,
      owner_zpuid: bulk.owner_zpuid,
      start_time: bulk.start_time,
      end_time: bulk.end_time,
    }));
    return this.zohoService.postBulkLog(portalId, payloads);
  }

  async postLogWithTaskMail(payload: CreateEodDto) {
    const email = this.configService.getOrThrow("GOOGLE_EMAIL");
    const { projectID, body, date } = payload;
    const taskNames = body.map((d: TaskLogDto) => d.task);
    const duplicates = taskNames.filter(
      (name, i) => taskNames.indexOf(name) !== i,
    );

    if (duplicates.length) {
      throw new BadRequestException(
        `Duplicate task names found: ${[...new Set(duplicates)].join(", ")}`,
      );
    }

    let message = "";
    body.forEach((item, index) => {
      const hasDuration = item.duration !== undefined && item.duration !== null;
      const hasStartTime = !!item.startTime;
      const hasEndTime = !!item.endTime;

      if (!hasDuration && !hasStartTime && !hasEndTime) {
        message += `body.${index}: Duration or startTime and endTime must be provided.`;
      }

      if (hasDuration && !isValidDuration(String(item.duration))) {
        message += `body.${index}: duration "${item.duration}" must be a valid number (0.1 to infinity).`;
      }

      if (hasDuration && (hasStartTime || hasEndTime)) {
        message += `body.${index}: Provide either duration or startTime and endTime, not both.`;
      }
      if (!hasStartTime || !hasEndTime) {
        message += `body.${index}: ${!hasStartTime ? "StartTime is required" : "EndTime is required"}`;
      }
    });
    if (message) throw new BadRequestException(message);

    const taskpayload = body.map((data: TaskLogDto) => ({
      name: data.task,
      owners_and_work: { owners: [{ email: email }] },
    }));
    const responseTask = await this.postTask({
      portalId: this.portalId,
      projectID,
      body: taskpayload,
    });
    const logOnTask = responseTask?.map((task: any) => {
      const currentDuration = body.find((item: any) => item.task === task.name);
      const {
        endTime = "",
        startTime = "",
        duration = 0,
      } = currentDuration ?? {};
      const data: Record<string, any> = {
        owner_zpuid: task.ownerId,
        date,
        module: { id: task.id, type: "task" },
      };
      if (endTime) data.end_time = endTime;
      if (startTime) data.start_time = startTime;
      if (duration) data.duration = duration;
      return data;
    });
    await this.postBulkLog(this.portalId, projectID, logOnTask);
    await this.getLogSendIt({
      portalId: this.portalId,
      projectId: projectID,
      startDate: date,
      userId: logOnTask?.[0]?.owner_zpuid,
    });
  }

  async handleAutomateReportGenerator(body: TimeLogTaskDto[]) {
    const projectDetail: any = await this.zohoService.fetchCurrentProject();
    const date = format(new Date(), "yyyy-MM-dd");
    this.logger.debug(`logger date ${date} ${JSON.stringify(body)}`);
    if (!projectDetail.id) {
      throw new BadRequestException(
        `No Zoho Project Board Available for this ${date}`,
      );
    }
    return this.postLogWithTaskMail({
      projectID: projectDetail?.id,
      date,
      email: this.configService.getOrThrow("GOOGLE_EMAIL"),
      body,
    });
  }

  async getLog(query: GetTimeLogDto) {
    this.logger.debug(`Getting query ${JSON.stringify(query)}`);
    const response = await this.zohoService.getLog(query);
    return sendResponse(response);
  }

  async sendStatusMail(payload: StatusMailPayload) {
    this.logger.debug(`Send Mail ${JSON.stringify(payload)}`);
    if (!payload?.logs?.length) return;
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
    return this.sendStatusMail(logResult as StatusMailPayload);
  }
}
