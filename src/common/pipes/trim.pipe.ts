import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(
    value: any,
    metadata: ArgumentMetadata,
  ): string | object | string[] | undefined {
    if (value === undefined) {
      return undefined;
    } else if (typeof value === 'string') {
      return value.trim();
    } else if (Array.isArray(value)) {
      // hier wird jeder string nochmal rekursiv getrimmt
      return value.map((item: any) => this.transform(item, metadata) as string);
    } else if (typeof value === 'object' && value !== null) {
      const trimmedObject: Record<string, any> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          trimmedObject[key] = this.transform(value[key], metadata);
        }
      }
      return trimmedObject;
    }
  }
}
