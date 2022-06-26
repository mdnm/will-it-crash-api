import { CheckGuessService } from './check-guess-service/CheckGuessService';
import { LoadPlayerService } from './load-player-service/LoadPlayerService';
import BitcoinPriceHistoryRepository from './repositories/BitcoinPriceHistoryRepository';
import GuessesRepository from './repositories/GuessesRepository';

const bitcoinPriceTableName = process.env.BTCPRICES_TABLE_NAME;
if (!bitcoinPriceTableName) {
    throw new Error('BTCPRICES_TABLE_NAME env variable was not set');
}

const guessesTableName = process.env.GUESSES_TABLE_NAME;
if (!guessesTableName) {
    throw new Error('GUESSES_TABLE_NAME env variable was not set');
}

const bitcoinPriceHistoryRepository = new BitcoinPriceHistoryRepository(bitcoinPriceTableName);
const guessesRepository = new GuessesRepository(guessesTableName);
const checkGuessService = new CheckGuessService(guessesRepository, bitcoinPriceHistoryRepository);
const loadPlayerService = new LoadPlayerService(guessesRepository, bitcoinPriceHistoryRepository);

export const checkGuessServiceHandler = checkGuessService.execute.bind(checkGuessService);
export const loadPlayerServiceHandler = loadPlayerService.execute.bind(loadPlayerService);
