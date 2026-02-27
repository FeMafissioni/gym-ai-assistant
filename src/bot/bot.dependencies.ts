import { AdvanceExercicioUseCase } from "../cases/advanceExercicio/advanceExercicio.cases";
import { FinishSessaoUseCase } from "../cases/finishSessao/finishSessao.cases";
import { GetCurrentExercicioUseCase } from "../cases/getCurrentExercicio/getCurrentExercicio.cases";
import { GetResumoPosTreinoUseCase } from "../cases/getResumoPosTreino/getResumoPosTreino.cases";
import { GetResumoSemanalUseCase } from "../cases/getResumoSemanal/getResumoSemanal.cases";
import { GetSessaoAtivaUseCase } from "../cases/getSessaoAtiva/getSessaoAtiva.cases";
import { GetUserTreinosUseCase } from "../cases/getUserTreinos/getUserTreinos.cases";
import { RegisterExecucaoUseCase } from "../cases/registerExecucao/registerExecucao.cases";
import { CreateTreinosFromParsedJsonUseCase } from "../cases/saveTreinoParseado/saveTreinoParseado.cases";
import { SaveUserUseCase } from "../cases/saveUser/saveUser.cases";
import { StartTreinoUseCase } from "../cases/startTreino/startTreino.cases";
import { TreinoParserService } from "../openai/parser.service";
import { PostTreinoResumoService } from "../openai/postTreinoResumo.service";
import { ResumoSemanalService } from "../openai/resumoSemanal.service";

export interface BotDependencies {
  treinoParserService: TreinoParserService;
  createTreinosFromParsedJsonUseCase: CreateTreinosFromParsedJsonUseCase;
  getSessaoAtivaUseCase: GetSessaoAtivaUseCase;
  startSessionUseCase: StartTreinoUseCase;
  getCurrentExercicioUseCase: GetCurrentExercicioUseCase;
  advanceExercicioUseCase: AdvanceExercicioUseCase;
  finishSessionUseCase: FinishSessaoUseCase;
  registerSerieUseCase: RegisterExecucaoUseCase;
  getUserTreinosUseCase: GetUserTreinosUseCase;
  saveUserUseCase: SaveUserUseCase;
  getResumoPosTreinoUseCase: GetResumoPosTreinoUseCase;
  postTreinoResumoService: PostTreinoResumoService;
  getResumoSemanalUseCase: GetResumoSemanalUseCase;
  resumoSemanalService: ResumoSemanalService;
}

export function createBotDependencies(
  overrides: Partial<BotDependencies> = {}
): BotDependencies {
  const defaults: BotDependencies = {
    treinoParserService: new TreinoParserService(),
    createTreinosFromParsedJsonUseCase: new CreateTreinosFromParsedJsonUseCase(),
    getSessaoAtivaUseCase: new GetSessaoAtivaUseCase(),
    startSessionUseCase: new StartTreinoUseCase(),
    getCurrentExercicioUseCase: new GetCurrentExercicioUseCase(),
    advanceExercicioUseCase: new AdvanceExercicioUseCase(),
    finishSessionUseCase: new FinishSessaoUseCase(),
    registerSerieUseCase: new RegisterExecucaoUseCase(),
    getUserTreinosUseCase: new GetUserTreinosUseCase(),
    saveUserUseCase: new SaveUserUseCase(),
    getResumoPosTreinoUseCase: new GetResumoPosTreinoUseCase(),
    postTreinoResumoService: new PostTreinoResumoService(),
    getResumoSemanalUseCase: new GetResumoSemanalUseCase(),
    resumoSemanalService: new ResumoSemanalService(),
  };

  return { ...defaults, ...overrides };
}

