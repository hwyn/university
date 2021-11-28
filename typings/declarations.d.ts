declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '@environment' {
  const module: any;
  export const environment: any;
  export default module;
}

declare module '*.js' {
  const module: any;
  export default module;
}
