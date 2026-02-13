import { emailLayout } from "../emailLayout";
type Props = {
    userName : string | null
    code : string
    expiresAt : Date
}

export const accountValidationTemplate = ({userName, code , expiresAt}: Props) => emailLayout(
    `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">

      <p style="font-size: 22px; font-weight: 500;">
        Salut ${userName || ""},
      </p>

      <p style="font-size: 18px;">
        Veuillez utiliser le code ci-dessous  vérifier votre adresse e-mail en vue de commencer
à collaborer avec les administrateurs de  <strong>PME</strong>.
      </p>

      <p style="font-size: 26px; font-weight: bold; color: #002E3C; letter-spacing: 4px;">
        ${code}
      </p>

      <p style="font-size: 16px;">
        Ce code expirera dans <strong>3 minutes</strong>, à
        <span style="color: #002E3C; font-weight: 500;">
          ${expiresAt.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>.
      </p>

    

      <p style="font-size: 14px; color: #9c9292;">
        Si vous n'êtes pas à l'origine de ce code ou  si vous avez déjà vérifié votre compte, veuillez ignorer ce courriel.
Ou contactez le support Suivi-Mp si vous avez des questions.
      </p>


    </div>
    `
)