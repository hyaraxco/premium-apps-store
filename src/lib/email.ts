import { Resend } from "resend";
import { formatIDR } from "./format";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail = process.env.RESEND_FROM || "onboarding@resend.dev";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendOrderConfirmationEmail({
  orderId,
  buyerName,
  buyerEmail,
  totalIDR,
  paymentMethod,
  items,
}: {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  totalIDR: number;
  paymentMethod: string;
  items: { productName: string; variantLabel: string; qty: number; subtotalIDR: number }[];
}) {
  if (!resend) {
    console.log(`[Email Mock] Order Confirmed: ${orderId} for ${buyerEmail}`);
    return { success: true, mock: true };
  }

  const methodLabel = paymentMethod.toUpperCase();
  const orderUrl = `${appUrl}/order/${orderId}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917; padding: 20px; border: 1px solid #e7e0d6; border-radius: 8px;">
      <h2 style="margin-top: 0; color: #1c1917;">Pesanan Diterima: ${orderId}</h2>
      <p>Halo <strong>${buyerName}</strong>,</p>
      <p>Terima kasih telah memesan di Hyarax Apps! Pesanan Anda telah tercatat dan menunggu pembayaran.</p>
      
      <div style="background-color: #faf8f5; border: 1px solid #e7e0d6; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #78716c;">Ringkasan Pesanan</h3>
        <ul style="padding-left: 20px; margin-bottom: 16px;">
          ${items
            .map(
              (i) =>
                `<li><strong>${i.productName}</strong> (${i.variantLabel}) x${i.qty} — ${formatIDR(i.subtotalIDR)}</li>`
            )
            .join("")}
        </ul>
        <p style="margin-bottom: 0; font-size: 16px;"><strong>Total Pembayaran: ${formatIDR(totalIDR)}</strong></p>
        <p style="margin-top: 4px; font-size: 14px; color: #78716c;">Metode: ${methodLabel}</p>
      </div>

      <p>Silakan selesaikan pembayaran dan cek status pesanan Anda melalui tautan di bawah ini:</p>
      <p><a href="${orderUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 500;">Cek Status Pesanan</a></p>

      <hr style="border: none; border-top: 1px solid #e7e0d6; margin: 24px 0;" />
      <p style="font-size: 12px; color: #78716c;">Stackbay Digital Storefront · Support 09–21 WIB</p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: `Hyarax Apps <${fromEmail}>`,
      to: buyerEmail,
      subject: `[Hyarax Apps] Pesanan Diterima ${orderId}`,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Resend Email Error:", error);
    return { success: false, error };
  }
}

export async function sendFulfillmentEmail({
  orderId,
  buyerName,
  buyerEmail,
  fulfillmentType,
  inviteLink,
  username,
  password,
  notes,
}: {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  fulfillmentType: string;
  inviteLink?: string;
  username?: string;
  password?: string;
  notes?: string;
}) {
  if (!resend) {
    console.log(`[Email Mock] Fulfillment Sent: ${orderId} for ${buyerEmail}`);
    return { success: true, mock: true };
  }

  const orderUrl = `${appUrl}/order/${orderId}`;
  let accessHtml = "";

  if (fulfillmentType === "invite" && inviteLink) {
    accessHtml = `
      <p style="font-size: 15px;">Silakan klik tautan undang (Invite Link) di bawah ini untuk mengaktifkan lisensi pada akun Anda:</p>
      <p><a href="${inviteLink}" style="display: inline-block; background-color: #0078D4; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: 600;">Klik Untuk Aktivasi Lisensi</a></p>
      <p style="font-size: 12px; color: #78716c;">Atau salin link: ${inviteLink}</p>
    `;
  } else if (username && password) {
    accessHtml = `
      <p style="font-size: 15px;">Gunakan data akses akun di bawah ini untuk masuk ke aplikasi:</p>
      <div style="background-color: #faf8f5; border: 1px solid #e7e0d6; border-radius: 6px; padding: 16px; font-family: monospace; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Username / Email:</strong> ${username}</p>
        <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
      </div>
    `;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917; padding: 20px; border: 1px solid #e7e0d6; border-radius: 8px;">
      <h2 style="margin-top: 0; color: #10A37F;">Lisensi Siap Digunakan! (${orderId})</h2>
      <p>Halo <strong>${buyerName}</strong>,</p>
      <p>Pembayaran Anda untuk pesanan <strong>${orderId}</strong> telah terverifikasi dan akses lisensi digital Anda telah disiapkan.</p>
      
      ${accessHtml}

      ${notes ? `<p style="background-color: #fffbe6; border: 1px solid #ffe58f; padding: 12px; border-radius: 6px; font-size: 13px;"><strong>Catatan Tambahan:</strong> ${notes}</p>` : ""}

      <hr style="border: none; border-top: 1px solid #e7e0d6; margin: 24px 0;" />
      <p style="font-size: 13px;">Jika butuh bantuan atau klaim garansi, silakan hubungi customer support melalui tombol WhatsApp di web atau halaman status order Anda: <a href="${orderUrl}">${orderUrl}</a></p>
      <p style="font-size: 12px; color: #78716c;">Stackbay Digital Storefront</p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: `Hyarax Apps <${fromEmail}>`,
      to: buyerEmail,
      subject: `[Hyarax Apps] Akses Lisensi Anda Siap (${orderId})`,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Resend Fulfillment Email Error:", error);
    return { success: false, error };
  }
}
