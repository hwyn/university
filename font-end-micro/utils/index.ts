export const templateZip = (template: string, mapping: any = {}) => {
  const keys = Object.keys(mapping);
  const formatTemplate = template.replace(/\n*/g, '').replace(/[ ]+/g, ' ');
  return keys.reduce((t: string, key: string) => t.replace(`{${key}}`, mapping[key]), formatTemplate);
};

export const createMicroElementTemplate = (microName: string, options: any) => {
  const { initHtml = '', initStyle = '', linkToStyles = [] } = options;
  return templateZip(`
    (function() {
      let initStyle = '{initStyle}';
      let initHtml = '{initHtml}';
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
          };
          initStyle = '';
          return head;
        }

        createBody() {
          const body = document.createElement('div');
          body.setAttribute('data-app', 'body');
          body.innerHTML = initHtml;
          initHtml = '';
          return body;
        }

        appendStyleNode(container) {
          const beforeNode = container.firstChild;
          styleLoadPushStyle.forEach(function(style) {
            container.insertBefore(style.cloneNode(true), beforeNode);
          });
          {linkToStyles}.forEach(function(styleText) {
            const style = document.createElement('style');
            style.appendChild(document.createTextNode(styleText));
            container.insertBefore(style, beforeNode);
          });
        }
      }
      customElements.define('${microName}-tag', Micro${microName}Element);
    })();
  `, {
    initStyle: initStyle.replace(/\'/g, '\'').replace(/\n/g, ''),
    initHtml: initHtml.replace(/\'/g, '\'').replace(/\n/g, ''),
    linkToStyles: JSON.stringify(linkToStyles)
  });
};
