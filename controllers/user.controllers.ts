import asyncHandler from "express-async-handler"
import { prisma } from "../lib/prisma"
import { Request, Response } from "express"
import {createUserSchema, updateUserSchema, roleEnum, createAdminUserSchema} from '../schemas/user.schemas'
import { comparePassword, hashPassword } from "../utils/password"
import { AuthRequest, Role } from "../types"
import { UpdateUserDTO } from "../types/user.dto"
import { generateRefreshToken, generateToken } from "../utils/auth"
import { Prisma } from "../generated/prisma/client"
/**
 * @desc CREATE user
 * @route POST /api/users
 * @access Private
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  
  // Zod validation
  const data = createUserSchema.parse(req.body)

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email}
  })

  if (existingUser) {
    res.status(409)
    throw new Error("Il semblerait que vous ayez déjà un compte; Connectez-vous")
  }

  const passwordHash = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      email: data.email ,
      passwordHash,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      role: data.role ?? "PME"
    
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true
    }
  })

  const token = generateToken({id : user.id, role : user.role});

  const refreshTkn = generateRefreshToken(user.id);
  const hashedToken = await hashPassword(refreshTkn);

 

  await prisma.refreshToken.create({
   data : {
    token : hashedToken,
    userId : user.id,
     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
   }
  })

  // Welcome activity

  await prisma.activity.create({
  data: {
    type: 'WELCOME',
    title: 'Bienvenue 🎉',
    message:
      `${user.firstName} , Votre compte a été créé avec succès. Plus que quelques étapes  et vous pourrez avoir accès à toutes les fonctionnalités de la plateforme`,
            
    userId: user.id   
  }
})



   // Set refresh token in httpOnly cookie
 res.cookie("refreshToken", refreshTkn, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  domain: ".suivi-mp.com",
  maxAge: 7 * 24 * 60 * 60 * 1000
})

res.cookie("jwt", token, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  domain: ".suivi-mp.com",
  maxAge: 15 * 60 * 1000
})




  res.status(201).json({msg : "Created"})
})

/**
 * @desc GET all users
 * @route GET /api/users
 * @access Private
 */
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id || !["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
    res.status(401)
    throw new Error("Accès refusé")
  }

  const { role, isActive, search, date, page, limit } = req.query

  const take = parseInt(limit as string) || 20
  const skip = (parseInt(page as string) - 1 || 0) * take

  /* ================= BUILD FILTERS ================= */
  const where: Prisma.UserWhereInput = {}

  if (role && role !== "all") where.role = role as Role
  if (isActive && isActive !== "all") where.isActive = isActive === "true"

  if (search && typeof search === "string") {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  if (date && date !== "all") {
    const now = new Date()
    const from = new Date()
    if (date === "week") from.setDate(now.getDate() - 7)
    else if (date === "month") from.setMonth(now.getMonth() - 1)
    else if (date === "year") from.setFullYear(now.getFullYear() - 1)
    where.createdAt = { gte: from }
  }

  /* ================= QUERY ================= */
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        isLocked: true,

           pme: where.role === "PME" ? {
      select: {
        id: true,
        name: true,
        isActive: true,
        type: true,
        size: true,
        description: true,
        email: true,
        phone: true,
        website: true,
        country: true,
        administrative: true,
        city: true,
        address: true,
        ownerId: true,
        promoter : true,
        currency : true
      }
    } : false,
      },
    }),
    prisma.user.count({ where }),
  ])

  res.status(200).json({
    data: users,
    meta: {
      total,
      page: parseInt(page as string) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  })
})





/**
 *@desc  GET user by id
 * @route GET /api/users/:id
 * @access Private
 */
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = await req.params.id
  // Get access to the aythentificated user
  const currentUser = req.user

  if (!id) {
    res.status(400)
    throw new Error("Missing user id")
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      pme : true
    }
  })

  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  res.json(user)
})

/**
 *@desc  UPDATE user (PUT / PATCH)
 * @route PUT|PATCH /api/users/:id
 * @access Private
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id
  if (!id) {
    res.status(400)
    throw new Error("Missing user id")
  }
  const received : UpdateUserDTO = req.body
  
  const data = updateUserSchema.parse(received)

  const userExists = await prisma.user.findUnique({
    where: { id }
  })

  if (!userExists) {
    res.status(404)
    throw new Error("User not found")
  }

   const updateData = {
    ...(data.email !== undefined && { email: data.email }),
    ...(data.firstName !== undefined && { firstName: data.firstName ?? null }),
    ...(data.lastName !== undefined && { lastName: data.lastName ?? null }),
    ...(data.role !== undefined && { role: data.role }),
    ...(data.isActive !== undefined && { isActive: data.isActive })
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data : updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  })

  res.json(updatedUser)
})

/**
 *@desc DELETE user
 * @route DELETE /api/users/:id
 * @access Private
 */
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {

  const id = req.params.id
  if (!id) {
    res.status(400)
    throw new Error("Missing user id")
  }

  

  const userExists = await prisma.user.findUnique({
    where: { id }
  })

  if (!userExists) {
    res.status(404)
    throw new Error("User not found")
  }

 await prisma.refreshToken.deleteMany({
  where: { userId : id }
})

await prisma.user.delete({
  where: { id}
})

  res.status(200).json({ message: "User deleted successfully" })
})

/**
 * @description Add a new admin
 * @route POST/users/admin
 * @access Admin
 * **/ 
export const createAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    res.status(401)
    throw new Error("Unauthorized")
  }

  if (req.user.role !== "SUPER_ADMIN") {
    res.status(403)
    throw new Error("Forbidden: Autorisations insuffisantes")
  }

  const parsed = createAdminUserSchema.parse(req.body);
  if(!parsed){
    res.status(400)
    throw new Error("Invalid datas")
  }

  const { firstName, lastName, email, password, role } = parsed

  if (!email || !password) {
    res.status(400)
    throw new Error("Email et mot de passe requis")
  }

  /* ================= CHECK EMAIL ================= */
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409)
    throw new Error("Un utilisateur avec cet email existe déjà")
  }

  /* ================= HASH PASSWORD ================= */
  const passwordHash = await hashPassword(password)

  /* ================= CREATE ================= */
  const adminUser = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      role,
      isActive: true,
      verificationCode: null,
      codeIsVerified: true,
      codeExpires: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  })

  /* ================= RESPONSE ================= */
  res.status(201).json(adminUser)
})
