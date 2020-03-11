import Joi from '@hapi/joi';

const passwordRexExp = new RegExp('^[a-zA-Z0-9]{3,100}$');

const registerUserJoi = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),

  password: Joi.string().pattern(passwordRexExp),
  repeatPassword: Joi.ref('password'),

  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
}).with('password', 'repeatPassword');

const loginUserJoi = Joi.object({
  username: Joi.string(),
  email: Joi.string(),
  password: Joi.string().required(),
});

const changePasswordJoi = Joi.object({
  oldPassword: Joi.string(),
  newPassword: Joi.string().pattern(passwordRexExp),
  repeatNewPassword: Joi.ref('password'),
}).with('newPassword', 'repeatPassword');

const changeEmailJoi = Joi.object({
  username: Joi.string(),
  email: Joi.string(),
  password: Joi.string(),
  newEmail: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
});

const emailJoi = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
});

export { emailJoi, registerUserJoi, loginUserJoi, changePasswordJoi, changeEmailJoi };
