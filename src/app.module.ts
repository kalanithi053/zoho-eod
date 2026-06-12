import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ApiService } from "./common/api.service";
import { CommonModule } from "./common/common.module";
import { GoogleModule } from "./google/google.module";
import { TrackModule } from "./track/track.module";
import { ZohoModule } from "./zoho/zoho.module";
import { ZohoService } from "./zoho/zoho.service";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ZohoModule,
    TrackModule,
    CommonModule,
    GoogleModule,
  ],
  controllers: [],
  providers: [ZohoService, ApiService],
})
export class AppModule {}
