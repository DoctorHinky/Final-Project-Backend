import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as fs from 'fs';
import * as path from 'path';

@ValidatorConstraint({ name: 'isTempMail', async: false })
export class IsNotTempMailContraint implements ValidatorConstraintInterface {
  private tempMailDomains: string[] = [];
  constructor() {
    const filePath = path.join(__dirname, '..', 'data', 'tempMails.json');

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const domains = JSON.parse(content) as string[];
      this.tempMailDomains = domains.map((d: string) => d.toLowerCase());
    } catch (error) {
      console.error(`Error reading temp mail domains file: ${error}`);
    }
  }

  validate(email: string): Promise<boolean> | boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return !!domain && !this.tempMailDomains.includes(domain); // the !! means that if the domain is undefined, it will return false
  }

  defaultMessage(): string {
    return 'Please use a valid email address. Temporary email addresses are not allowed.';
  }
}

export function IsNotTempMail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotTempMailContraint,
    });
  };
}
