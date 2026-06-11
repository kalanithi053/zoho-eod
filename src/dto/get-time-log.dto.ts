import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetTimeLogDto {
  @ApiProperty({
    example: "60012562414",
  })
  @IsString()
  portalId!: string;

  @ApiProperty({
    example: "105855000004264414",
  })
  @IsString()
  projectId!: string;

  @ApiProperty({
    example: "105855000000885613",
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    example: "2026-06-01",
  })
  @IsString()
  startDate!: string;

  @ApiProperty({
    example: "2026-06-07",
  })
  @IsString()
  endDate!: string;
}
