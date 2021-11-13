import { HttpClient } from '@university/common';
import { getProvider } from '@university/di';
import { MICRO_MANAGER } from '@university/font-end-micro/token';
import { MicroStoreInterface } from '@university/font-end-micro/types';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaticAssets } from '../load-assets/load-assets';

declare const microFetchData: any[];

export class MicroStore implements MicroStoreInterface {
  private http = getProvider(HttpClient);
  private mountedList: any[] = [];
  private documentToLinks: Map<Document, { links: HTMLLinkElement[], quote: number }> = new Map();
  private _renderMicro!: (...args: any[]) => any;
  public isFirstMounted = true;

  constructor(private microName: string, private staticAssets: StaticAssets) { }

  private getMicroStaticData() {
    const microStaticNode = document.querySelector('#micro-fetch-static');
    if (microStaticNode) {
      document.head.removeChild(microStaticNode);
    }
    if (typeof microFetchData !== 'undefined') {
      const microData = microFetchData.find(({ microName }) => microName === this.microName);
      return microData ? JSON.parse(microData.source) : {};
    }
  }

  private createLinks(ownerDocument: Document): HTMLLinkElement[] {
    const { links } = this.staticAssets;
    const exitsLinks = Array.prototype.slice.call(ownerDocument.head.querySelectorAll('link'));
    return links.map((href: string) => {
      let link = exitsLinks.find((linkNode) => linkNode.getAttribute('href') === href);
      if (!link) {
        link = Object.assign(
          ownerDocument.createElement('link'),
          { href, rel: 'styleSheet', type: 'text/css' }
        );
        ownerDocument.head.appendChild(link);
      }
      return link;
    });
  }

  private removeLinks(currentDocument: Document) {
    const cacheLinks = this.documentToLinks.get(currentDocument);
    if (cacheLinks && !!cacheLinks?.quote) {
      cacheLinks.quote -= 1;
      if (cacheLinks?.quote <= 0) {
        cacheLinks.links.forEach((link) => currentDocument.head.removeChild(link));
        this.documentToLinks.delete(currentDocument);
      }
    }
  }

  private removeSameStyle(ownerDocument: Document) {
    const styleSheets = Array.prototype.slice.call(ownerDocument.querySelectorAll('style'));
    const cacheInnerHTML: string[] = [];
    styleSheets.reverse().forEach((style: HTMLScriptElement) => {
      const outerHTML = style.outerHTML;
      if (cacheInnerHTML.find((html) => html === outerHTML)) {
        (style.parentNode as HTMLElement).removeChild(style);
      } else {
        cacheInnerHTML.push(outerHTML);
      }
    });
  }

  public exceJavascript(): Observable<MicroStore> {
    const { javascript } = this.staticAssets;
    return forkJoin(javascript.map((src: string) => this.http.getText(src))).pipe(
      map((sources: string[]) => {
        const common: any = { render: () => void (0), serverFetchData: this.getMicroStaticData() };
        // tslint:disable-next-line:function-constructor
        sources.forEach((source: string) => new Function('common', source)(common));
        this._renderMicro = common.render;
        return this;
      })
    );
  }

  public async onMounted(continer: HTMLElement, options?: any): Promise<any> {
    const ownerDocument = continer.ownerDocument;
    const _options = { ...options, microManage: getProvider(MICRO_MANAGER) };
    let cacheLinks = this.documentToLinks.get(ownerDocument);
    if (!cacheLinks) {
      cacheLinks = { links: this.createLinks(ownerDocument), quote: 0 };
      this.documentToLinks.set(ownerDocument, cacheLinks);
    }
    cacheLinks.quote += 1;
    const unRender = await this._renderMicro(continer, _options);
    this.mountedList.push({ unRender, continer, document: ownerDocument });
    this.isFirstMounted = false;
    return unRender;
  }

  public async unMounted(continer: HTMLElement) {
    const [exMicroInfo] = this.mountedList.filter((c) => continer === c.continer);
    if (!exMicroInfo) {
      return;
    }
    const { unRender, document: ownerDocument } = exMicroInfo;
    this.mountedList.splice(this.mountedList.indexOf(exMicroInfo), 1);
    await unRender();
    this.removeLinks(ownerDocument);
    this.removeSameStyle(ownerDocument);
  }
}
