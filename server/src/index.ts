import app from './app';
import { env } from './lib/env';

app.listen(env.port, () => console.log(`MealVote API on http://localhost:${env.port}`));
