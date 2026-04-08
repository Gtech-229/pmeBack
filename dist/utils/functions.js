"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maritalStatusLabel = exports.genderLabel = exports.campaignTypeLabel = exports.formatProjectTypeLabel = exports.groupBy = exports.aggregate = exports.getAgeRange = exports.getProjectFinancials = exports.getAgeFilter = exports.getDateFilter = exports.formatDate = void 0;
exports.computeCreditDetails = computeCreditDetails;
exports.round = round;
const date_fns_1 = require("date-fns");
const formatDate = (date) => date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
});
exports.formatDate = formatDate;
const getDateFilter = (date) => {
    const now = new Date();
    switch (date) {
        case "week": {
            const start = (0, date_fns_1.startOfWeek)(now, { weekStartsOn: 1 }); // Monday
            const end = (0, date_fns_1.endOfWeek)(now, { weekStartsOn: 1 });
            return { createdAt: { gte: start, lte: end } };
        }
        case "month": {
            const start = (0, date_fns_1.startOfMonth)(now);
            const end = (0, date_fns_1.endOfMonth)(now);
            return { createdAt: { gte: start, lte: end } };
        }
        case "year": {
            const start = (0, date_fns_1.startOfYear)(now);
            const end = (0, date_fns_1.endOfYear)(now);
            return { createdAt: { gte: start, lte: end } };
        }
        default:
            return {};
    }
};
exports.getDateFilter = getDateFilter;
const getAgeFilter = (minAge, maxAge) => {
    if (!minAge && !maxAge)
        return {};
    const now = new Date();
    // If promoter is X years old, their birthdate is between (now - X years) and (now - X+1 years)
    // minAge → promoter born at most (now - minAge years) ago  → birthdate <= now - minAge
    // maxAge → promoter born at least (now - maxAge years) ago → birthdate >= now - maxAge
    const birthdateFilter = {};
    if (maxAge) {
        // oldest allowed: born on or after (now - maxAge years)
        birthdateFilter.gte = (0, date_fns_1.subYears)(now, Number(maxAge));
    }
    if (minAge) {
        // youngest allowed: born on or before (now - minAge years)
        birthdateFilter.lte = (0, date_fns_1.subYears)(now, Number(minAge));
    }
    return {
        pme: {
            promoter: {
                birthDate: birthdateFilter,
            },
        },
    };
};
exports.getAgeFilter = getAgeFilter;
// Credits
function computeCreditDetails(input) {
    const { amount, interestRate, durationMonths, startDate } = input;
    const principal = amount;
    const monthlyRate = interestRate / 100 / 12;
    let monthlyPayment = 0;
    // Cas sans intérêt
    if (monthlyRate === 0) {
        monthlyPayment = principal / durationMonths;
    }
    else {
        monthlyPayment =
            (principal * monthlyRate) /
                (1 - Math.pow(1 + monthlyRate, -durationMonths));
    }
    const totalToRepay = monthlyPayment * durationMonths;
    const totalInterest = totalToRepay - principal;
    // Calcul date de fin
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return {
        monthlyPayment: round(monthlyPayment),
        totalInterest: round(totalInterest),
        totalToRepay: round(totalToRepay),
        endDate,
    };
}
// helper pour éviter les floats dégueulasses
function round(value, decimals = 2) {
    return Number(value.toFixed(decimals));
}
// Statistics utility
const getProjectFinancials = (project) => {
    const fundedAmount = project.disbursements
        .filter((d) => d.isDisbursed)
        .reduce((sum, d) => sum + d.amount, 0);
    const totalIncome = project.financialEntries
        .filter((e) => e.type === "INCOME")
        .reduce((sum, e) => sum + e.amount, 0);
    const totalExpense = project.financialEntries
        .filter((e) => e.type === "EXPENSE")
        .reduce((sum, e) => sum + e.amount, 0);
    return {
        fundedAmount,
        totalIncome,
        totalExpense,
        netResult: totalIncome - totalExpense,
        isProfitable: totalIncome + fundedAmount > totalExpense,
    };
};
exports.getProjectFinancials = getProjectFinancials;
const getAgeRange = (birthDate) => {
    if (!birthDate)
        return "Non renseigné";
    const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
    if (age < 18)
        return "Moins de 18 ans";
    if (age <= 25)
        return "18 – 25 ans";
    if (age <= 35)
        return "26 – 35 ans";
    if (age <= 50)
        return "36 – 50 ans";
    return "Plus de 50 ans";
};
exports.getAgeRange = getAgeRange;
const aggregate = (groups) => {
    return Object.entries(groups)
        .map(([label, items]) => {
        const totalProjects = items.length;
        const profitableProjects = items.filter(i => i.isProfitable).length;
        return {
            label,
            totalProjects,
            profitableProjects,
            unprofitableProjects: totalProjects - profitableProjects,
            profitabilityRate: Math.round((profitableProjects / totalProjects) * 100),
        };
    })
        .sort((a, b) => b.profitabilityRate - a.profitabilityRate);
};
exports.aggregate = aggregate;
const groupBy = (enriched, key) => {
    return enriched.reduce((acc, p) => {
        const val = String(p[key]);
        if (!acc[val])
            acc[val] = [];
        acc[val].push(p);
        return acc;
    }, {});
};
exports.groupBy = groupBy;
exports.formatProjectTypeLabel = {
    COLLECTIVE: "Collectif",
    INDIVIDUAL: "Individuel",
    ALL: "Aucune restriction"
};
exports.campaignTypeLabel = {
    MONO_PROJECT: "Mono projet",
    MULTI_PROJECT: "Multi projets",
};
exports.genderLabel = {
    MALE: "Homme",
    FEMALE: "Femme",
    ALL: "Aucune restriction",
};
exports.maritalStatusLabel = {
    SINGLE: "Célibataire",
    MARRIED: "Marié(e)",
    DIVORCED: "Divorcé(e)",
    WIDOWED: "Veuf / Veuve",
};
//# sourceMappingURL=functions.js.map