declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.js' {
  const module: any;
  export default module;
}
