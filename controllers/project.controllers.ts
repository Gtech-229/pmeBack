import { Response, Request } from 'express'
import asyncHandler from 'express-async-handler'
import { prisma } from '../lib/prisma'
import { AuthRequest } from 'types'
import { uploadToCloudinary , } from '../utils/UploadToCloudinary'
import { createProjectBodySchema } from '../schemas/project.schema'
import { updateProjectSchema } from '../schemas/project.schema'
import { removeFromCloudinary } from '../utils/RemoveFromCloudinary'
import { ProjectStatus, ProjectType } from '../generated/prisma/enums'
import { Prisma, Project } from '../generated/prisma/client'
import { getAgeFilter, getDateFilter } from '../utils/functions'
import { computeCreditDetails } from '../utils/functions'
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
      res.status(401)
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
      credits ,
      type,
      sectorId 
    } = parsedBody.data

    
    
    /* ---------------- CAMPAIGN CHECK ---------------- */
const campaign = await prisma.campaign.findUnique({
  where: { id: campaignId },
  select: { type: true, status: true }
})

if (!campaign) {
  res.status(404)
  throw new Error("Campagne introuvable")
}

if (campaign.status !== "OPEN") {
  res.status(400)
  throw new Error("Cette campagne n'est pas ouverte aux soumissions")
}



// Only block multiple submissions for MONO_PROJECT campaigns
if (campaign.type === "MONO_PROJECT") {
  const hasAlreadyCampaignProject = await prisma.project.findFirst({
    where: { campaignId, pmeId }
  })

  if (hasAlreadyCampaignProject) {
    res.status(400)
    throw new Error("Votre organisation dispose déjà d'un projet pour le compte de cette campagne")
  }
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
      currentStepOrder: 1,
      type ,
      sectorId : sectorId ?? null
      
    },

    include : {
      campaign : true,
      activity : true,
      stepProgress : true,

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


if (credits && Array.isArray(credits) && credits.length > 0) {
  await prisma.projectCredit.createMany({
    data: credits.map((c) => {
      const amount = Number(c.amount)
      const interestRate = Number(c.interestRate)
      const durationMonths = Number(c.durationMonths)
      const remainingBalance = Number(c.remainingBalance)
      const startDate = new Date(c.startDate)

      const { monthlyPayment, endDate } = computeCreditDetails({
        amount,
        interestRate,
        durationMonths,
        startDate,
      })

      return {
        borrower: c.borrower,
        amount,
        interestRate,
        durationMonths,
        monthlyPayment,        
        remainingBalance,      
        startDate,
        endDate,               
        status: remainingBalance === 0 ? "COMPLETED" : "ACTIVE",
        projectId: project.project.id ,
      }
    })
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
      label,
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

    res.status(201).json(project.project)
  }
)





/**
 * @description Get projects (paginated + filtered)
 * @route  GET /projects
 * @access Private
 */
export const getProjects = asyncHandler(
  async (req: AuthRequest, res: Response) => {
   
  

    const { 
      status , 
      date, 
      search,
      campaignId, 
      step,
       limit,
        page, 
        sector,
        maxAge,
        minAge,
        hasDisability,
        type
      } = req.query

     const take = parseInt(limit as string) || 20
    const skip = (parseInt(page as string) - 1 || 0) * take
 

    //  Build Prisma where clause dynamically
    const where: Prisma.ProjectWhereInput = {
      ...(status && status !== "all" ? {status : status as ProjectStatus} : {}),
      ...(search ?  {OR :[
        {title : {contains : search as string}},
        {pme : {name : {contains : search as string}, promoter : {firstName : {contains : search as string}, lastName : {contains : search as string}}}},
        
      ]
        
      }: {}),

      ...(campaignId && campaignId !== "all" && {campaignId : campaignId as string}),
      ...(step && step !== "all" && {currentStepOrder : Number(step) as number}),
      ...(date && date !== "all" ? getDateFilter(date as string) : {}),
      ...(sector && sector !== "all" ? {sectorId : search as string} : {}),
        ...(minAge || maxAge ? getAgeFilter(minAge as string, maxAge as string) : {}),
   ...(hasDisability && {pme : {promoter : {hasDisability : hasDisability === "true"}}} ),
   ...(type && {type : type as ProjectType} )
    }


    //  Fetch data + count in one transaction
    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          pme: {
            include: { owner: true , promoter : {include : {user : true}} },
          },
          stepProgress : {
            include : {
              campaignStep : true
            }
          },
           sector : true,
          campaign : true,
          credits : {include : {repayments : true}},
          financialEntries : true,
          disbursements : true
        },
      }),
      prisma.project.count({ where }),
    ])

    res.status(200).json({
      data: projects,
      meta : {
        page,
        total,
        totalPages: Math.ceil(total / take),
        limit : take
        
      }
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
                  campaign : true,
                  sector : true,
                  statusHistory : true,
                  stepProgress : {include : {stepDocuments : true}}
                }
              },
              promoter : {include : {user : true}}
              
              
            }
          },
          campaign : {include : {steps : {include : {documents : true}}}},
          sector : true,
          stepProgress : {
            include : {
              campaignStep :{
                include: {
                  committee : true,
                  documents : true
                }
              },
              stepDocuments : true,
              
            }
          },
          credits : {include : {repayments : true}},
          financialEntries : true,
          disbursements : true
        } 
    });

    if (!project)  res.status(404).json({ message: "Project not found" });
  
    
    const fundedAmount =  project?.disbursements
    .filter(d => d.isDisbursed)
    .reduce((sum, d) => sum + d.amount, 0)

    res.status(200).json({
      ...project,
      fundedAmount
    });
 
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

export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    res.status(401)
    throw new Error('Not authentificated')
  }

  const projectId = req.params.id
  if (!projectId) {
    res.status(400)
    throw new Error("Please specify a project id")
  }



  const parsedData = updateProjectSchema.safeParse(req.body)
  if (!parsedData.success) {
    res.status(400)
    throw parsedData.error
  }

  const { title, description, requestedAmount, campaignId, hasCredit, type, credits, keepDocuments } = parsedData.data

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      documents: true,
      stepProgress: true,
      credits: true,
    }
  })

  if (!project) {
    res.status(404)
    throw new Error("Project not found")
  }

  const pme = await prisma.pME.findUnique({ where: { id: project.pmeId } })
  if (!pme || pme.ownerId !== req.user.id) {
    res.status(403)
    throw new Error('Not allowed to update this project')
  }

  // ── Credits diff ──
  const incoming = credits ?? []
  const incomingIds = incoming.filter(c => c.id).map(c => c.id as string)

  await prisma.projectCredit.deleteMany({
    where: { projectId, id: { notIn: incomingIds } }
  })
  
  for (const c of incoming.filter(c => c.id)) {
    await prisma.projectCredit.update({
      where: { id: c.id! },
      data: {
        borrower: c.borrower,
        amount: c.amount,
        interestRate: c.interestRate,
        monthlyPayment: c.monthlyPayment,
        remainingBalance: c.remainingBalance,
         durationMonths : c.durationMonths,
        startDate : new Date(c.startDate),
         endDate : new Date(c.endDate),
      }
    })
  }

  const newCredits = incoming.filter(c => !c.id)
  if (newCredits.length) {
    await prisma.projectCredit.createMany({
      data: newCredits.map(c => ({
        borrower: c.borrower,
        amount: c.amount,
        interestRate: c.interestRate,
        monthlyPayment: c.monthlyPayment,
        remainingBalance: c.remainingBalance,
        projectId,
        durationMonths : c.durationMonths,
        startDate : new Date(c.startDate),
         endDate : new Date(c.endDate),
      }))
    })
  }

  // ── Documents diff ──
  const toKeep = keepDocuments ?? []
  const currentStep = project.stepProgress.find(s => s.status === "IN_PROGRESS")

  // Only diff documents from the current step
  const currentStepDocs = project.documents.filter(d =>
    currentStep ? d.projectStepId === currentStep.id : false
  )

  const docsToDelete = currentStepDocs.filter(d => !toKeep.includes(d.id))
  for (const doc of docsToDelete) {
    await removeFromCloudinary(doc.publicId)
    await prisma.document.delete({ where: { id: doc.id } })
  }

  // ── New document uploads ──
  const files = req.files as Express.Multer.File[] | undefined
  if (files?.length) {
    if (!currentStep) {
      res.status(400)
      throw new Error("Aucune étape en cours trouvée pour ce projet")
    }

    for (const file of files) {
      const match = file.fieldname.match(/newDocuments\[(\d+)\]\[file\]/)
      if (!match) continue

      const index = Number(match[1])
      const meta = req.body.newDocuments?.[index]
      if (!meta?.title) throw new Error(`Missing title for document at index ${index}`)

      const upload = await uploadToCloudinary(file, `projects/${project.id}`)
      await prisma.document.create({
        data: {
          label: meta.title,
          fileUrl: upload.url,
          publicId: upload.publicId,
          mimeType: file.mimetype,
          size: file.size,
          projectId: project.id,
          projectStepId: currentStep.id,
        }
      })
    }
  }

  // ── Update project ──
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { title, description, requestedAmount, campaignId, hasCredit, type },
    include: {
      campaign: { include: { steps: {include : {documents : true}} } },
      credits: true,
      statusHistory: true,
      stepProgress: {
        include: {
          stepDocuments: true,
          campaignStep: true,
        }
      },
      sector: true,
      pme: {
        include: {
          owner: true,
          promoter: { include: { user: true } }
        }
      }
    }
  })

  res.status(200).json(updated)
})


