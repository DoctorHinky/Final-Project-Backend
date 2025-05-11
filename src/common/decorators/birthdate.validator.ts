import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class BirthdateValidator implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' && !(value instanceof Date)) return false;

    const birthdate = value instanceof Date ? value : new Date(value);
    if (isNaN(birthdate.getTime())) return false;

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 9);
    const minDate = new Date('1900-01-01');

    return birthdate <= maxDate && birthdate >= minDate;
  }

  defaultMessage(): string {
    const today = new Date().toISOString().split('T')[0];
    return `Birthdate must be between 1900-01-01 and ${today}`;
  }
}

export function IsValidBirthdate() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidBirthdate',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `Birthdate must be between 1900-01-01 and ${new Date().toISOString().split('T')[0]}`,
      },
      constraints: [],
      validator: BirthdateValidator,
    });
  };
}
