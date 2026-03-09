"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stepNotValidatedMessage = void 0;
const emailLayout_1 = require("../emailLayout");
const stepNotValidatedMessage = (projectName, stepName, reviewDate) => (0, emailLayout_1.emailLayout)(`

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

    

`);
exports.stepNotValidatedMessage = stepNotValidatedMessage;
//# sourceMappingURL=stepNotValidated.message.js.map