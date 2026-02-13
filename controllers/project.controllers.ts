import { Response, Request } from 'express'
import asyncHandler from 'express-async-handler'
import { prisma } from '../lib/prisma'
import { AuthRequest } from 'types'
import { uploadToCloudinary , } from '../utils/UploadToCloudinary'
import { createProjectBodySchema } from '../schemas/project.schema'
import { updateProjectSchema } from '../schemas/project.schema'
import { removeFromCloudinary } from '../utils/RemoveFromCloudinary'
import { ProjectStatus } from '../generated/prisma/enums'
/**
 * @description Create new project
 * @route  POST/projects
 * @access Private(authentificated pme)
 * **/ 

export const createProject = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    /* ---------------- AUTH ---------------- */

    if (!req.user?.id) {
      res.status(401)
      throw new Error("Unauthorized")
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { pme: true }
    })

    if (!user || !user.pme?.id) {
      res.status(403)
      throw new Error("Utilisateur non autorisé à créer un projet")
    }
    const pmeId = user.pme.id

    

    /* ---------------- BODY PARSING ---------------- */

    let requestcredits
    try {
      requestcredits = req.body.credits ? JSON.parse(req.body.credits) : undefined
    } catch {
      res.status(400)
      throw new Error("Format JSON invalide pour les crédits")
    }

   

    const bodyToValidate = { ...req.body, credits:requestcredits }


   


    const parsedBody = createProjectBodySchema.safeParse(bodyToValidate)
    if (!parsedBody.success) {
      res.status(400)
      throw parsedBody.error
    }

    const {
      title,
      description,
      requestedAmount,
      hasCredit,
      campaignId,
      credits 
    } = parsedBody.data

    
    // Check if the usser has already a project in the selected campaign
    const hasAlreadyCampaignProject = await prisma.project.findFirst({
      where : {campaignId , pmeId}
    })

    if(hasAlreadyCampaignProject) {
      res.status(400)
      throw new Error("Votre organisation dispose déjà d'un projet pour le compte de cette campagne")
    }

   

    /* ---------------- FILES VALIDATION ---------------- */

    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      res.status(400)
      throw new Error("Au moins un document est requis pour la soumission d'un projet")
    }

    /* ---------------- CAMPAIGN STEPS ---------------- */

    const campaignSteps = await prisma.campaignStep.findMany({
      where: { campaignId },
      orderBy: { order: "asc" }
    })



    if (!campaignSteps || campaignSteps.length === 0) {
      res.status(400)
      throw new Error("La campagne ne contient aucune étape")
    }



    /* ---------------- TRANSACTION ---------------- */

   const project = await prisma.$transaction(async (tx) => {
  const createdProject = await tx.project.create({
    data: {
      title,
      description,
      requestedAmount,
      hasCredit: hasCredit === "true",
      pmeId,
      campaignId,
      status: "pending",
      currentStepOrder: 1
    }
  })

  await tx.projectStatusHistory.create({
    data: {
      projectId: createdProject.id,
      status: "pending"
    }
  })

  let firstStepId: string | null = null

  for (const step of campaignSteps) {
    const createdStep = await tx.projectStepProgress.create({
      data: {
        projectId: createdProject.id,
        campaignStepId: step.id,
        status: step.order === 1 ? "IN_PROGRESS" : "PENDING"
      }
    })

    if (step.order === 1) {
      firstStepId = createdStep.id
    }
  }

  if (!firstStepId) {
    throw new Error("Aucune étape initiale trouvée")
  }



  return {
    project: createdProject,
    firstStepId
  }
})


  if(credits && Array.isArray(credits) && credits.length > 0 ){
    await prisma.projectCredit.createMany({
      data : credits.map((c) => ({
        borrower : c.borrower,
        amount : Number(c.amount),
        interestRate : Number(c.interestRate),
        monthlyPayment : Number(c.monthlyPayment),
        dueDate : new Date(c.dueDate),
        remainingBalance : Number(c.remainingBalance),
        projectId : project.project.id

      }))
    })
  }



    /* ---------------- DOCUMENTS UPLOAD ---------------- */

 for (let i = 0; i < files.length; i++) {
  const file = files[i]
  const label = req.body.documentsMeta?.[i]?.label

  if (!file || !label) {
    throw new Error(`Document ou intitulé manquant (index ${i})`)
  }

  const uploadResult = await uploadToCloudinary(
    file,
    `projects/${project.project.id}`
  )

  await prisma.document.create({
    data: {
      title: label,
      fileUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      mimeType: file.mimetype,
      size: file.size,
      projectId: project.project.id,
      projectStepId: project.firstStepId 
    }
  })
}


    /* ---------------- ACTIVITY ---------------- */

    await prisma.activity.create({
      data: {
        type: "PROJECT_CREATED",
        title: "Nouveau projet",
        message:
          "Votre projet a bien été soumis et est en attente de traitement. Vous serez informé des prochaines étapes.",
        userId: req.user.id,
        pmeId: user.pme.id
      }
    })

    /* ---------------- RESPONSE ---------------- */

    res.status(201).json({
      success: true
    })
  }
)





/**
 * @description Get projects (paginated + filtered)
 * @route  GET /projects
 * @access Private
 */
export const getProjects = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Number(req.query.limit) || 10, 50)
    const skip = (page - 1) * limit

    const { status, date, search,campaign, step, } = req.query

    //  Build Prisma where clause dynamically
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.title = {
        contains: String(search),
        mode: 'insensitive',
      }
    }

    if (date && date !== 'all') {
      const now = new Date()

      switch (date) {
        case 'week':
          where.createdAt = {
            gte: new Date(now.setDate(now.getDate() - 7)),
          }
          break
        case 'month':
          where.createdAt = {
            gte: new Date(now.setMonth(now.getMonth() - 1)),
          }
          break
        case 'year':
          where.createdAt = {
            gte: new Date(now.setFullYear(now.getFullYear() - 1)),
          }
          break
      }
    }

    if (step && step !== 'all') {
  where.stepProgress = {
    some: {
      status: 'IN_PROGRESS',
      campaignStep: {
        order: Number(step),
      },
    },
  }
}




    if(campaign && campaign !== 'all'){
      where.campaignId = campaign
    }

    //  Fetch data + count in one transaction
    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pme: {
            include: { owner: true },
          },
          stepProgress : {
            include : {
              campaignStep : true
            }
          },

          campaign : true
        },
      }),
      prisma.project.count({ where }),
    ])

    res.status(200).json({
      data: projects,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    })
  }
)





/**
 * @description Get single project
 * @route  GET/projects/:id
 * @access Authentificated
 * **/ 
export const getProject = asyncHandler( async (req: Request, res: Response)=> {

    const id = req.params.id;
  
    if(!id){
      res.status(400)
      throw new Error("No id specified on the request")
    }

    const project = await prisma.project.findUnique({
      where: { id },
     include: {
      
          pme : {
            include : {
              owner : true,
              projects : {
                include : {
                  campaign : true
                }
              }
              
              
            }
          },
          campaign : true,
          stepProgress : {
            include : {
              campaignStep :{
                include: {
                  committee : true
                }
              },
              stepDocuments : true,
              
            }
          },
          credits : true
        } 
    });

    if (!project)  res.status(404).json({ message: "Project not found" });

    res.status(200).json(project);
 
}
)


/**
 * @description delete a project
 * @route  DELETE/projects/id
 * @param id
 * @access Private
 * **/ 
export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  
    const id = req.params.id;
    
    if(!id){
      res.status(400);
      throw new Error('No project id')

    }

    const project = await prisma.project.findUnique({ where: { id } });

    if(!project){
      res.status(404)
      throw new Error('No Project with such id')
    }

    const owner = await prisma.pME.findFirst({
      where: {id : project.pmeId}
    })

    if(!owner || req.user?.id !== owner.ownerId){
      res.status(401)
      throw new Error("You're not allowed to delete this project")
    }

    await prisma.project.delete({
      where : {id }
    })
    
    res.json({ message: "Project deleted" });
  
})


/**
 * @description Get own projects
 * @route  GET/projects/me
 * @access Private
 * **/ 

export const getMyProjects = asyncHandler (
  async (
  req: AuthRequest,
  res: Response
) => {
 
    const userId = req.user!.id

    const projects = await prisma.project.findMany({
      where: {
      pmeId : userId
      },
      orderBy: {
        createdAt: 'desc',
      },

    })


    if(!projects) {
      res.status(404)
      throw new Error ('No projects found')
      
    }

    res.status(200).json(projects)
  
}


) 

/**
 * @description Update a project
 * @route  PATCH/projects/id
 * @access Private
 * **/ 

export const updateProject = asyncHandler(async(req : AuthRequest, res: Response)=>{
    if(!req.user?.id){
      res.status(401)
      throw new Error('Not authentificated')
    }

    const user = req.user?.id

    const projectId = req.params.id

    if(!projectId){
      res.status(400)
      throw new Error("Please , specify a project id")
    }

//     // Zod validation
   const parsedData = updateProjectSchema.safeParse(req.body)
   if(!parsedData.success){
    res.status(400)
    throw new Error("Invalid Form data")
   }

   const {
    title,
    description,
    requestedAmount,
    existingDocuments,
    removedDocuments,
    campaignId,
    newCredits,
    existingCredits,
    removedCredits,
    hasCredit
  } = parsedData.data

  


    const project = await prisma.project.findUnique({
      where : {id : projectId},
      include : {
        documents : true ,
         stepProgress : true,
         credits : true
        }
    })

    if(!project){
      res.status(404)
      throw new Error("Project not found")

    }

     const pme = await prisma.pME.findUnique({
    where: { id: project.pmeId }
  })

  if (!pme || pme.ownerId !== req.user.id) {
    res.status(403)
    throw new Error('Not allowed to update this project')
  }
  await prisma.project.update({
    where: { id: projectId },
    data: {
      title,
      description,
      requestedAmount,
      campaignId,
      hasCredit 
    }
  })

   if (existingDocuments?.length) {
    for (const doc of existingDocuments) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { title: doc.title }
      })
    }
  }

   if (removedDocuments?.length) {
    const docsToDelete = project.documents.filter(d =>
      removedDocuments.includes(d.id)
    )

    for (const doc of docsToDelete) {
     await removeFromCloudinary(doc.publicId)
      await prisma.document.delete({ where: { id: doc.id } })
    }
  }

  


// ---------------------------
// Upload new documents (FIXED)
// ---------------------------
const files = req.files as Express.Multer.File[] | undefined

if (files?.length) {
  for (const file of files) {
    /**
     * fieldname example:
     * newDocuments[2][file]
     */
    const match = file.fieldname.match(/newDocuments\[(\d+)\]\[file\]/)

    if (!match) continue

    const index = Number(match[1])
    const meta = req.body.newDocuments?.[index]

    if (!meta?.title) {
      throw new Error(`Missing title for new document at index ${index}`)
    }

    const upload = await uploadToCloudinary(
      file,
      `projects/${project.id}`
    )

      const currentStep = project.stepProgress.find(
  (step) => step.status === "IN_PROGRESS"
);

if (!currentStep) {
  throw new Error("Aucune étape en cours trouvée pour ce projet");
}

  

    await prisma.document.create({
      data: {
        title: meta.title,
        fileUrl: upload.url,
        publicId: upload.publicId,
        mimeType: file.mimetype,
        size: file.size,
        projectId: project.id,
        projectStepId : currentStep.id
      }
    })

    


  }
}


// Credits

     if (removedCredits?.length) {
    await prisma.projectCredit.deleteMany({
      where: { id: { in: removedCredits } }
    })
  }


  if (existingCredits?.length) {
    for (const credit of existingCredits) {
      await prisma.projectCredit.update({
        where: { id: credit.id },
        data: {
          borrower: credit.borrower,
          amount: credit.amount,
          interestRate: credit.interestRate,
          monthlyPayment: credit.monthlyPayment,
          remainingBalance: credit.remainingBalance,
          dueDate: credit.dueDate
        }
      })
    }
  }


  

    if (newCredits?.length) {
    await prisma.projectCredit.createMany({
      data: newCredits.map(c => ({
        borrower: c.borrower,
        amount: c.amount,
        interestRate: c.interestRate,
        monthlyPayment: c.monthlyPayment,
        remainingBalance: c.remainingBalance,
        dueDate: c.dueDate,
        projectId: projectId 
      }))
    })
  }

   res.status(200).json({
    message: 'Project updated successfully'
  })


})


