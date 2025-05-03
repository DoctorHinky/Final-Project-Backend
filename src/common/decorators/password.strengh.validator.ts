/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* ich musste hier alles abschalten da eslint sich nicht beruhigen lassen hat */

import zxcvbn from 'zxcvbn';
import type { ZXCVBNResult } from 'zxcvbn';

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsStrongPasswordZXCVBN(
  minScore: number = 3,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'ratePasswordZXCVBN',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(val: any) {
          const result = zxcvbn(val) as ZXCVBNResult;
          return result.score >= minScore;
        },
        defaultMessage(args: ValidationArguments) {
          const result = zxcvbn(args.value);
          const warning = result.feedback.warning || '';
          const suggestions = result.feedback.suggestions?.join(', ') || '';
          return `Password is too weak. ${warning} ${suggestions}`;
        },
      },
    });
  };
}
