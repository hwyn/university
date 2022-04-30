import { Get } from "@server/decorator/injectable-router";
import { Request, Response } from 'express';

import { SSRRender } from "./ssr-render";
import { SSROptions } from "./type-api";

export abstract class SSRControl {
  private ssrVm: SSRRender;
  constructor(entryFile: string, options: SSROptions) {
    this.ssrVm = new SSRRender(entryFile, options);
  }

  @Get('/micro-ssr')
  @Get('/micro-ssr/:pathname')
  async renderMicro(request: Request, response: Response): Promise<void> {
    await this.ssrVm.renderMicro(request, response);
  }

  @Get('*')
  async render(request: Request, response: Response): Promise<void> {
    await this.ssrVm.render(request, response);
  }
}
