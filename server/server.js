const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = 3000;
const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'artquest_db';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cors());
app.use(express.static('public'));

let db, scenesCollection, charactersCollection, relationsCollection,
    itemsCollection, galleryCollection, songsCollection;

async function seedDefaultSongs() {
  try {
    const songsCollection = db.collection('songs');
    const count = await songsCollection.countDocuments();
    if (count === 0) {
      await songsCollection.insertMany([
        { title: "เบอร์สอง", artist: "PUN", url: "https://youtu.be/MDpC3uDx0sY", isFavorite: false, createdAt: new Date() }
      ]);
      console.log('เพิ่มเพลงตั้งต้นสำเร็จ!');
    }
  } catch (err) {
    console.error('ไม่สามารถเพิ่มเพลงตั้งต้นได้:', err);
  }
}

async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    scenesCollection = db.collection('scenes');
    charactersCollection = db.collection('characters');
    relationsCollection = db.collection('relations');
    itemsCollection = db.collection('items');
    galleryCollection = db.collection('oc_gallery');
    songsCollection = db.collection('songs');
    
    console.log('เชื่อมต่อ MongoDB สำเร็จ!');
    await seedDefaultSongs();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', err);
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- CHARACTERS API ---
app.get('/api/characters', async (req, res) => {
  const data = await charactersCollection.find({}).toArray();
  res.json(data);
});

app.post('/api/characters', async (req, res) => {
  const result = await charactersCollection.insertOne({ ...req.body, createdAt: new Date() });
  res.status(201).json(result);
});

app.patch('/api/characters/:id', async (req, res) => {
  const { name, nickname, role, category, age, height, weight, bloodType, avatarUrl, musicUrl, personalInfo, personality, background } = req.body;
  await charactersCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { name, nickname, role, category, age, height, weight, bloodType, avatarUrl, musicUrl, personalInfo, personality, background } }
  );
  res.json({ message: 'Updated' });
});

app.delete('/api/characters/:id', async (req, res) => {
  await charactersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
  res.status(204).end();
});

// --- OC GALLERY API ---
app.get('/api/gallery/:charId', async (req, res) => {
  const data = await galleryCollection.find({ charId: req.params.charId }).sort({ createdAt: -1 }).toArray();
  res.json(data);
});

app.post('/api/gallery', async (req, res) => {
  const { charId, imageUrl, caption } = req.body;
  const result = await galleryCollection.insertOne({ charId, imageUrl, caption, createdAt: new Date() });
  res.status(201).json(result);
});

app.delete('/api/gallery/:id', async (req, res) => {
  await galleryCollection.deleteOne({ _id: new ObjectId(req.params.id) });
  res.status(204).end();
});

// --- ITEMS API ---
app.get('/api/items', async (req, res) => res.json(await itemsCollection.find({}).toArray()));
app.post('/api/items', async (req, res) => { const r = await itemsCollection.insertOne({ ...req.body, createdAt: new Date() }); res.status(201).json(r); });
app.patch('/api/items/:id', async (req, res) => { await itemsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body }); res.json({ message: 'Updated' }); });
app.delete('/api/items/:id', async (req, res) => { await itemsCollection.deleteOne({ _id: new ObjectId(req.params.id) }); res.status(204).end(); });

// --- SCENES (LORE) API ---
app.get('/api/scenes', async (req, res) => res.json(await scenesCollection.find({}).toArray()));
app.post('/api/scenes', async (req, res) => { const r = await scenesCollection.insertOne({ ...req.body, createdAt: new Date() }); res.status(201).json(r); });
app.patch('/api/scenes/:id', async (req, res) => { await scenesCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body }); res.json({ message: 'Updated' }); });
app.delete('/api/scenes/:id', async (req, res) => { await scenesCollection.deleteOne({ _id: new ObjectId(req.params.id) }); res.status(204).end(); });

// --- SONGS (PLAYLIST) API ---
app.get('/api/songs', async (req, res) => res.json(await songsCollection.find({}).toArray()));
app.post('/api/songs', async (req, res) => { const r = await songsCollection.insertOne({ ...req.body, createdAt: new Date() }); res.status(201).json(r); });
app.patch('/api/songs/:id', async (req, res) => { await songsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body }); res.json({ message: 'Updated' }); });
app.delete('/api/songs/:id', async (req, res) => { await songsCollection.deleteOne({ _id: new ObjectId(req.params.id) }); res.status(204).end(); });

// --- RELATIONS API ---
app.get('/api/relations', async (req, res) => res.json(await relationsCollection.find({}).toArray()));
app.post('/api/relations', async (req, res) => { const r = await relationsCollection.insertOne({ ...req.body, createdAt: new Date() }); res.status(201).json(r); });
app.delete('/api/relations/:id', async (req, res) => { await relationsCollection.deleteOne({ _id: new ObjectId(req.params.id) }); res.status(204).end(); });

// --- PROFILE API ---
app.get('/api/profile', async (req, res) => { const p = await db.collection('profile').findOne({}); res.json(p || {}); });
app.put('/api/profile', async (req, res) => { await db.collection('profile').updateOne({}, { $set: req.body }, { upsert: true }); res.json({ message: 'Updated' }); });

connectDB();