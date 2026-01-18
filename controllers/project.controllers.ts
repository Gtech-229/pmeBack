import { Response, Request } from 'express'
import asyncHandler from 'express-async-handler'
import { prisma } from '../lib/prisma'
import { AuthRequest } from 'types'
import { uploadToCloudinary , } from '../utils/UploadToCloudinary'
import { CreateProjectBodyDTO, createProjectBodySchema } from '../schemas/project.schema'
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
  
    // Zod validation 
    const parsedBody = createProjectBodySchema.safeParse(req.body)

    if (!parsedBody.success) {
      res.status(400)
      throw parsedBody.error
    }

  // Check the user
    const userId = req.user?.id
    if (!userId) {
      res.status(401)
      throw new Error('Utilisateur non authentifié')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pme : true}
    })

    if (!user || !user.pme) {
      res.status(403)
      throw new Error('Utilisateur non autorisé à créer un projet')
    }

    const { title, description, requestedAmount, hasCredit } = parsedBody.data

//  Files validation
     const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      res.status(400)
      throw new Error('Au moins un document est requis')
    }

    

    



    // Transactions
  // 1. Crée le projet d’abord
const createdProject = await prisma.project.create({
  data: { title, description, requestedAmount, pmeId: user.pme?.id, hasCredit : hasCredit==="true" }
})

// 2. Upload fichiers + créer documents hors transaction
const filesWithDocs = []

for (let i = 0; i < files.length; i++) {
  const file = files[i]
  const label = req.body.documentsMeta[i]?.label
  if(!file || !label){
    throw new Error(`Intitule ou document${i + 1} manquant `)
  }
  const uploadResult = await uploadToCloudinary(file, `projects/${createdProject.id}`)

  const document = await prisma.document.create({
    data: {
      title: label,
      fileUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      mimeType: file.mimetype,
      size: file.size,
      projectId: createdProject.id
    }
  })

  filesWithDocs.push(document)
}

// Activity
await prisma.activity.create({
  data : {
    type : 'PROJECT_CREATED',
    title : "Nouveau Projet",
    message : `Votre nouveau projet a bien été soumis et est en attente d'approbation des administrateurs. Vous serez tenu informé des prochaines décisions.`,
    userId ,
    pmeId : user.pme.id
  }
})

    /* ---------------- RESPONSE ---------------- */

    res.status(201).json({
      success: true,
      projectId: createdProject.id
    })
  }
)




/**
 * @description Get projects
 * @route  GET/projects
 * @access Private (allowed roles)
 * **/ 
export const getProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
   
    const projects = await prisma.project.findMany({
      include: { 
       
        pme : {
        include : {owner : true}
      }

    }});

    res.status(200).json(projects);
 
}
)




/**
 * @description Get single project
 * @route  GET/projects/id
 * @access Authentificated
 * **/ 
export const getProject = asyncHandler( async (req: Request, res: Response)=> {

    const id = req.params.id;
    if(!id){
      throw new Error("No id specified on the request")
    }

    const project = await prisma.project.findUnique({
      where: { id },
     include: {
      documents : true,
      subSteps :true,
          pme : {
            include : {
              owner : true
            }
          }
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
    console.log("Id received :",id)
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
      throw new Error ('No projects found')
      res.status(404)
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
    removedDocuments
  } = parsedData.data


    const project = await prisma.project.findUnique({
      where : {id : projectId},
      include : {documents : true}
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
 // Update basics fields
   await prisma.project.update({
    where: { id: projectId },
    data: {
      title,
      description,
      requestedAmount
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

    await prisma.document.create({
      data: {
        title: meta.title,
        fileUrl: upload.url,
        publicId: upload.publicId,
        mimeType: file.mimetype,
        size: file.size,
        projectId: project.id
      }
    })
  }
}

   res.status(200).json({
    message: 'Project updated successfully'
  })
console.log("Received datas :", req.body)

})


/**
 * @description Update project status
 * @route PATCH /projects/:id/status
 * @access Private
 */
export const changeStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { status } = req.body

    if (!id) throw new Error("Project id required")

    if (status !== "approved") {
      // status (rejected, funded, .....)
      const project = await prisma.project.update({
        where: { id },
        data: { status },
        
      })

      res.status(200).json(project)
    }

    // when status === approved

    const project = await prisma.project.findUnique({
      where: { id },
      include: { validatedBy: true },
    })

    if (!project) throw new Error("Project not found")
  //  Avoid double validatons
    const alreadyValidated = project.validatedBy.some(
      (u) => u.id === req.user!.id
    )

    if (alreadyValidated) {
      res.status(400)
      throw new Error("Already validated by this user")
    }

    // add validator
    await prisma.project.update({
      where: { id },
      data: {
        validatedBy: {
          connect: { id: req.user!.id },
        },
      },
    })

    //  re-fetch validators
    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: {
        validatedBy: true,
        
      },
    })

    // Amount of admin and super admin that approved the project
    const adminsCount = updatedProject!.validatedBy.filter(
      (u) => u.role === "ADMIN"
    ).length

    const hasSuperAdmin = updatedProject!.validatedBy.some(
      (u) => u.role === "SUPER_ADMIN"
    )
      // Mark as approved
    if (adminsCount >= 2 && hasSuperAdmin) {
      const approvedProject = await prisma.project.update({
        where: { id },
        data: {
          status: "approved",
          validatedAt: new Date(),
        },
        
      })

     res.status(200).json(approvedProject)
    }

    
    res.status(200).json(updatedProject)
  }
)
