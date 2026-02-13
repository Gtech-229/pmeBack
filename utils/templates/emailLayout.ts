export const emailLayout = (content: string) => `
  <div style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 20px;">

          <!-- Card -->
          <table width="100%" style="max-width:600px; background:#ffffff; border-radius:10px; padding:40px 30px;">

            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:25px;">
                <img src="https://suivi-mp.com/icon1.png" alt="Suivi-MP"
                     style="max-width:160px; height:auto; display:block;" />
              </td>
            </tr>

            <!-- Dynamic Content -->
            <tr>
              <td>
                ${content}
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:30px 0 10px 0;">
                <hr style="border:none; border-top:1px solid #e2e8f0;">
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="font-size:12px; color:#94A3B8; text-align:center; line-height:1.5;">
                © ${new Date().getFullYear()} Suivi-MP<br/>
                Plateforme de financement et de suivi de projets
              </td>
            </tr>

          </table>
          <!-- End Card -->

        </td>
      </tr>
    </table>
  </div>
`
