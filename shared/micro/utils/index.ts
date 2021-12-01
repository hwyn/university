export const templateZip = (template: string, mapping: any = {}) => {
  const keys = Object.keys(mapping);
  const formatTemplate = template.replace(/\n*/g, '').replace(/[ ]+/g, ' ');
  return keys.reduce((t: string, key: string) => t.replace(new RegExp(`\\{${key}\\}`, 'g'), mapping[key]), formatTemplate);
};

// eslint-disable-next-line max-lines-per-function
export const createMicroElementTemplate = (microName: string, options: any) => {
  const { initHtml = '', initStyle = '', linkToStyles = [] } = options;
  return templateZip(`
    (function() {
      let initStyle = '{initStyle}';
      let initHtml = '{initHtml}';
      class Micro${microName}Element extends HTMLElement {
        constructor() {
          super();
          const shadow = this.attachShadow({ mode: 'open' });
          const head = this.createHead();
          shadow.appendChild(head);
          shadow.appendChild(this.createBody());
          this.appendStyleNode(head);
          initStyle = '';
          initHtml = '';
        }

        createHead() {
          const head = document.createElement('div');
          const _appendChild = head.appendChild.bind(head);
          head.setAttribute('data-app', 'head');
          head.innerHTML = initStyle;
          return head;
        }

        createBody() {
          const body = document.createElement('div');
          body.setAttribute('data-app', 'body');
          body.innerHTML = initHtml;
          return body;
        }

        appendStyleNode(container) {
          const beforeNode = container.firstChild;
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
    initStyle: initStyle.replace(/'/g, '\'').replace(/\n/g, ''),
    initHtml: initHtml.replace(/'/g, '\'').replace(/\n/g, ''),
    linkToStyles: JSON.stringify(linkToStyles)
  });
};
