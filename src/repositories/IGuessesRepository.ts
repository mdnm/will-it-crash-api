import Guess from '../models/Guess';

export default interface IGuessesRepository {
    getPlayerGuesses(playerId: string): Promise<Guess[]>;
    createGuess(guessData: Guess): Promise<void>;
}
