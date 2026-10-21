import 'dotenv/config';
import app, { connectDB } from './app.js';

const PORT = Number(process.env.PORT || 5000);

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`)))
  .catch((e) => {
    console.error('Could not connect to MongoDB:', e.message);
    process.exit(1);
  });
