import { getProvider, Injector, Provider, StaticInjector } from '@fm/di';
import express, { Express } from 'express';
import { createServer } from 'http';

import { PORT } from '../../token';

declare const global: any;

export class ExpressServerPlatform {
  private rootInjector: Injector = getProvider(Injector as any);

  constructor(private providers: Provider[]) { }

  async bootstrapStart(start: (injector: Injector) => Promise<void>) {
    const injector = this.beforeBootstrapStart([{ provide: express, useValue: express() }]);
    const port: number = injector.get(PORT) || 3000;
    await start(injector).then(() => this.listen(port, injector.get(express)));
  }

  private beforeBootstrapStart(providers: Provider[] = []) {
    const injector = new StaticInjector(this.rootInjector, { isScope: 'self' });
    [...this.providers, ...providers].forEach((provider) => injector.set(provider.provide, provider));
    return injector;
  }

  public listen(port: number, app: Express) {
    global.hotHttpHost = `http://localhost:${port}/`;
    global.hotHttpServer = createServer(app).listen(port, () => {
      console.log(`The server is running at ${global.hotHttpHost}`);
    });
  }
}