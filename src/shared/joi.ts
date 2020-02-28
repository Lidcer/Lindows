import Joi from '@hapi/joi';

export const registerUserJoi = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),

  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
  repeatPassword: Joi.ref('password'),

  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
}).with('password', 'repeatPassword');

export const loginUserJoi = Joi.object({
  usernameOrMail: Joi.string(),
  password: Joi.string().required(),
});
