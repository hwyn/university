import { Injectable, LocatorStorage } from '@fm/di';
import { MicroManageInterface } from '@fm/shared/micro';
import { Observable, Subject } from '@fm/import-rxjs';
import { map, shareReplay, tap } from '@fm/import-rxjs';

import { LoadAssets, StaticAssets } from '../load-assets/load-assets';
import { MicroStore } from '../micro-store/micro-store';
import { SharedData } from '../shared-data/share-data';

@Injectable()
export class MicroManage implements MicroManageInterface {
  public loaderStyleSubject = new Subject<HTMLStyleElement>();
  private chunkMap: { [microName: string]: string[] } = {};
  private microCache: Map<string, Observable<MicroStore>> = new Map();

  constructor(private ls: LocatorStorage, private la: LoadAssets) {
    document.querySelector = this.querySelectorProxy();
  }

  public bootstrapMicro(microName: string): Observable<MicroStore> {
    let storeSubject = this.microCache.get(microName);
    if (!storeSubject) {
      storeSubject = this.la.readMicroStatic(microName).pipe(
        tap(({ links }: StaticAssets) => Object.assign(this.chunkMap, { [microName]: links })),
        map((result: StaticAssets) => new MicroStore(microName, result, this)),
        shareReplay(1)
      );
      this.microCache.set(microName, storeSubject);
    }

    return storeSubject;
  }

  private querySelectorProxy() {
    const loaderStyleHead = document.createElement('head');
    const head = document.head;
    const _querySelector = document.querySelector.bind(document);
    Object.defineProperty(head, 'appendChild', { value: this.proxyAppendLink.bind(this, head.appendChild.bind(head)) });
    Object.defineProperty(loaderStyleHead, 'appendChild', { value: this.loaderStyleSubject.next.bind(this.loaderStyleSubject) });
    return (selectors: string) => /^styleLoaderInsert:[^:]+::shadow$/g.test(selectors) ? loaderStyleHead : _querySelector(selectors);
  }

  private proxyAppendLink(appendChild: (node: any) => any, linkNode: HTMLLinkElement) {
    if (linkNode.nodeName === 'LINK') {
      const href = linkNode.getAttribute('href') || '';
      const microName = Object.keys(this.chunkMap).find((name) => this.chunkMap[name].includes(href));
      microName && (linkNode.href = URL.createObjectURL(new Blob([''])));
    }
    return appendChild(linkNode);
  }

  public get sharedData() {
    return this.ls.getService(SharedData);
  }
}
