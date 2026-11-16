export function createMailer(cfg, log = console) {
  return {
    async send({ to, subject, text }) {
      if (!cfg.smtp.host) {
        log.info(`[mail] SMTP is not configured. Message logged instead of sent.\nTo: ${to}\nSubject: ${subject}\n${text}`);
        return { delivered: "console" };
      }
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: cfg.smtp.host,
        port: cfg.smtp.port,
        secure: cfg.smtp.port === 465,
        auth: cfg.smtp.user ? { user: cfg.smtp.user, pass: cfg.smtp.pass } : undefined,
      });
      await transport.sendMail({
        from: cfg.smtp.from,
        to,
        subject,
        text,
      });
      return { delivered: "smtp" };
    },
  };
}
