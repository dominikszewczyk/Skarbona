import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, service: 'skarbona-api' }));

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Uzupełnij wszystkie pola.' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });
  res.status(201).json({ id: user.id, email: user.email, name: user.name });
});

app.get('/api/classes/:classId/summary', async (req, res) => {
  const classData = await prisma.class.findUnique({
    where: { id: req.params.classId },
    include: { students: true, collections: { include: { contributions: true, students: true }, orderBy: { startsAt: 'desc' } } }
  });
  if (!classData) return res.status(404).json({ error: 'Nie znaleziono klasy.' });
  res.json(classData);
});

app.post('/api/classes', async (req, res) => {
  const { ownerId, name, description, teacher, council } = req.body;
  const created = await prisma.class.create({ data: { ownerId, name, description, teacher, council } });
  res.status(201).json(created);
});

app.post('/api/classes/:classId/students', async (req, res) => {
  const { firstName, lastName, parentPhone, active = true } = req.body;
  const student = await prisma.student.create({ data: { firstName, lastName, parentPhone, active, classId: req.params.classId } });
  res.status(201).json(student);
});

app.post('/api/classes/:classId/collections', async (req, res) => {
  const { name, schoolYear, startsAt, endsAt, target, studentIds = [] } = req.body;
  const collection = await prisma.collection.create({ data: { name, schoolYear, startsAt: new Date(startsAt), endsAt: new Date(endsAt), target, classId: req.params.classId, students: { connect: studentIds.map((id) => ({ id })) } } });
  res.status(201).json(collection);
});

app.listen(port, () => console.log(`Skarbona API działa na porcie ${port}`));
