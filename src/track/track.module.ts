import { Module } from "@nestjs/common";

import { CommonModule } from "../common/common.module";
import { GoogleModule } from "../google/google.module";
import { ZohoModule } from "../zoho/zoho.module";
import { TrackController } from "./track.controller";
import { TrackService } from "./track.service";

@Module({
  imports: [ZohoModule, CommonModule, GoogleModule],
  providers: [TrackService],
  controllers: [TrackController],
})
export class TrackModule {}
