import { Injectable } from '@di';
import { HttpClient } from '@university/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StaticAssets { javascript: string[]; links: string[]; }

@Injectable()
export class LoadAssets {
  constructor(private http: HttpClient) { }

  private parseStatic(entryPoints: { [key: string]: any }): StaticAssets {
    const entryKeys = Object.keys(entryPoints);
    const staticAssets: StaticAssets = { javascript: [], links: [] };
    entryKeys.forEach((staticKey: string) => {
      const { js: staticJs = [], css: staticLinks = [] } = entryPoints[staticKey].assets;
      staticAssets.javascript.push(...staticJs);
      staticAssets.links.push(...staticLinks);
    });
    return staticAssets;
  }

  public readMicroStatic(microName: string): Observable<any> {
    return this.http.get(`/source/${microName}/static/assets.json`).pipe(
      map((result: any) => this.parseStatic(result.entrypoints))
    );
  }
}
