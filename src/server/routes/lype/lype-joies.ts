import { ILypeSearchQuery, ILypeUserID } from '../../../shared/ApiLypeRequestsResponds';
import Joi from '@hapi/joi';

export const joi$LypeSearchQuery = Joi.object<ILypeSearchQuery>({
  query: Joi.string(),
});

export const joi$LypeUserID = Joi.object<ILypeUserID>({
  userID: Joi.string(),
});
