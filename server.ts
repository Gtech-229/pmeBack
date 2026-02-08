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
import campaignRoutes from './routes/campaign.route'
import { createRateLimiter } from "./middlewares/ratelimit";
// Initialisations
dotenv.config()
const port = process.env.PORT || 3000
const app = express();
app.set("trust proxy", 1)

app.use(express.json())
app.use(express.urlencoded({extended : false}))
app.use(cookieParser());



const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ["https://suivi-mp.com", "https://admin.suivi-mp.com"]
  : ["http://localhost:3000"];

app.use(cors({
  origin: function(origin, callback){
    // autoriser les requêtes sans origin (ex: Postman)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));


app.use(createRateLimiter(1000, 15));

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/projects",projectsRoutes);
app.use('/api/onboarding/pme',pmeRoutes)
app.use("/api/activities",activitiesRoutes);
app.use("/api/committee",committeeRoutes);
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/campaign", campaignRoutes)


app.use(errorHandler);

app.listen(port , ()=> console.log(`Server running on port ${port}`))

