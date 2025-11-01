import { Module } from "@nestjs/common";
import { NotificationGatewayService } from "./notification.gateway";


@Module({
  providers: [NotificationGatewayService],
  exports: [NotificationGatewayService],
})
export class WebsocketModule {}