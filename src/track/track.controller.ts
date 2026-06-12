import { Body, Controller, Get, Logger, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CreateEodDto, GetTimeLogDto } from "../dto/get-time-log.dto";
import { StatusMailPayloadDto } from "../dto/status-mail.dto";
import { TrackModuleDto, TrackModulePostDto } from "../dto/track.dto";
import { TrackService } from "./track.service";
import { TimeLogTaskDto } from "../dto/time-log-task.dto";
import { Cron } from "@nestjs/schedule";

@ApiTags("Track")
@Controller("track")
export class TrackController {
  private readonly logger = new Logger(TrackController.name);
  constructor(private readonly trackService: TrackService) {}

  @Post("task/time-log")
  @ApiOperation({
    summary: "Create task time logs in Zoho Projects",
  })
  @ApiBody({
    type: TrackModuleDto,
  })
  async sheet(@Body() payload: TrackModuleDto) {
    return this.trackService.postLogTimeByTask(payload);
  }

  @Get("task/time-log")
  @ApiOperation({
    summary: "Fetch project time logs by user and date range",
  })
  async getLog(@Query() query: GetTimeLogDto) {
    return this.trackService.getLog(query);
  }

  @Post("send-status-mail")
  async sendStatusMail(@Body() dto: StatusMailPayloadDto) {
    return this.trackService.sendStatusMail(dto);
  }

  @Post("task")
  async postTask(@Body() dto: TrackModulePostDto) {
    return this.trackService.postTask(dto);
  }

  @Get("log-send")
  @ApiOperation({
    summary: "Fetch project time logs by user and date range and the mail",
  })
  async getLogSendIt(@Query() query: GetTimeLogDto) {
    return this.trackService.getLogSendIt(query);
  }

  @Post("post-report-mail")
  async postLogWithTaskMail(@Body() payload: CreateEodDto) {
    return this.trackService.postLogWithTaskMail(payload);
  }

  @Post("automate/post-report-mail")
  @ApiOperation({ summary: "Fetch logs and send status mail" })
  @ApiBody({
    type: [TimeLogTaskDto],
    description: "List of tasks with time log entries",
  })
  async handleAutomate(@Body() payload: TimeLogTaskDto[]) {
    return this.trackService.handleAutomateReportGenerator(payload);
  }

  @Get("get-report-from-sheets")
  @ApiOperation({
    summary: "Fetch project time logs from google sheet",
  })
  async getContentFromSheets() {
    return this.trackService.getContentFromSheets();
  }

  @Get("sheet-to-report")
  @ApiOperation({
    summary: "Fetch project time logs from google sheet",
  })
  async sheetToReport() {
    const rows = await this.trackService.getContentFromSheets();
    return this.handleAutomate(rows as unknown as TimeLogTaskDto[]);
  }

  @Cron("33 14 * * *")
  handleDailyTask() {
    this.logger.log("Daily 9 PM cron job triggered!");
    return this.sheetToReport();
    // your logic here
  }
}
