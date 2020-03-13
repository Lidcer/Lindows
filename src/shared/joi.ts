import Joi from '@hapi/joi';

// CONSTANTS
const USERNAME = Joi.string()
  .alphanum()
  .min(3)
  .max(16)
  .required();

const PASSWORD = Joi.string()
  .min(6)
  .max(500)
  .required();

const EMAIL = Joi.string()
  .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
  .required();

const registerUserJoi = Joi.object({
  username: USERNAME,
  password: PASSWORD,
  repeatPassword: Joi.ref('password'),
  email: EMAIL,
}).with('password', 'repeatPassword');

const loginUserJoi = Joi.object({
  username: Joi.string(),
  email: Joi.string(),
  password: Joi.string(),
});

const changePasswordJoi = Joi.object({
  oldPassword: Joi.string(),
  newPassword: PASSWORD,
  repeatNewPassword: Joi.ref('password'),
}).with('newPassword', 'repeatPassword');

const changeEmailJoi = Joi.object({
  username: Joi.string(),
  password: Joi.string(),
  email: EMAIL,
  newEmail: EMAIL,
});

const verificationJoi = Joi.object({
  password: Joi.string(),
});

const emailJoi = Joi.object({
  email: EMAIL,
});

const displayedNameJoi = Joi.object({
  displayedName: USERNAME,
  password: PASSWORD,
});

export {
  verificationJoi,
  displayedNameJoi,
  emailJoi,
  registerUserJoi,
  loginUserJoi,
  changePasswordJoi,
  changeEmailJoi,
};
