import { Controller, Get, Req } from "@nestjs/common";
import { AppService } from "./app.service";
import { Request } from "express";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from 'bull';
import process from "process";
@Controller()
export class AppController {
  constructor(private readonly appService: AppService,

        @InjectQueue('myQueue') private readonly myQueue: Queue,
  ) {}

   @Get("")
 
  async get(@Req() req: Request) {
    console.trace("call stack")
    return { msg:"Hello world"};
  }

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

    @Get('add-job')
  async addJob() {
    const job = await this.myQueue.add('job', { // 'job' is the job name
      message: 'This is the job data',  // Job data that you want to send to the processor
    });
    return `Job with ID ${job.id} has been added to the queue.`;
  }
}
