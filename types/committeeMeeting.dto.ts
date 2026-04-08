import { CommitteeRole } from "generated/prisma/enums"

export interface PresenceFileData {
  presentMembers: {
    id: string
    role: CommitteeRole
    firstName: string | null
    lastName: string | null
  }[]
  meetingData: CommitteeMeetingDTO
}


export interface CommitteeMeetingDTO {
  id: string
  date: Date        // was string
  startTime: Date   // was string
  endTime: Date     // was string
  location: string

  committee: CommitteeDetailsDto
}

export interface CommitteeDetailsDto {
  id: string
  name: string
  campaignId: string
  description: string | null
  createdAt: Date
  updatedAt: Date
 
  campaign: CampaignDTO
}

export interface CampaignDTO {
  id: string
  name: string
  description: string
  start_date: Date
  end_date: Date
  committees?: CommitteeDetailsDto[]
  isNational: Boolean
  targetCountry?: string | null
  targetProjects?: number | null

}