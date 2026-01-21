"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middlewares/errorHandler");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
// Routes import
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const pme_routes_1 = __importDefault(require("./routes/pme.routes"));
const activities_routes_1 = __importDefault(require("./routes/activities.routes"));
const committee_route_1 = __importDefault(require("./routes/committee.route"));
const dashboard_route_1 = __importDefault(require("./routes/dashboard.route"));
// Initialisations
dotenv_1.default.config();
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ["https://suivi-mp.com", "https://admin.suivi-mp.com"]
    : ["http://localhost:3000"];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // autoriser les requêtes sans origin (ex: Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/projects", project_routes_1.default);
app.use('/api/onboarding/pme', pme_routes_1.default);
app.use("/api/activities", activities_routes_1.default);
app.use("/api/committee", committee_route_1.default);
app.use("/api/dashboard", dashboard_route_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(port, () => console.log(`Server running on port ${port}`));
//# sourceMappingURL=server.js.map