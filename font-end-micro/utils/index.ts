export const createMicroElementTemplate = (microName: string, options: any) => {
  const { initHtml = '', initStyle = '', linkToStyles = [] } = options;
  const classTemplate = `
    (function() {
      let initStyle = '${initStyle.replace(/\"/g, '\"').replace(/\n/g, '')}';
      let initHtml = '${initHtml.replace(/\"/g, '\"').replace(/\n/g, '')}';
      let styleLoadPushStyle = [];
      class Micro${microName}Element extends HTMLElement {
        constructor() {
          super();
          const shadow = this.attachShadow({ mode: 'open' });
          const head = this.createHead();
          shadow.appendChild(head);
          shadow.appendChild(this.createBody());
          this.appendStyleNode(head);
        }

        createHead() {
          const head = document.createElement('div');
          const _appendChild = head.appendChild.bind(head);
          head.setAttribute('data-app', 'head');
          head.innerHTML = initStyle;
          head.appendChild = function(style) {
            if (style.getAttribute('data-micro') === '${microName}') {
              styleLoadPushStyle.push(style);
            }
            return _appendChild(style);
          }
          initStyle = '';
          return head;
        }

        createBody() {
          const body = document.createElement('div');
          body.setAttribute('data-app', 'body')
          body.innerHTML = initHtml;
          initHtml = '';
          return body;
        }

        appendStyleNode(container) {
          const beforeNode = container.firstChild;
          styleLoadPushStyle.forEach(function(style) {
            container.insertBefore(style, beforeNode);
          });
          ${JSON.stringify(linkToStyles)}.forEach(function(styleText) {
            const style = document.createElement('style');
            style.appendChild(document.createTextNode(styleText));
            container.insertBefore(style, beforeNode);
          });
        }
      }
      customElements.define('${microName}-tag', Micro${microName}Element);
    })();
  `;

  return classTemplate;
};
