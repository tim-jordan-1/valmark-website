export function confirmationHtml(name: string): string {
  const firstName = name.split(' ')[0];
  return `
    <div style="font-family:'Roboto',Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
      <div style="background:#03334D;padding:24px 32px">
        <h1 style="color:#fff;font-size:20px;margin:0">Valmark Waterproofing</h1>
      </div>
      <div style="padding:24px 32px;border:1px solid #e0e0e0;border-top:none">
        <p style="font-size:16px;line-height:1.6">
          Hi ${escapeHtml(firstName)},
        </p>
        <p style="font-size:16px;line-height:1.6">
          Thanks for getting in touch. We've received your inquiry and a technician
          will call you back within one business hour.
        </p>
        <p style="font-size:16px;line-height:1.6">
          If your matter is urgent, call us directly on
          <a href="tel:0422878034" style="color:#1C9DD8;font-weight:700">0422 878 034</a>.
        </p>
        <p style="font-size:16px;line-height:1.6;margin-top:24px">
          Kind regards,<br>
          The Valmark Team
        </p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
        <p style="font-size:12px;color:#888">
          Valmark Waterproofing · Melbourne, Victoria<br>
          <a href="mailto:admin@valmark.com.au" style="color:#888">admin@valmark.com.au</a>
        </p>
      </div>
    </div>
  `;
}

export function confirmationText(name: string): string {
  const firstName = name.split(' ')[0];
  return [
    `Hi ${firstName},`,
    ``,
    `Thanks for getting in touch. We've received your inquiry and a technician will call you back within one business hour.`,
    ``,
    `If your matter is urgent, call us directly on 0422 878 034.`,
    ``,
    `Kind regards,`,
    `The Valmark Team`,
    ``,
    `Valmark Waterproofing · Melbourne, Victoria`,
    `admin@valmark.com.au`,
  ].join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
