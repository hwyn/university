declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '@environments' {
  const module: any;
  export const environments: any;
  export default module;
}

declare module '*.js' {
  const module: any;
  export default module;
}
