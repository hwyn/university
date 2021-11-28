const vmModules: { [key: string]: any } = {
  querystring: require('querystring'),
  stream: require('stream'),
  buffer: require('buffer'),
  events: require('events'),
  util: require('util')
};

export const vmRequire = (modelName: string) => vmModules[modelName];

