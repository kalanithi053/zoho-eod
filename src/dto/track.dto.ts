import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsObject, IsString, ValidateNested } from "class-validator";

export class TrackModuleItemDto {
  @ApiProperty({
    description: "Zoho module ID (Task ID, Bug ID, etc.)",
    example: "105855000004301162",
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: "Module type",
    example: "task",
  })
  @IsString()
  type!: string;
}

export class TrackModuleBodyDto {
  @ApiProperty({
    description: "Zoho user ID",
    example: "105855000000885613",
  })
  @IsString()
  owner_zpuid!: string;

  @ApiProperty({
    description: "Log date in YYYY-MM-DD format",
    example: "2026-06-06",
  })
  @IsString()
  date!: string;

  // @ApiProperty({
  //   description: 'Source page from which the time log is created',
  //   example: 'taskdetails',
  // })
  // @IsString()
  // frompage!: string;

  @ApiProperty({
    description: "Zoho module details",
    type: TrackModuleItemDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => TrackModuleItemDto)
  module!: TrackModuleItemDto;

  // @ApiProperty({
  //   description: 'Billing status of the time log',
  //   example: 'Billable',
  // })
  // @IsString()
  // @IsOptional()
  // bill_status!: string;

  // @ApiProperty({
  //   description: 'Notes associated with the time log',
  //   example: '<div>Worked on API integration</div>',
  // })
  // @IsString()
  // @IsOptional()
  // notes!: string;

  @ApiProperty({
    description: "Start time",
    example: "01:02 AM",
  })
  @IsString()
  start_time!: string;

  @ApiProperty({
    description: "End time",
    example: "01:03 AM",
  })
  @IsString()
  end_time!: string;

  // @ApiProperty({
  //   description: 'Whether the log was created using a timer',
  //   example: false,
  // })
  // @IsBoolean()
  // for_timer!: boolean;
}

export class TrackModuleDto {
  @ApiProperty({
    description: "Zoho Projects Portal ID",
    example: "60012562414",
  })
  @IsString()
  portalId!: string;

  @ApiProperty({
    description: "Zoho Project ID",
    example: "105855000004264414",
  })
  @IsString()
  projectID!: string;

  @ApiProperty({
    description: "List of time log entries",
    type: [TrackModuleBodyDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackModuleBodyDto)
  body!: TrackModuleBodyDto[];
}

export class TrackCreateDTO {
  @ApiProperty({
    description: "Task Name",
    example: "Task Name",
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "Task owners",
    example: { owners: [{ email: "kalanithi@amwhiz.com" }] },
  })
  @IsObject()
  owners_and_work!: { owners: { email: string }[] };
}

export class TrackModulePostDto {
  @ApiProperty({
    description: "Zoho Projects Portal ID",
    example: "60012562414",
  })
  @IsString()
  portalId!: string;

  @ApiProperty({
    description: "Zoho Project ID",
    example: "105855000004264414",
  })
  @IsString()
  projectID!: string;

  @ApiProperty({
    description: "List of task",
    type: [TrackCreateDTO],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackCreateDTO)
  body!: TrackCreateDTO[];
}
