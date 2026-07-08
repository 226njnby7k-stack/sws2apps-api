import path from 'path';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer/index.js';
import SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import hbs, {
  NodemailerExpressHandlebarsOptions,
} from 'nodemailer-express-handlebars';
import { LogLevel } from '@logtail/types';
import { logger } from '../services/logger/logger.js';

const MAIL_ENABLED = process.env.MAIL_ENABLED === 'true';
const MAIL_ADDRESS = process.env.MAIL_ADDRESS!;
const MAIL_SENDER_NAME =
  process.env.MAIL_SENDER_NAME! + ' <' + MAIL_ADDRESS + '>';
const MAIL_PASSWORD = process.env.MAIL_PASSWORD!;
const MAIL_HOST = process.env.MAIL_HOST;
const MAIL_PORT = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587;

// NO Google fallback (PROJECT.md §2 / M6): when mail is enabled, an explicit SMTP
// host is REQUIRED. Fail loudly at boot — exactly like SEC_ENCRYPT_KEY — rather
// than silently routing login emails through Gmail's servers. When mail is
// disabled the transport is built but never used (sends are gated on MAIL_ENABLED).
if (MAIL_ENABLED && !MAIL_HOST) {
  throw new Error('MAIL_ENABLED=true requires MAIL_HOST (your SMTP server); there is no Gmail default. See .env.example.');
}

const handlebarsOptions: NodemailerExpressHandlebarsOptions = {
  viewEngine: {
    partialsDir: path.resolve('./src/v3/views/'),
    defaultLayout: false,
  },
  viewPath: path.resolve('./src/v3/views/'),
};

// Generic SMTP against any provider — no hardcoded service preset.
const transportOptions: SMTPTransport.Options = {
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: MAIL_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
  auth: { user: MAIL_ADDRESS, pass: MAIL_PASSWORD },
};

const transporter = nodemailer.createTransport(transportOptions, {
  from: MAIL_SENDER_NAME,
  replyTo: 'support@organized-app.com',
});

transporter.use('compile', hbs(handlebarsOptions));

export const MailClient = {
  sendEmail: async (options: Mail.Options, successText: string) => {
    const intTry = 5;
    let i = 0;
    let retry: boolean;

    do {
      const send = async () => {
        return new Promise((resolve) => {
          return transporter.sendMail(options, (error) => {
            if (error) {
              logger(
                LogLevel.Warn,
                `failed to send message: ${error.message}. trying again ...`,
                {
                  service: 'mail_client',
                  transport_status: 'failed',
                },
              );
              return resolve(false);
            }

            logger(LogLevel.Info, successText, {
              service: 'mail_client',
              transport_status: 'success',
            });
            return resolve(true);
          });
        });
      };

      const runSend = await send();
      retry = !runSend;
      i++;
    } while (i < intTry && retry);

    return !retry;
  },
};
