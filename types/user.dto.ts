import {Role} from '../types'

export type CreateUserDTO = {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: Role
}

export type UpdateUserDTO = {
  email?: string
  firstName?: string
  lastName?: string
  role?: Role
  isActive?: boolean
}




