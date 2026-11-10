import { Resend } from 'resend';
import { api } from '@/lib/api';

const resend = new Resend(process.env.RESEND_API_KEY || '');
const INTERNAL_NOTIFICATION_EMAIL = "info@nativarevestimientos.com.ar";

interface OrderDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  products: {
    name: string;
    quantity: number;
    price: number;
    originalUnitPrice?: number;
  }[];
  subtotal: number;
  discount: number;
  transferDiscount?: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  deliveryMethod?: string;
  paymentMethod: string;
  orderDate: Date;
}

type EmailTemplate = {
  subject: string;
  html: string;
};

type WelcomeEmailDetails = {
  customerName: string;
  customerEmail: string;
  siteUrl?: string;
};

const formatMoneyArs = (value: number) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatShortDate = (d: Date) => {
  try {
    return d.toLocaleDateString();
  } catch {
    return "";
  }
};

const isPickupFromDeliveryMethod = (deliveryMethod?: string) =>
  String(deliveryMethod || "").toLowerCase().includes("retiro");

const brand = () => {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "Nativa Ecommerce";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const logoUrl =
    process.env.NEXT_PUBLIC_EMAIL_LOGO_URL ||
    (siteUrl ? `${siteUrl}/favicon.ico` : "https://via.placeholder.com/80?text=Logo");
  return { brandName, siteUrl, logoUrl };
};

const emailLayoutBase = (input: {
  title: string;
  preheader: string;
  heroTitle: string;
  heroSubtitle: string;
  statusLabel?: string;
  statusTone?: "success" | "warning" | "neutral";
  bodyHtml: string;
  cta?: { label: string; href: string };
  footerNote?: string;
}): EmailTemplate => {
  const { brandName, siteUrl, logoUrl } = brand();

  const statusTone = input.statusTone || "neutral";
  const statusBg =
    statusTone === "success" ? "#EAF6EF" : statusTone === "warning" ? "#FFF4E5" : "#F3F4F6";
  const statusBorder =
    statusTone === "success" ? "#BDE5CB" : statusTone === "warning" ? "#FFD7A8" : "#E5E7EB";
  const statusText =
    statusTone === "success" ? "#0B3B1F" : statusTone === "warning" ? "#6A3B00" : "#111827";

  const preheader = escapeHtml(input.preheader);

  const ctaHtml = input.cta
    ? `
      <tr>
        <td align="center" style="padding:20px 28px 6px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" bgcolor="#111111" style="border-radius:12px;">
                <a href="${escapeHtml(input.cta.href)}"
                  style="display:inline-block; padding:14px 18px; font-family:Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:12px; letter-spacing:0.2px;">
                  ${escapeHtml(input.cta.label)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : "";

  const footerNote = input.footerNote ? escapeHtml(input.footerNote) : "Si tenés preguntas, respondé este email.";

  return {
    subject: input.title,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHtml(brandName)} · ${escapeHtml(input.title)}</title>
        </head>
        <body style="margin:0; padding:0; background:#F6F2EA;">
          <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">
            ${preheader}
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F2EA; padding:28px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
                  <tr>
                    <td style="padding:0 12px 14px 12px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0B0B0B; border-radius:16px; overflow:hidden;">
                        <tr>
                          <td style="padding:18px 18px 18px 18px;" valign="middle">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td valign="middle" style="padding-right:12px;">
                                  <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brandName)}" width="44" height="44" style="display:block; border-radius:12px;" />
                                </td>
                                <td valign="middle" style="font-family:Arial, sans-serif; color:#FFFFFF;">
                                  <div style="font-size:14px; font-weight:700; letter-spacing:0.2px;">${escapeHtml(brandName)}</div>
                                  <div style="font-size:12px; color:#D1D5DB;">Revestimientos premium</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td align="right" style="padding:18px 18px 18px 18px;">
                            ${
                              input.statusLabel
                                ? `<span style="display:inline-block; font-family:Arial, sans-serif; font-size:12px; font-weight:700; color:${statusText}; background:${statusBg}; border:1px solid ${statusBorder}; padding:6px 10px; border-radius:999px;">${escapeHtml(input.statusLabel)}</span>`
                                : ``
                            }
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 12px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF; border-radius:16px; overflow:hidden; border:1px solid #E7E1D7;">
                        <tr>
                          <td style="padding:22px 24px 10px 24px; font-family:Arial, sans-serif; color:#111827;">
                            <div style="font-size:20px; font-weight:800; letter-spacing:-0.2px; margin:0 0 6px 0;">
                              ${escapeHtml(input.heroTitle)}
                            </div>
                            <div style="font-size:13px; line-height:18px; color:#6B7280;">
                              ${escapeHtml(input.heroSubtitle)}
                            </div>
                          </td>
                        </tr>

                        ${input.bodyHtml}
                        ${ctaHtml}

                        <tr>
                          <td style="padding:14px 24px 22px 24px; font-family:Arial, sans-serif; font-size:12px; line-height:18px; color:#6B7280;">
                            <div>${footerNote}</div>
                            <div style="margin-top:10px;">
                              © ${new Date().getFullYear()} ${escapeHtml(brandName)}
                              ${siteUrl ? ` · <a href="${escapeHtml(siteUrl)}" style="color:#111111; text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>` : ``}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
};

const sectionCard = (title: string, contentHtml: string) => `
  <tr>
    <td style="padding:10px 24px 0 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #EEE7DD; border-radius:14px; background:#FFFFFF;">
        <tr>
          <td style="padding:14px 14px 10px 14px; font-family:Arial, sans-serif; font-size:12px; font-weight:800; letter-spacing:0.3px; color:#111827; text-transform:uppercase;">
            ${escapeHtml(title)}
          </td>
        </tr>
        <tr>
          <td style="padding:0 14px 14px 14px;">
            ${contentHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

const summaryBlock = (input: {
  subtotal: number;
  discount: number;
  transferDiscount: number;
  tax: number;
  shipping: number;
  isPickup: boolean;
}) => {
  const netAfterProduct = input.subtotal - (input.discount || 0);
  const totalCalc = netAfterProduct - input.transferDiscount + input.tax + input.shipping;

  const subtotalValue =
    input.discount > 0
      ? `
        <span style="color:#9CA3AF; text-decoration:line-through; margin-right:10px;">${formatMoneyArs(input.subtotal)}</span>
        <span style="color:#111827; font-weight:800;">${formatMoneyArs(netAfterProduct)}</span>
      `
      : `<span style="color:#111827; font-weight:800;">${formatMoneyArs(input.subtotal)}</span>`;

  const transferRow =
    input.transferDiscount > 0
      ? `
        <tr>
          <td style="padding:6px 0; font-family:Arial, sans-serif; font-size:13px; color:#6B7280;">Desc. transferencia</td>
          <td align="right" style="padding:6px 0; font-family:Arial, sans-serif; font-size:13px; color:#0B3B1F; font-weight:800;">-${formatMoneyArs(input.transferDiscount)}</td>
        </tr>
      `
      : "";

  const shippingLabel = input.isPickup ? "Retiro" : "Envío";
  const shippingValue = input.isPickup ? "Sin costo" : formatMoneyArs(input.shipping);

  return sectionCard(
    "Resumen",
    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:6px 0; font-family:Arial, sans-serif; font-size:13px; color:#6B7280;">Subtotal</td>
          <td align="right" style="padding:6px 0; font-family:Arial, sans-serif; font-size:13px;">${subtotalValue}</td>
        </tr>
        ${transferRow}
        <tr>
          <td style="padding:6px 0; font-family:Arial, sans-serif; font-size:13px; color:#6B7280;">Impuestos</td>
          <td align="right" style="padding:6px 0; font-family:Arial, sans-serif; font-size:13px; color:#111827; font-weight:700;">${formatMoneyArs(input.tax)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-family:Arial, sans-serif; font-size:13px; color:#6B7280;">${escapeHtml(shippingLabel)}</td>
          <td align="right" style="padding:6px 0; font-family:Arial, sans-serif; font-size:13px; color:#111827; font-weight:700;">${escapeHtml(shippingValue)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:10px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EEE7DD;">
              <tr>
                <td style="padding-top:12px; font-family:Arial, sans-serif; font-size:14px; color:#111827; font-weight:800;">Total</td>
                <td align="right" style="padding-top:12px; font-family:Arial, sans-serif; font-size:16px; color:#111827; font-weight:900;">${formatMoneyArs(totalCalc)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  );
};

const productsBlock = (products: OrderDetails["products"]) => {
  const rows = products
    .map((p) => {
      const qty = Number(p.quantity) || 0;
      const effectiveLine = (Number(p.price) || 0) * qty;
      const hasOriginal =
        typeof p.originalUnitPrice === "number" &&
        Number.isFinite(p.originalUnitPrice) &&
        p.originalUnitPrice > Number(p.price);
      const originalLine = hasOriginal ? Number(p.originalUnitPrice) * qty : null;
      const discountPercent =
        originalLine && originalLine > 0 ? Math.round(((originalLine - effectiveLine) / originalLine) * 100) : 0;

      const priceHtml =
        originalLine !== null
          ? `<span style="color:#9CA3AF; text-decoration:line-through; margin-right:10px;">${formatMoneyArs(originalLine)}</span><span style="color:#111827; font-weight:800;">${formatMoneyArs(effectiveLine)}</span>`
          : `<span style="color:#111827; font-weight:800;">${formatMoneyArs(effectiveLine)}</span>`;

      const badgeHtml =
        discountPercent > 0
          ? `<span style="display:inline-block; margin-left:10px; font-family:Arial, sans-serif; font-size:11px; font-weight:800; color:#6A3B00; background:#FFF4E5; border:1px solid #FFD7A8; padding:3px 8px; border-radius:999px;">-${discountPercent}%</span>`
          : ``;

      return `
        <tr>
          <td style="padding:12px 0; border-bottom:1px solid #F3F0EA;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:Arial, sans-serif; font-size:13px; color:#111827; font-weight:800; padding-right:10px;">
                  ${escapeHtml(p.name)}
                </td>
                <td align="right" style="font-family:Arial, sans-serif; font-size:13px; color:#6B7280; font-weight:700; white-space:nowrap;">
                  x ${escapeHtml(qty)}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:6px; font-family:Arial, sans-serif; font-size:13px;">
                  ${priceHtml}
                  ${badgeHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const table = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${rows}
    </table>
  `;

  return sectionCard("Productos", table);
};

const addressBlock = (input: {
  shippingAddress: OrderDetails["shippingAddress"];
  isPickup: boolean;
  deliveryMethod?: string;
  paymentMethod: string;
}) => {
  const { shippingAddress, isPickup, deliveryMethod, paymentMethod } = input;
  const addressTitle = isPickup ? "Dirección de retiro" : "Dirección de envío";
  const methodText = isPickup ? "Retiro en sucursal" : `Envío (${deliveryMethod || "domicilio"})`;
  const lines = [
    escapeHtml(shippingAddress.street),
    escapeHtml(
      isPickup
        ? `${shippingAddress.city} ${shippingAddress.zipCode}`.trim()
        : `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}`.trim()
    ),
    escapeHtml(shippingAddress.country),
  ]
    .filter(Boolean)
    .map((line) => `<div style="margin:0 0 4px 0; font-family:Arial, sans-serif; font-size:13px; color:#111827; font-weight:700;">${line}</div>`)
    .join("");

  const meta = `
    <div style="margin-top:10px; font-family:Arial, sans-serif; font-size:12px; color:#6B7280; line-height:18px;">
      <div><span style="font-weight:800; color:#111827;">Método:</span> ${escapeHtml(methodText)}</div>
      <div><span style="font-weight:800; color:#111827;">Pago:</span> ${escapeHtml(paymentMethod)}</div>
    </div>
  `;

  return sectionCard(addressTitle, `${lines}${meta}`);
};

const sendTransactionalEmail = async (input: {
  to: string;
  bcc?: string | string[];
  type: string;
  orderDetails?: any;
  template: EmailTemplate;
}) => {
  const from = process.env.RESEND_FROM_EMAIL || 'ventas@example.com';
  const resendApiKey = String(process.env.RESEND_API_KEY || "").trim();
  try {
    if (!resendApiKey) {
      const configError = "RESEND_API_KEY no configurada";
      console.error("❌ Configuración de email inválida", {
        type: input.type,
        to: input.to,
        bcc: input.bcc,
        from,
        error: configError,
      });
      throw new Error(configError);
    }

    console.log("📨 Preparando envío de email", {
      type: input.type,
      to: input.to,
      bcc: input.bcc,
      from,
      hasResendApiKey: true,
    });

    try {
      await api.post('/emails/log', {
        type: input.type,
        status: 'pending',
        from,
        to: input.to,
        ...(input.orderDetails ? { orderDetails: input.orderDetails } : {}),
      });
    } catch {}

    const resendResult = await resend.emails.send({
      to: input.to,
      ...(input.bcc ? { bcc: input.bcc } : {}),
      from,
      subject: input.template.subject,
      html: input.template.html,
    });

    const messageId =
      (resendResult as any)?.data?.id ||
      (resendResult as any)?.id ||
      null;

    console.log("📧 Email enviado con Resend", {
      type: input.type,
      to: input.to,
      bcc: input.bcc,
      from,
      messageId,
    });

    try {
      await api.post('/emails/log', {
        type: input.type,
        status: 'sent',
        messageId,
        to: input.to,
        ...(input.orderDetails ? { orderDetails: input.orderDetails } : {}),
      });
    } catch {}

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error("❌ Error enviando email con Resend", {
      type: input.type,
      to: input.to,
      from,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    try {
      await api.post('/emails/log', {
        type: input.type,
        status: 'error',
        ...(input.orderDetails ? { orderDetails: input.orderDetails } : {}),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch {}
    throw error;
  }
};

export const sendOrderConfirmationEmail = async (orderDetails: OrderDetails) => {
  const template = generateOrderConfirmationEmail(orderDetails);
  return sendTransactionalEmail({
    to: orderDetails.customerEmail,
    bcc: INTERNAL_NOTIFICATION_EMAIL,
    type: 'order_confirmation',
    orderDetails,
    template,
  });
};

export const generateOrderConfirmationEmail = (orderDetails: OrderDetails) => {
  const {
    orderId,
    customerName,
    products,
    subtotal,
    discount,
    tax,
    shipping,
    total,
    shippingAddress,
    deliveryMethod,
    paymentMethod,
    orderDate,
  } = orderDetails;
  const transferDiscount = Number(orderDetails.transferDiscount ?? 0);
  const isPickup = isPickupFromDeliveryMethod(deliveryMethod);
  const { siteUrl } = brand();

  const bodyHtml =
    summaryBlock({
      subtotal,
      discount,
      transferDiscount,
      tax,
      shipping: isPickup ? 0 : shipping,
      isPickup,
    }) +
    productsBlock(products) +
    addressBlock({ shippingAddress, isPickup, deliveryMethod, paymentMethod });

  return emailLayoutBase({
    title: `Confirmación de Pedido #${orderId}`,
    preheader: `Pedido confirmado · #${orderId} · ${formatShortDate(orderDate)}`,
    heroTitle: `Gracias por tu compra, ${customerName}`,
    heroSubtitle: `Tu pedido fue confirmado · #${orderId} · ${formatShortDate(orderDate)}`,
    statusLabel: "Confirmado",
    statusTone: "success",
    bodyHtml,
    cta: siteUrl ? { label: "Ver detalles del pedido", href: `${siteUrl}/orders/${orderId}` } : undefined,
  });
}; 

export const sendPendingPaymentEmail = async (orderDetails: OrderDetails) => {
  const template = generatePendingPaymentEmail(orderDetails);
  return sendTransactionalEmail({
    to: orderDetails.customerEmail,
    bcc: INTERNAL_NOTIFICATION_EMAIL,
    type: 'pending_payment',
    orderDetails,
    template,
  });
};

export const generatePendingPaymentEmail = (orderDetails: OrderDetails) => {
  const {
    orderId,
    customerName,
    products,
    subtotal,
    discount,
    tax,
    shipping,
    total,
    deliveryMethod,
    orderDate,
  } = orderDetails;
  const transferDiscount = Number(orderDetails.transferDiscount ?? 0);
  const isPickup = isPickupFromDeliveryMethod(deliveryMethod);
  const { siteUrl } = brand();

  const bodyHtml =
    summaryBlock({
      subtotal,
      discount,
      transferDiscount,
      tax,
      shipping: isPickup ? 0 : shipping,
      isPickup,
    }) +
    productsBlock(products) +
    sectionCard(
      "Estado",
      `
        <div style="font-family:Arial, sans-serif; font-size:13px; color:#111827; font-weight:700; line-height:18px;">
          Recibimos tu pedido y lo estamos validando.
        </div>
        <div style="margin-top:8px; font-family:Arial, sans-serif; font-size:12px; color:#6B7280; line-height:18px;">
          Te contactaremos apenas tengamos novedades.
        </div>
      `
    );

  return emailLayoutBase({
    title: `Pedido pendiente de aprobación #${orderId}`,
    preheader: `Pedido pendiente · #${orderId} · ${formatShortDate(orderDate)}`,
    heroTitle: `Pedido pendiente de aprobación`,
    heroSubtitle: `Hola ${customerName}, recibimos tu pedido #${orderId} · ${formatShortDate(orderDate)}`,
    statusLabel: "Pendiente",
    statusTone: "warning",
    bodyHtml,
    cta: siteUrl ? { label: "Ver mi pedido", href: `${siteUrl}/orders/${orderId}` } : undefined,
  });
};

export const generateWelcomeEmail = (details: WelcomeEmailDetails): EmailTemplate => {
  const { brandName, siteUrl } = brand();
  const targetUrl = details.siteUrl || siteUrl || "";
  const heroTitle = `Bienvenido, ${details.customerName}`;
  const heroSubtitle = `Gracias por sumarte a ${brandName}.`;

  const bodyHtml =
    sectionCard(
      "Empezar",
      `
        <div style="font-family:Arial, sans-serif; font-size:13px; color:#111827; font-weight:700; line-height:18px;">
          Ya podés explorar productos, guardar tus datos de compra y seguir el estado de tus pedidos.
        </div>
        <div style="margin-top:10px; font-family:Arial, sans-serif; font-size:12px; color:#6B7280; line-height:18px;">
          Consejo: pagando por transferencia tenés un 10% OFF adicional.
        </div>
      `
    ) +
    sectionCard(
      "Calidad Nativa",
      `
        <div style="font-family:Arial, sans-serif; font-size:12px; color:#6B7280; line-height:18px;">
          Materiales seleccionados, terminaciones premium y una experiencia de compra clara y confiable.
        </div>
      `
    );

  return emailLayoutBase({
    title: `Bienvenido a ${brandName}`,
    preheader: `Tu cuenta está lista. Descubrí nuestros productos premium.`,
    heroTitle,
    heroSubtitle,
    statusLabel: "Nuevo",
    statusTone: "neutral",
    bodyHtml,
    cta: targetUrl ? { label: "Ir a la tienda", href: `${targetUrl}/shop` } : undefined,
    footerNote: "Si no fuiste vos, podés ignorar este email.",
  });
};

export const sendWelcomeEmail = async (details: WelcomeEmailDetails) => {
  const template = generateWelcomeEmail(details);
  return sendTransactionalEmail({
    to: details.customerEmail,
    type: 'welcome',
    orderDetails: details,
    template,
  });
};
