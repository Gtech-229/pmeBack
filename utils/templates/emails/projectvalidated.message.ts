import { emailLayout } from "../emailLayout";


export const newStepValidatedMessage = (
  projectName: string,
  stepName: string,
  validationDate: string
) => emailLayout(`
  
    <h2 style="margin:0; font-size:22px; color:#0F172A;">
      Nouvelle étape validée 
    </h2>

    <p style="color:#334155; font-size:15px; line-height:1.6; padding:20px 0;">
      Nous avons le plaisir de vous informer que votre projet 
      <strong>${projectName}</strong> a franchi une nouvelle étape : <strong>${stepName}<stong/> ce ${validationDate}.
    </p>


    <p style="color:#334155; font-size:15px; line-height:1.6;">
      Cette progression témoigne de l’avancement conforme aux objectifs définis . Nous poursuivons maintenant les prochaines phases 
      conformément au planning établi.
    </p>

   

`)
