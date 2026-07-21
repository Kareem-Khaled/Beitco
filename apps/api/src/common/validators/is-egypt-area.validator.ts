import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidArea } from '@beitoon/shared';

// Validates that an `area` string is a known Egyptian governorate (optionally
// "محافظة · منطقة"), using the SAME list the web app offers (@beitoon/shared) so
// the two can never drift. Empty is allowed  -  callers add @IsNotEmpty separately
// if the field is required.
export function IsEgyptArea(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEgyptArea',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidArea(value);
        },
        defaultMessage() {
          return 'المحافظة مش معروفة  -  اختار محافظة مصرية صحيحة.';
        },
      },
    });
  };
}
