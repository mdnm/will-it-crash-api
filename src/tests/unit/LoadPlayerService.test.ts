import { LoadPlayerService } from '../../load-player-service/LoadPlayerService';
import InMemoryBitcoinPriceHistoryRepository from '../../repositories/InMemoryBitcoinPriceHistoryRepository';
import InMemoryGuessesRepository from '../../repositories/InMemoryGuessesRepository';
import eventFactory from '../utils/eventFactory';

describe('Check Guess Service Unit tests', function () {
    let loadPlayerService: LoadPlayerService;
    let inMemoryGuessesRepository: InMemoryGuessesRepository;
    let inMemoryBitcoinPriceHistoryRepository: InMemoryBitcoinPriceHistoryRepository;

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();

        inMemoryGuessesRepository = new InMemoryGuessesRepository();
        inMemoryBitcoinPriceHistoryRepository = new InMemoryBitcoinPriceHistoryRepository();
        loadPlayerService = new LoadPlayerService(inMemoryGuessesRepository, inMemoryBitcoinPriceHistoryRepository);
    });

    it('should return status 405 given the method is not GET', async () => {
        const event = eventFactory({
            path: '/load-player',
            method: 'POST',
            body: null,
        });
        const result = await loadPlayerService.execute(event);

        expect(result.statusCode).toEqual(405);
    });

    it('should return status 200, the playerId and the current BTC price data', async () => {
        const event = eventFactory({
            path: '/load-player',
            method: 'GET',
            body: null,
        });
        const result = await loadPlayerService.execute(event);

        expect(result.statusCode).toEqual(200);
        expect(JSON.parse(result.body)).toMatchObject({
            playerId: expect.any(String),
            btcPrice: expect.any(Number),
            timestamp: expect.any(Number),
        });
    });
});
