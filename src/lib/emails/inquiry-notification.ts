export interface InquiryData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  source: 'lead-form' | 'contact-form';
  timestamp: string;
}

export function inquiryNotificationHtml(data: InquiryData): string {
  return `
    <div style="font-family:'Roboto',Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
      <div style="background:#03334D;padding:24px 32px">
        <h1 style="color:#fff;font-size:20px;margin:0">New Inquiry — Valmark Waterproofing</h1>
      </div>
      <div style="padding:24px 32px;border:1px solid #e0e0e0;border-top:none">
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr>
            <td style="padding:10px 0;font-weight:700;width:120px;vertical-align:top">Name</td>
            <td style="padding:10px 0">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;vertical-align:top">Email</td>
            <td style="padding:10px 0"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;vertical-align:top">Phone</td>
            <td style="padding:10px 0"><a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;vertical-align:top">Service</td>
            <td style="padding:10px 0">${escapeHtml(data.service)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;vertical-align:top">Message</td>
            <td style="padding:10px 0">${escapeHtml(data.message)}</td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0">
        <p style="font-size:13px;color:#888">
          Source: ${data.source === 'lead-form' ? 'Home page quick enquiry' : 'Contact page form'}<br>
          Received: ${data.timestamp}
        </p>
      </div>
    </div>
  `;
}

export function inquiryNotificationText(data: InquiryData): string {
  return [
    `New Inquiry — Valmark Waterproofing`,
    ``,
    `Name:    ${data.name}`,
    `Email:   ${data.email}`,
    `Phone:   ${data.phone}`,
    `Service: ${data.service}`,
    `Message: ${data.message}`,
    ``,
    `Source: ${data.source === 'lead-form' ? 'Home page quick enquiry' : 'Contact page form'}`,
    `Received: ${data.timestamp}`,
  ].join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
