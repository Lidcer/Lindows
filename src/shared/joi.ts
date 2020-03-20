import Joi from '@hapi/joi';
import {
  IAccountRegisterRequest,
  IAccountLoginRequest,
  IAccountChangePasswordRequest,
  IAccountChangeEmailRequest,
  IAccountVerificationRequest,
  IAccountDisplayedNameRequest,
  IAccountResetPasswordRequest,
  IAccountDeleteAccountRequest,
  IAccountEmailRequest,
} from './ApiRequestsResponds';

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

export const joi$registerUser = Joi.object<IAccountRegisterRequest>({
  username: USERNAME,
  password: PASSWORD,
  repeatPassword: Joi.ref('password'),
  email: EMAIL,
}).with('password', 'repeatPassword');

export const joi$loginUser = Joi.object<IAccountLoginRequest>({
  usernameOrEmail: Joi.string(),
  password: Joi.string(),
});

export const joi$changePassword = Joi.object<IAccountChangePasswordRequest>({
  oldPassword: Joi.string(),
  newPassword: PASSWORD,
  repeatNewPassword: Joi.ref('password'),
}).with('newPassword', 'repeatPassword');

export const joi$changeEmail = Joi.object<IAccountChangeEmailRequest>({
  password: Joi.string(),
  newEmail: EMAIL,
});

export const joi$verification = Joi.object<IAccountVerificationRequest>({
  password: Joi.string(),
});

export const joi$email = Joi.object<IAccountEmailRequest>({
  email: Joi.string(),
});

export const joi$displayedName = Joi.object<IAccountDisplayedNameRequest>({
  displayedName: USERNAME,
  password: PASSWORD,
});

export const joi$deleteAccount = Joi.object<IAccountDeleteAccountRequest>({
  password: USERNAME,
  repeatPassword: Joi.ref('password'),
  reason: Joi.string(),
}).with('newPassword', 'repeatPassword');

export const joi$resetPassword = Joi.object<IAccountResetPasswordRequest>({
  password: PASSWORD,
  repeatPassword: Joi.ref('password'),
}).with('password', 'repeatPassword');
