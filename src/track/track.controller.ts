import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CreateEodDto, GetTimeLogDto } from "../dto/get-time-log.dto";
import { StatusMailPayloadDto } from "../dto/status-mail.dto";
import { TrackModuleDto, TrackModulePostDto } from "../dto/track.dto";
import { TrackService } from "./track.service";
import { TimeLogTaskDto } from "../dto/time-log-task.dto";

@ApiTags("Track")
@Controller("track")
export class TrackController {
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
  async handleCorn(@Body() payload: TimeLogTaskDto[]) {
    return this.trackService.handleCorn(payload);
  }
}
