import { BadRequestException, Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { compileTemplate } from './mail.helper';

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SEND_GRID_API!);
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
      logoUrl:
        'https://res.cloudinary.com/dk1b3zsum/image/upload/v1748296667/learn_to_grow_logo_kn9vpq.jpg', // <- hier dein Logo
      /* termsLink: 'https://deine-domain.de/nutzungsbedingungen', // Public Link */
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
    } catch (error) {
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw new BadRequestException(
        'Failed to send email',
        'There was an error while trying to send the email.',
      );
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
