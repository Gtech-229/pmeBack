import { PresenceFileData } from "types/committeeMeeting.dto"
import { CommitteeRole } from "generated/prisma/enums"

import { prisma } from "../../../lib/prisma"

const roleLabel: Record<CommitteeRole, string> = {
  president: "Président",
  vice_president: "Vice-Président",
  secretary: "Secrétaire",
  member: "Membre",
}

export const buildPresenceTemplate = async (data: PresenceFileData): Promise<string> => {
  const params = await prisma.generalParams.findFirst()

  const appName = params?.appName
  const logoUrl = params?.logoUrl ?? "https://suivi-mp.com/icon1.png"

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
    color: #1e293b;
    padding: 40px;
    font-size: 13px;
    background: #ffffff;
  }

  /* HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #0f766e;
    padding-bottom: 16px;
    margin-bottom: 28px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .logo {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    object-fit: cover;
  }

  .app-name {
    font-size: 11px;
    font-weight: 700;
    color: #0f766e;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .committee-name {
    font-size: 18px;
    font-weight: 700;
  }

  .campaign {
    font-size: 12px;
    color: #64748b;
  }

  .badge {
    background: #0f766e;
    color: white;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
  }

  /* CARD */
  .card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 20px;
    background: #f8fafc;
    margin-bottom: 28px;
  }

  .meeting-title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .meta {
    font-size: 12px;
    color: #475569;
    line-height: 1.8;
  }

  /* SECTION */
  .section-title {
    font-size: 12px;
    font-weight: 700;
    color: #0f766e;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* TABLE */
  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    background: #f1f5f9;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 12px;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
  }

  tr:hover td {
    background: #f8fafc;
  }

  .role {
    background: #e6fffa;
    color: #065f46;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    display: inline-block;
  }

  .signature-cell {
    height: 36px;
  }

  /* SIGNATURE */
  .signature-block {
    margin-top: 60px;
    display: flex;
    justify-content: flex-end;
  }

  .signature-box {
    width: 220px;
    text-align: center;
  }

  .signature-line {
    margin-top: 60px;
    border-top: 1px solid #0f766e;
    padding-top: 6px;
    font-size: 11px;
    color: #64748b;
  }

  /* FOOTER */
  .footer {
    margin-top: 50px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    font-size: 10px;
    color: #94a3b8;
    text-align: center;
  }

</style>
</head>

<body>

<!-- HEADER -->
<div class="header">
  <div class="header-left">
    <img src="${logoUrl}" class="logo"/>
    <div>
      <div class="app-name">${appName ?? ''}</div>
      <div class="committee-name">${data.meetingData.committee.name}</div>
      <div class="campaign">${data.meetingData.committee.campaign.name}</div>
    </div>
  </div>

  <div style="text-align:right;">
    <div class="badge">Liste de présence</div>
    <div style="font-size:11px; color:#64748b; margin-top:6px;">
     Généré ce : ${new Date().toLocaleDateString('fr-FR')}
    </div>
  </div>
</div>

<!-- MEETING CARD -->
<div class="card">
  <div class="meeting-title">
    Réunion du ${new Date(data.meetingData.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
  </div>

  <div class="meta">
    <strong>Horaires :</strong>
    ${new Date(data.meetingData.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
    → 
    ${new Date(data.meetingData.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
    <br/>
    <strong>Lieu :</strong> ${data.meetingData.location}
  </div>
</div>

<!-- TABLE -->
<div>
  <div class="section-title">
    Membres présents (${data.presentMembers.length})
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Nom complet</th>
        <th>Rôle</th>
        <th>Signature</th>
      </tr>
    </thead>
    <tbody>
      ${data.presentMembers.map((m, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${m.firstName} ${m.lastName}</strong></td>
          <td><span class="role">${roleLabel[m.role]}</span></td>
          <td class="signature-cell"></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>

<!-- SIGNATURE -->
<div class="signature-block">
  <div class="signature-box">
    <div class="signature-line">
      Le Secrétaire
    </div>
  </div>
</div>

<!-- FOOTER -->
<div class="footer">
  ${appName ?? ''} — ${data.meetingData.committee.campaign.name} — Document officiel généré automatiquement
</div>

</body>
</html>
`
}