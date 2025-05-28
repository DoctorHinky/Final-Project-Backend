import { BadRequestException, Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { compileTemplate } from './mail.helper';
import { EMAIL_TEMPLATES, BaseEmailData } from './email.types';

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
    } catch (error) {
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw new BadRequestException(
        'Failed to send email',
        'There was an error while trying to send the email.',
      );
    }
  }

  // Neue generische Methode für Template-basierte E-Mails
  async sendTemplatedEmail<T extends BaseEmailData>(
    to: string,
    templateKey: keyof typeof EMAIL_TEMPLATES,
    data: T,
    from?: string,
  ): Promise<void> {
    const config = EMAIL_TEMPLATES[templateKey];

    // Kompiliere das spezifische Template
    const contentHtml = compileTemplate(config.templateName, data);

    // Wrppe es in das Standard-Layout
    const html = compileTemplate('default', {
      subject: config.subject,
      content: contentHtml,
      logoUrl:
        'https://res.cloudinary.com/dk1b3zsum/image/upload/v1748296667/learn_to_grow_logo_kn9vpq.jpg',
      termsLink: process.env.TERMS_OF_USE_URL || '#',
      year: new Date().getFullYear(),
    });

    const msg = {
      to,
      from: from || process.env.SYSTEM_EMAIL!,
      subject: config.subject,
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

  // Spezifische Methoden für bessere Developer Experience
  async sendApplicationAcceptedEmail(
    to: string,
    data: { firstname: string; lastname: string },
    from?: string,
  ): Promise<void> {
    return this.sendTemplatedEmail(
      to,
      'APPLICATION_ACCEPTED',
      {
        ...data,
        termsOfUseUrl: process.env.TERMS_OF_USE_URL || '#',
      },
      from,
    );
  }

  async sendApplicationRejectedEmail(
    to: string,
    data: { firstname: string; reason: string },
    from?: string,
  ): Promise<void> {
    return this.sendTemplatedEmail(to, 'APPLICATION_REJECTED', data, from);
  }

  async sendBlockingFromApplicationEmail(
    to: string,
    data: { firstname: string; reason: string },
    from?: string,
  ): Promise<void> {
    return this.sendTemplatedEmail(to, 'BLOCKING_USER', data, from);
  }

  async sendUnblockingFromApplicationEmail(
    to: string,
    data: { firstname: string },
    from?: string,
  ): Promise<void> {
    return this.sendTemplatedEmail(to, 'UNBLOCKING_USER', data, from);
  }

  async sendEmailVerification(
    to: string,
    data: { verificationLink: string },
    from?: string,
  ): Promise<void> {
    return this.sendTemplatedEmail(to, 'EMAIL_VERIFICATION', data, from);
  }

  async sendPasswordResetEmail(
    to: string,
    data: { username: string; resetLink: string },
    from?: string,
  ): Promise<void> {
    return this.sendTemplatedEmail(to, 'PASSWORD_RESET', data, from);
  }

  // create mods

  async sendMakeModsEmail(
    to: string,
    data: { username: string; role: string; systemmail: string },
    from?: string,
  ): Promise<void> {
    return this.sendTemplatedEmail(to, 'MAKE_MODS', data, from);
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
