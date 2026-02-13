
import { emailLayout } from "../emailLayout"

export const resetPasswordTemplate = (resetUrl: string) =>  emailLayout(`
  
           
                <h2 style="margin:0; font-size:22px; color:#0F172A;">
                  Réinitialisation du mot de passe
                </h2>
             

        
              <p style="color:#334155; font-size:15px; line-height:1.6; padding:20px 0;">
                Nous avons été informés de la perte de votre mot de passe <strong>Suivi-Mp</strong>. <br/>
                 Mais ne vous en faites pas ! Vous pouvez utiliser le bouton ci-dessous pour réinitialiser votre mot de passe :
              </p>

             
            

            
             <div style="text-align:center; margin:30px 0;">
      <a href="${resetUrl}"
         style="background-color:#0F766E; color:#ffffff; padding:14px 28px;
                text-decoration:none; border-radius:6px; font-weight:600;
                display:inline-block; font-size:16px;">
        Réinitialiser mon mot de passe
      </a>
    </div>
         

         
              <p style="color:#475569; font-size:14px; text-align:center;">
                Ce lien expirera dans les  <strong>60 prochaines minutes</strong>.
              </p>
       

              <p style="padding-top:20px; font-size:12px; color:#64748B; text-align:center;">
                Si le bouton ne fonctionne pas, copiez et collez dans votre navigateur le lien suivant :<br/>
                <span style="word-break:break-all;">${resetUrl}</span>
              </p>
          

       
  `
)
