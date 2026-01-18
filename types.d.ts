export type Role = "SUPER_ADMIN" | "ADMIN" | "PME" | "FINANCIER"
import { Request } from "express"
export type User = {
  id: string

  // Identité
  email: string
  passwordHash: string
  firstName?: string
  lastName?: string

  // Rôle & permissions
  role: Role
  isActive: boolean

  // Sécurité
  lastLoginAt?: Date | null
  failedLogins: number
  isLocked: boolean

  // Audit
  createdAt: Date
  updatedAt: Date
}


export interface JWTPayLoads {
  id : string,
  role : Role
}


export interface AuthRequest extends Request {
  user ? : {
    id : string,
    role : Role
  }
}

export interface RefreshRequest extends Request {
  userId?: string
}



export type ProjectStatus =
  | "pending"      // en attente de validation initiale
  | "approved"     // projet approuvé pour financement
  | "rejected"     // projet refusé
  | "funded"       // fonds débloqués
  | "completed"    // projet terminé avec succès
  | "failed";      // projet échoué ou collaboration rompue

export type ProjectSubStepState = "pending" | "in_progress" | "validated" | "failed";

export type UserSummary = {
  id: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "super-admin" | "financier";
};

export type ProjectSubStep = {
  id: string;
  name: string;             // nom de la sous-étape, ex: "Justification tranche 1"
  description?: string;
  state: ProjectSubStepState;
  dueDate?: Date;           // date limite pour réaliser la sous-étape
  completedAt?: Date;       // date de validation
  validatedBy?: UserSummary[]; // admins/financeurs ayant validé cette sous-étape
  remarks?: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  pmeId: string;            // l'ID de la PME qui soumet le projet
  submissionDate: Date;
  status: ProjectStatus;    // état global du projet
  requestedAmount: number;  // montant total demandé
  fundedAmount?: number;    // montant déjà débloqué
  fundDisbursementDates?: Date[]; // dates des tranches de fonds débloquées
  validatedAt?: Date;       // date de validation finale par l'ensemble des responsables
  validatedBy?: UserSummary[]; // administrateurs ou financeurs ayant validé le projet
  subSteps: ProjectSubStep[];   // suivi des sous-étapes après mise à disposition des fonds
  createdAt: Date;
  updatedAt: Date;
};
