import { BadRequestException, Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { compileTemplate } from './mail.helper';

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendMail(
    to: string,
    subject: string,
    rawHtml: string,
    from?: string,
  ): Promise<void> {
    const html = compileTemplate('default', {
      subject,
      content: rawHtml,
      logoUrl: 'https://deine-domain.de/assets/logo.png', // <- hier dein Logo
      termsLink: 'https://deine-domain.de/nutzungsbedingungen', // Public Link
      year: new Date().getFullYear(),
    });

    const msg = {
      to,
      from: from || process.env.SYSTEM_EMAIL!,
      subject,
      html,
    };

    try {
      await sgMail.send(msg);
    } catch (err) {
      console.error('Error sending email:', err);
      throw new BadRequestException('Failed to send email', {
        cause: err,
        description: 'There was an error while trying to send the email.',
      });
    }
  }

  async sendNewsletter(
    recipients: string[],
    subject: string,
    html: string,
    from?: string,
  ) {
    const fromEmail = from || process.env.SYSTEM_EMAIL!;
    const messages = recipients.map((email) => ({
      to: email,
      from: fromEmail,
      subject,
      html,
    }));

    try {
      await sgMail.send(messages, true); // true = send as batch
      console.log(`sended ${recipients.length} newsletters.`);
    } catch (err) {
      console.error('errors while ', err);
      throw new BadRequestException('Failed to send newsletter', {
        cause: err,
      });
    }
  }
}
