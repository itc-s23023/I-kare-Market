import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  const { subject, message, sender } = await request.json();

  if (!subject || !message) {
    return NextResponse.json({ error: '件名と内容は必須です' }, { status: 400 });
  }
  // senderは空でもOK（未ログイン時）

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject,
      text: `送信者: ${sender || '未ログイン'}\n件名: ${subject}\n内容: ${message}`,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '送信に失敗しました', detail: error }, { status: 500 });
  }
}
