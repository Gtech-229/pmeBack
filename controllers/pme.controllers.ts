import asyncHandler from "express-async-handler";
import { AuthRequest } from "types";
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { fullOnboardingSchema } from "../schemas/pme.onBoarding";
import { removeFromCloudinary } from "../utils/RemoveFromCloudinary";
import { uploadToCloudinary } from "../utils/UploadToCloudinary";
import { Prisma } from "../generated/prisma/client";


export const createPMESchema = fullOnboardingSchema.strict()


/**
 * @description : Set a user's account as validated and create his PME
 * @Route : POST/api/onboarding/pme
 */
export const validateAccount = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      res.status(401)
      throw new Error("User not authenticated")
    }

    const userId = req.user.id

  

    /* ---------------- VALIDATION ---------------- */
    const parsed = createPMESchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400)
      throw parsed.error
    }

    const { promoter, ...data } = parsed.data

    /* ---------------- LOCATION ---------------- */
    const hasAdministrative = data.administrative &&
      Object.keys(data.administrative).length > 0

    const location = hasAdministrative
      ? { administrative: data.administrative, city: null }
      : { administrative: {}, city: data.city ?? null }

    /* ---------------- USER CHECK ---------------- */
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { codeIsVerified: true, validatedAt: true }
    })

    if (!user) {
      res.status(404)
      throw new Error("User not found")
    }
    if (!user.codeIsVerified) {
      res.status(403)
      throw new Error("Email not verified")
    }
    if (user.validatedAt) {
      res.status(409)
      throw new Error("Account already validated")
    }

    /* ---------------- TRANSACTION ---------------- */
    await prisma.$transaction(async (tx) => {
      const createdPme = await tx.pME.create({
        data: {
          ownerId: userId,
          name: data.name,
          phone: data.phone,
          address: data.address,
          email: data.email,
          description: data.description,
          type: data.type,
          size: data.size,
          country: data.country,
          currency : data.currency,
          administrative: location.administrative,
          city: location.city,
        
          
        }
      })

      await tx.promoter.create({
        data: {
          userId,
          pmeId: createdPme.id,
          gender: promoter.gender,
          birthDate: new Date(promoter.birthDate),
          maritalStatus: promoter.maritalStatus,
          hasDisability: promoter.hasDisability,
          disabilityType: promoter.hasDisability ? promoter.disabilityType! : null,
          role: promoter.role ?? "",
        }
      })

      await tx.user.update({
        where: { id: userId },
        data: {
          validatedAt: new Date(),
          isActive: true,
        }
      })

      await tx.activity.create({
        data: {
          type: "ACCOUNT_VERIFIED",
          title: "Compte Vérifié",
          message: "Félicitations. La vérification de votre organisation a été effectuée avec succès. Vous pouvez désormais procéder à la soumission d'un projet.",
          userId,
          pmeId: createdPme.id,
        }
      })
    })

    res.status(200).json({
      success: true,
      message: "Account successfully validated",
    })
  }
)


/**
 * @description : Get the connected user's pme Details
 * @route : GET/api/onboarding/pme
 * @access Private
 * **/ 

export const getPme = asyncHandler(async (req: AuthRequest, res: Response) => {
 
    // Get the user
    if (!req.user?.id) {
      res.status(401)
      throw new Error('No user Id')
    }



    // Get the xuser's Pme
    const pme = await prisma.pME.findUnique({
      where: {
        ownerId: req.user.id,
      },
      relationLoadStrategy : 'join',

      include : {
projects : {
  include : {
    campaign : true,
    stepProgress : {
      include : {
        campaignStep : true
      }
    }
  },
  orderBy : {
    createdAt : 'desc'
  }
}
      }
    
    })

    
    if (!pme) {
    res.status(404)
    throw new Error("Pas d'organisation")
    }

    
  res.status(200).json(pme)
  
}
)


/**
 * @description : Update pme profil image
 * @Route : PUT/onboarding/pme/:id
 * @Access Private
 * **/ 

export const updateProfile = asyncHandler(async(req : AuthRequest, res:Response) =>{
  if(!req.user?.id){
    res.status(401)
    throw new Error('Unauthorized')
  }

   const { id: pmeId } = req.params
  if(!pmeId){
    res.status(400)
     throw new Error('The pmeId is required')
  }


 if (!req.file) {
      res.status(400)
      throw new Error("No image provided")
    }


      // Vérifier la PME
    const pme = await prisma.pME.findUnique({
      where: { id: pmeId },
    })

    if (!pme) {
      res.status(404)
      throw new Error("PME not found")
    }

    //  Supprimer l’ancienne image si elle existe
    if (pme.logoId) {
      await removeFromCloudinary(pme.logoId)
    }

    const uploadResult = await uploadToCloudinary(req.file, `profiles/${pme.id}`)
    
         await prisma.pME.update({
      where: { id: pmeId },
      data: {
        logoUrl: uploadResult.url,
        logoId: uploadResult.publicId,
      },
    })

     res.status(200).json({
      message: "Profile image updated successfully"
    })

})



export const deleteProfileImg = asyncHandler(async(req:AuthRequest, res:Response)=>{
  if(!req.user?.id){
    res.status(401)
    throw new Error('Unauthorized')
  }

   const { id: pmeId } = req.params
  if(!pmeId){
    res.status(400)
     throw new Error('The pmeId is required')
  }


      // Vérifier la PME
    const pme = await prisma.pME.findUnique({
      where: { id: pmeId },
    })

    if (!pme) {
      res.status(404)
      throw new Error("PME not found")
    }

    //  Supprimer l’ancienne image si elle existe
    if (pme.logoId) {
      await removeFromCloudinary(pme.logoId)
    }

     await prisma.pME.update({
      where: { id: pmeId },
      data: {
        logoUrl: null,
        logoId: null,
      },
    })

     res.status(200).json({
      message: "Profile image deleted successfully"
    })

})


export const getPmes = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401)
    throw new Error("Access denied")
  }

  const { search, page, limit } = req.query

  const take = parseInt(limit as string) || 20
  const skip = (parseInt(page as string) - 1 || 0) * take

  const where: Prisma.PMEWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search as string, mode: "insensitive" } },
            { email: { contains: search as string, mode: "insensitive" } },
            { city: { contains: search as string, mode: "insensitive" } }
           
          ],
        }
      : {}),
  }

  const [data, total] = await prisma.$transaction([
    prisma.pME.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.pME.count({ where }),
  ])

  res.status(200).json({
    data,
    meta: {
      total,
      page: parseInt(page as string) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  })
})