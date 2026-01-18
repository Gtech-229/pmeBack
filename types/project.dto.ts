import { ProjectStatus } from "../types"  

export type CreateSubStepDTO = {
  name: string
  description?: string
  dueDate?: string  // ISO string
  remarks?: string
  state?: "pending" | "in_progress" | "validated" | "failed"
}

export type UpdateSubStepDTO = {
  id : string
  name?: string
  description?: string
  state?: "pending" | "in_progress" | "validated" | "failed"
  dueDate?: string
  completedAt?: string
  remarks?: string
}

export type CreateProjectDTO = {
  title: string
  description: string
  requestedAmount: number
  
}

export type UpdateProjectDTO = {
  
  title?: string
  description?: string
  status?: ProjectStatus
  requestedAmount?: number
  fundedAmount?: number
  fundDisbursementDates?: string[]   // ISO strings
  validatedAt?: string
  validatedBy?: { id: string; firstName?: string; lastName?: string; role: string }[]
   subSteps?: {
    create?: CreateSubStepDTO[]
    update?: UpdateSubStepDTO[]
  }
}
