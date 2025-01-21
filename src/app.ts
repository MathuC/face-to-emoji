import express, {Application, Request, Response} from 'express';
import * as path from 'path';

const app: Application = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});