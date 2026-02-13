import { emailLayout } from "../emailLayout"

export const stepNotValidatedMessage = (
  projectName: string,
  stepName: string,
  reviewDate: string,
  
) => emailLayout(`

    <h2 style="margin:0; font-size:22px; color:#0F172A;">
      Étape non validée
    </h2>

    <p style="color:#334155; font-size:15px; line-height:1.6; padding:20px 0;">
       Après analyse, nous vous informons ce ${reviewDate}, que votre projet <strong>${projectName}</strong> n'a pas pu passer l'étape <strong>${stepName}</strong> de sa progression
    
    </p>


    <p style="color:#334155; font-size:15px; line-height:1.6;">
      Vous verrez plus de détails concernant les recommandations ou note du comité dans votre espace personnel . Nous vous invitons à apporter les ajustements nécessaires afin de permettre 
      une nouvelle soumission pour validation.
    </p>

    

`)
