"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.getProject = exports.getProjects = exports.createProject = void 0;
const prisma_1 = require("../lib/prisma");
const project_schema_1 = require("../schemas/project.schema");
// Créer un projet
const createProject = async (req, res) => {
    try {
        const data = req.body;
        const parsed = project_schema_1.createProjectSchema.parse(data);
        const pmeId = req.user.id;
        if (!parsed) {
            res.status(400);
            throw new Error("Invalid data format");
        }
        const project = await prisma_1.prisma.project.create({
            data: {
                title: parsed.title,
                description: parsed.description,
                requestedAmount: parsed.requestedAmount,
                pmeId,
                status: 'pending',
                submissionDate: new Date()
            },
        });
        res.status(201).json({ project });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating project" });
    }
};
exports.createProject = createProject;
// // Mettre à jour un projet
// export const updateProject = async (req: Request, res: Response) => {
//   try {
//     const id = await req.params.id;
//     const data: UpdateProjectDTO = req.body;
//     const parsedData = createProjectSchema.parse(data);
//     if(!id || !data){
//       throw new Error("No id on the request")
//     }
//    if (data.subSteps?.create) {
//   for (const s of data.subSteps.create) {
//     await prisma.subStep.create({
//       data: {
//         name: s.name,
//         description: s.description,
//         state: s.state ?? "pending",
//         dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
//         remarks: s.remarks,
//         projectId: id,
//       },
//     })
//   }
// }
// if (data.subSteps?.update) {
//   for (const s of data.subSteps.update) {
//     await prisma.subStep.update({
//       where: { id: s.id },
//       data: {
//         name: s.name,
//         description: s.description,
//         state: s.state,
//         dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
//         completedAt: s.completedAt
//           ? new Date(s.completedAt)
//           : undefined,
//         remarks: s.remarks,
//       },
//     })
//   }
// }
//     const project = await prisma.project.update({
//       where: { id },
//       data: {
//         ...data,
//         subSteps: data.subSteps ? { upsert: data.subSteps.map((s) => ({
//           where: { id: s.id || "" }, // id obligatoire pour upsert, sinon créer
//           update: s,
//           create: s
//         })) } : undefined,
//       },
//       include: { subSteps: true },
//     });
//     res.json({ project });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error updating project" });
//   }
// };
// Récupérer tous les projets
const getProjects = async (_req, res) => {
    try {
        const projects = await prisma_1.prisma.project.findMany({
            include: { subSteps: true, validatedBy: true },
        });
        res.json({ projects });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching projects" });
    }
};
exports.getProjects = getProjects;
// Récupérer un projet par id
const getProject = async (req, res) => {
    try {
        const id = await req.params.id;
        if (!id) {
            throw new Error("No id specified on the request");
        }
        const project = await prisma_1.prisma.project.findUnique({
            where: { id },
            include: { subSteps: true, validatedBy: true },
        });
        if (!project)
            return res.status(404).json({ message: "Project not found" });
        res.json({ project });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching project" });
    }
};
exports.getProject = getProject;
// Supprimer un projet
const deleteProject = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            res.status(400);
            throw new Error('No id');
        }
        await prisma_1.prisma.project.delete({ where: { id } });
        res.json({ message: "Project deleted" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting project" });
    }
};
exports.deleteProject = deleteProject;
//# sourceMappingURL=project.controllers.js.map