import { Injectable } from '@fm/di';
import { ModelAttributes, ModelOptions, Sequelize } from 'sequelize';

export const createInjectableModel = (sequelize: Sequelize) => (attributes: ModelAttributes, options: ModelOptions) => <T>(clazz: T): T => {
  (clazz as any).init(attributes, { sequelize, ...options });
  return Injectable()(clazz as any) as unknown as T;
};
