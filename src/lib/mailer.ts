import { Resend } from "resend";

import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.email,
    subject: "Redefina sua senha",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0b2a57; line-height: 1.6;">
        <h1 style="margin-bottom: 16px;">Recuperação de senha</h1>
        <p>Olá, ${input.name}.</p>
        <p>Recebemos uma solicitação para redefinir a sua senha.</p>
        <p>
          <a
            href="${input.resetUrl}"
            style="display:inline-block;padding:12px 18px;border-radius:10px;background:#00b6e6;color:#ffffff;text-decoration:none;font-weight:700;"
          >
            Redefinir senha
          </a>
        </p>
        <p>Se você não solicitou esta alteração, pode ignorar este e-mail.</p>
        <p>O link expira em 30 minutos.</p>
      </div>
    `
  });
}
