/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(
    value: any,
    metadata: ArgumentMetadata,
  ): string | object | string[] | undefined | number | boolean | null {
    if (value === undefined) return undefined;

    if (typeof value === 'string') {
      const sanitized = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: 'discard',
        selfClosing: [],
        exclusiveFilter: (frame) => {
          // Entferne leere HTML-Blöcke
          return !frame.text.trim().length;
        },
      });
      const trimmed = sanitized.trim();

      return trimmed.length > 0 ? trimmed : undefined;
    } else if (Array.isArray(value)) {
      // hier wird jeder string nochmal rekursiv getrimmt
      return value.map((item: any) => this.transform(item, metadata));
    } else if (typeof value === 'object' && value !== null) {
      const trimmedObject: Record<string, any> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          trimmedObject[key] = this.transform(value[key], metadata);
        }
      }
      return trimmedObject;
    } else {
      return value;
    }
  }
}
