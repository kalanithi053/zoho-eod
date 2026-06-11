import { Module } from "@nestjs/common";
import { ApiService } from "../common/api.service";
import { ZohoService } from "./zoho.service";

@Module({
  providers: [ZohoService, ApiService],
  exports: [ZohoService],
})
export class ZohoModule {}
