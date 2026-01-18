import asyncHandler from "express-async-handler";
import { AuthRequest } from "types";
import { Response } from "express";
import { prisma } from "../lib/prisma";
/**
 * @description  Get recent activities
 * @route GET/activities
 * @access Authentificted user
 * **/ 
export const getActivities = asyncHandler(async(req : AuthRequest, res: Response)=>{

   if(!req.user?.id){
    res.status(401);
    throw new Error('Not authenticated')
   }

     const userId = req.user?.id

  const activities = await prisma.activity.findMany({
    where : {
      userId 
    },
   select :{
    id : true,
    title : true,
    type : true,
    message : true,
    pme : true,
    user : true,
    createdAt : true
   }
  })

  res.status(200).json(activities);
});


