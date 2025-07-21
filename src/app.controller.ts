import { Controller, Get, Req } from "@nestjs/common";
import { AppService } from "./app.service";
import { Request } from "express";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("csrf-token")
  @ApiTags("CSRF")
  @ApiOperation({
    description: "Generate CSRF Token",
    summary: "Generate CSRF Token to be used in Frontend Forms",
  })
  @ApiOkResponse({
    description: "Generate CSRF Token",
    example: {
      csrfToken: "MHP1Skkd-QJhgDlYvqFda4RIgocjDd4_gh3U",
    },
  })
  async getCSRFToken(@Req() req: Request) {
    return { csrfToken: req.csrfToken?.() };
  }
}
