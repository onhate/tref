/**
 * Email template helpers for common email types
 */

export interface WelcomeEmailData {
  userName: string;
  loginUrl: string;
}

export function welcomeEmailTemplate(data: WelcomeEmailData) {
  return {
    subject: 'Bem-vindo(a)',
    body: {
      text: `Bem-vindo(a) ${data.userName}!\n\nObrigado por se juntar à nós. Você pode acessar sua conta em: ${data.loginUrl}\n\nAtenciosamente`,
      html: `
        <h1>Bem-vindo(a) ${data.userName}!</h1>
        <p>Obrigado por se juntar a nós.</p>
        <p><a href="${data.loginUrl}">Clique aqui para acessar sua conta</a></p>
        <p>Atenciosamente</p>
      `
    }
  };
}

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiryMinutes?: number;
}

export function passwordResetEmailTemplate(data: PasswordResetEmailData) {
  const expiryText = data.expiryMinutes
    ? ` Este link expirará em ${data.expiryMinutes} minutos.`
    : '';

  return {
    subject: 'Redefinir sua senha',
    body: {
      text: `Olá ${data.userName},\n\nVocê solicitou a redefinição de sua senha. Clique no link abaixo para redefini-la:\n\n${data.resetUrl}\n\n${expiryText}\n\nSe você não solicitou isso, por favor ignore este e-mail.\n\nAtenciosamente`,
      html: `
        <h1>Redefinir sua senha</h1>
        <p>Olá ${data.userName},</p>
        <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para redefini-la:</p>
        <p><a href="${data.resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir senha</a></p>
        <p>${expiryText}</p>
        <p>Se você não solicitou isso, por favor ignore este e-mail.</p>
        <p>Atenciosamente</p>
      `
    }
  };
}

export interface EmailVerificationData {
  userName: string;
  verificationUrl: string;
}

export function emailVerificationTemplate(data: EmailVerificationData) {
  return {
    subject: 'Verifique seu e-mail',
    body: {
      text: `Olá ${data.userName},\n\nPor favor, verifique seu endereço de e-mail clicando no link abaixo:\n\n${data.verificationUrl}\n\nAtenciosamente`,
      html: `
        <h1>Verifique seu e-mail</h1>
        <p>Olá ${data.userName},</p>
        <p>Por favor, verifique seu endereço de e-mail clicando no botão abaixo:</p>
        <p><a href="${data.verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar e-mail</a></p>
        <p>Atenciosamente</p>
      `
    }
  };
}

