import express, {Application, Request, Response} from 'express';
import * as path from 'path';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app: Application = express();
const server = http.createServer(app);
const port = 3000;

app.use(express.static(path.join(__dirname, '../public')));

// mongodb
mongoose
    .connect('mongodb://localhost:27017/emojiAppDB')
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('Error connecting to MongoDB:', err));

const { Schema } = mongoose;

const appStatsSchema = new Schema({
    key: String,
    value: Number,
});

// the third arg is the true name in mongodb, since mongoose makes first value plural and lowercase to search the collection
const appstats = mongoose.model('appstats', appStatsSchema, 'appstats');  

async function getEmojiCopyCount() {
    try {
      const emojiCopyCount = await appstats.findOne({ key: 'emojiCopyCount' });
      return emojiCopyCount ? emojiCopyCount.value : 'undefined';
    } catch (err) {
      console.error('Error querying emojiCopyCount:', err);
    }
}

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoint to get emoji copy count
app.get('/api/emojiCopyCount', async (req: Request, res: Response) => {
    let emojiCopyCount = await getEmojiCopyCount();
    res.json({'emojiCopyCount': emojiCopyCount});
});

const io = new SocketIOServer(server);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('incrementCopyCount', async () => {
        try {

          // Increment emojiCopyCount in DB
          await appstats.updateOne({ key: 'emojiCopyCount' }, { $inc: { value: 1 } });
          const updatedCopyCount = await getEmojiCopyCount();
        
          // Emit the updated count to all other clients (other than the client causing this update)
          socket.broadcast.emit('emojiCountUpdated', updatedCopyCount ? updatedCopyCount : null);
        } catch (err) {
          console.error('Error updating emoji copy count:', err);
        }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});