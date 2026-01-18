// dto/meeting.dto.ts
import { MeetingStatus } from "../generated/prisma/enums"

export interface UpdateMeetingDTO {
  date: string          // ISO
  startTime: string     // "09:00"
  endTime: string       // "11:30"
  location: string
  status?: MeetingStatus
}


