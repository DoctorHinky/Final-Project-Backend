import { BadRequestException, Injectable } from '@nestjs/common';
import { compileTemplate } from './mail.helper';
import { EMAIL_TEMPLATES, BaseEmailData } from './email.types';
import { MailerSend, EmailParams, Recipient } from 'mailersend';

@Injectable()
export class MailService {
  private mailerSend: MailerSend;
  constructor() {
    this.mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || '',
    });
  }

  private async sendViaMailerSend(
    to: string,
    subject: string,
    html: string,
    from?: string,
  ): Promise<void> {
    const recipients = [new Recipient(to, '')];
    const senderEmail = from || process.env.SYSTEM_EMAIL!;
    const sender = { email: senderEmail, name: '' }; // Optionally set a name
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    try {
      await this.mailerSend.email.send(emailParams);
    } catch (error) {
      console.error('Full error object:', error);
      throw new BadRequestException(
        'Failed to send email',
        'There was an error while trying to send the email.',
      );
    }
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

    try {
      await this.sendViaMailerSend(to, subject, html, from);
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

    try {
      await this.sendViaMailerSend(to, config.subject, html, from);
      console.log(`Email sent to ${to} with`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error('Full error object:', error?.response?.body || error);
      throw new BadRequestException('Failed to send email', {
        cause: error,
        description: 'There was an error while trying to send the email.',
      });
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

  async sendFeedbackAnswer(
    to: string,
    data: { username: string; firstname: string; content: string },
    from?: string,
  ) {
    return this.sendTemplatedEmail(to, 'ANSWER_FEEDBACK', data, from);
  }

  async sendNewsletter(
    recipients: string[],
    subject: string,
    html: string,
    from?: string,
  ) {
    const fromEmail = from || process.env.SYSTEM_EMAIL!;

    try {
      for (const recipient of recipients) {
        try {
          await this.sendViaMailerSend(recipient, subject, html, fromEmail);
        } catch (error) {
          console.error(`Failed to send newsletter to ${recipient}:`, error);
        }
      }
      console.log(`sended ${recipients.length} newsletters.`);
    } catch (err) {
      console.error('errors while ', err);
      throw new BadRequestException('Failed to send newsletter', {
        cause: err,
      });
    }
  }
}
