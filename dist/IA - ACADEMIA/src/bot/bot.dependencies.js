"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBotDependencies = createBotDependencies;
const advanceExercicio_cases_1 = require("../cases/advanceExercicio/advanceExercicio.cases");
const finishSessao_cases_1 = require("../cases/finishSessao/finishSessao.cases");
const getCurrentExercicio_cases_1 = require("../cases/getCurrentExercicio/getCurrentExercicio.cases");
const getResumoPosTreino_cases_1 = require("../cases/getResumoPosTreino/getResumoPosTreino.cases");
const getResumoSemanal_cases_1 = require("../cases/getResumoSemanal/getResumoSemanal.cases");
const getSessaoAtiva_cases_1 = require("../cases/getSessaoAtiva/getSessaoAtiva.cases");
const getUserTreinos_cases_1 = require("../cases/getUserTreinos/getUserTreinos.cases");
const registerExecucao_cases_1 = require("../cases/registerExecucao/registerExecucao.cases");
const saveTreinoParseado_cases_1 = require("../cases/saveTreinoParseado/saveTreinoParseado.cases");
const saveUser_cases_1 = require("../cases/saveUser/saveUser.cases");
const startTreino_cases_1 = require("../cases/startTreino/startTreino.cases");
const parser_service_1 = require("../openai/parser.service");
const postTreinoResumo_service_1 = require("../openai/postTreinoResumo.service");
const resumoSemanal_service_1 = require("../openai/resumoSemanal.service");
function createBotDependencies(overrides = {}) {
    const defaults = {
        treinoParserService: new parser_service_1.TreinoParserService(),
        createTreinosFromParsedJsonUseCase: new saveTreinoParseado_cases_1.CreateTreinosFromParsedJsonUseCase(),
        getSessaoAtivaUseCase: new getSessaoAtiva_cases_1.GetSessaoAtivaUseCase(),
        startSessionUseCase: new startTreino_cases_1.StartTreinoUseCase(),
        getCurrentExercicioUseCase: new getCurrentExercicio_cases_1.GetCurrentExercicioUseCase(),
        advanceExercicioUseCase: new advanceExercicio_cases_1.AdvanceExercicioUseCase(),
        finishSessionUseCase: new finishSessao_cases_1.FinishSessaoUseCase(),
        registerSerieUseCase: new registerExecucao_cases_1.RegisterExecucaoUseCase(),
        getUserTreinosUseCase: new getUserTreinos_cases_1.GetUserTreinosUseCase(),
        saveUserUseCase: new saveUser_cases_1.SaveUserUseCase(),
        getResumoPosTreinoUseCase: new getResumoPosTreino_cases_1.GetResumoPosTreinoUseCase(),
        postTreinoResumoService: new postTreinoResumo_service_1.PostTreinoResumoService(),
        getResumoSemanalUseCase: new getResumoSemanal_cases_1.GetResumoSemanalUseCase(),
        resumoSemanalService: new resumoSemanal_service_1.ResumoSemanalService(),
    };
    return { ...defaults, ...overrides };
}
