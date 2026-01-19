import express from "express";
import dotenv from 'dotenv'
import { errorHandler } from "./middlewares/errorHandler";
import cookieParser from 'cookie-parser'
import cors from 'cors'
// Routes import
import userRoutes from './routes/user.routes'
import authRoutes from './routes/auth.routes'
import projectsRoutes from './routes/project.routes'
import pmeRoutes from './routes/pme.routes'
import activitiesRoutes from './routes/activities.routes'
import committeeRoutes from './routes/committee.route'
import dashboardRoutes from './routes/dashboard.route'
// Initialisations
dotenv.config()
const port = process.env.PORT || 3000
const app = express();

app.use(express.json())
app.use(express.urlencoded({extended : false}))
app.use(cookieParser());

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? "http://31.207.38.123" : "http://localhost:3000", 
  credentials: true
}))


app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/projects",projectsRoutes);
app.use('/api/onboarding/pme',pmeRoutes)
app.use("/api/activities",activitiesRoutes);
app.use("/api/committee",committeeRoutes);
app.use("/api/dashboard", dashboardRoutes)


app.use(errorHandler);

app.listen(port , ()=> console.log(`Server running on port ${port}`))

