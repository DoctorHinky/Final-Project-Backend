import { UserRoles } from '@prisma/client';

export interface BaseEmailData {
  [key: string]: any;
}

// specific E-Mail-Data for conditional templates
export interface ApplicationAcceptedData extends BaseEmailData {
  firstname: string;
  lastname: string;
  termsOfUseUrl: string;
  termsAndConditionsUrl: string;
}

export interface ApplicationRejectedData extends BaseEmailData {
  firstname: string;
  reason: string;
}

export interface BlockingFromApplicationData extends BaseEmailData {
  firstname: string;
  reason: string;
}

export interface WelcomeEmailData extends BaseEmailData {
  firstname: string;
  verificationLink: string;
  loginUrl: string;
}

export interface PasswordResetData extends BaseEmailData {
  username: string;
  resetLink: string;
}

export interface EmailTemplateConfig {
  templateName: string;
  subject: string;
}

export interface EmailVerificationData extends BaseEmailData {
  firstname: string;
  verificationLink: string;
}

export interface MakeModsData extends BaseEmailData {
  username: string;
  role: UserRoles;
  systemmail: string;
}

export interface AnswerFeedback extends BaseEmailData {
  firstname: string;
  content: string;
  username: string;
}

// predefined Email Templates
export const EMAIL_TEMPLATES = {
  APPLICATION_ACCEPTED: {
    templateName: 'application-accepted',
    subject: 'Welcome to the Author Community',
  },
  APPLICATION_REJECTED: {
    templateName: 'application-rejected',
    subject: 'Your Application Has Been Rejected',
  },
  BLOCKING_USER: {
    templateName: 'application-blocked',
    subject: 'Your Account Has Been Blocked from Applications',
  },
  UNBLOCKING_USER: {
    templateName: 'application-unblocked',
    subject: 'Your Account Has Been Unblocked from Applications',
  },
  EMAIL_VERIFICATION: {
    templateName: 'email-verification',
    subject: 'Verify Your Email Address',
  },
  WELCOME: {
    templateName: 'welcome',
    subject: 'Welcome to LearnToGrow',
  },
  MAKE_MODS: {
    templateName: 'create-admin',
    subject: 'You Have Been Made a Moderator',
  },
  PASSWORD_RESET: {
    templateName: 'password-reset',
    subject: 'Reset Your Password',
  },
  ANSWER_FEEDBACK: {
    templateName: 'feedback-answer',
    subject: 'LearnToGrow answered you Feedback',
  },
} as const;

// Union Type für alle möglichen E-Mail-Daten
export type EmailData =
  | ApplicationAcceptedData
  | ApplicationRejectedData
  | BlockingFromApplicationData
  | WelcomeEmailData
  | EmailVerificationData
  | PasswordResetData
  | MakeModsData
  | AnswerFeedback;
