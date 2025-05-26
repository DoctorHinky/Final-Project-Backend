import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

export function compileTemplate(templateName: string, data: any): string {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
  const source = fs.readFileSync(templatePath, 'utf8');
  const template = Handlebars.compile(source);
  return template(data);
}
