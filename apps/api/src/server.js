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
  const { login, email, password, name, surname } = req.body;
  if (!login || !email || !password || !name || !surname) return res.status(400).json({ error: 'Uzupełnij wszystkie pola.' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { login, email, passwordHash, name, surname } });
  res.status(201).json({ id: user.id, login: user.login, email: user.email, name: user.name, surname: user.surname });
});

app.get('/api/classes/:classId/summary', async (req, res) => {
  const classData = await prisma.class.findUnique({
    where: { id: req.params.classId },
    include: { chairperson: true, deputy: true, members: { include: { user: true } }, students: true, collections: { include: { contributions: true, students: true }, orderBy: { startsAt: 'desc' } } }
  });
  if (!classData) return res.status(404).json({ error: 'Nie znaleziono klasy.' });
  res.json(classData);
});

app.post('/api/classes', async (req, res) => {
  const { ownerId, name, description, teacher, teacherId, chairpersonName, chairpersonId, deputyName, deputyId } = req.body;
  if (!ownerId || !name || !teacher) return res.status(400).json({ error: 'Właściciel, nazwa klasy i wychowawca są wymagani.' });
  const members = [
    { userId: ownerId, role: 'SKARBNIK' },
    chairpersonId && { userId: chairpersonId, role: 'PRZEWODNICZACY' },
    deputyId && { userId: deputyId, role: 'ZASTEPCA' },
  ].filter(Boolean);
  const created = await prisma.class.create({ data: { ownerId, name, description, teacher, teacherId, chairpersonName, chairpersonId, deputyName, deputyId, members: { create: members.map(({ userId, role }) => ({ user: { connect: { id: userId } }, role })) } } });
  res.status(201).json(created);
});

app.post('/api/classes/:classId/members', async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role) return res.status(400).json({ error: 'Użytkownik i rola są wymagani.' });
  const member = await prisma.classMembership.upsert({ where: { classId_userId: { classId: req.params.classId, userId } }, update: { role }, create: { classId: req.params.classId, userId, role } });
  res.status(201).json(member);
});

app.post('/api/classes/:classId/students', async (req, res) => {
  const { firstName, lastName, parent1, parent2, parent1Phone, parent2Phone, parent1Mail, parent2Mail, active = true } = req.body;
  if (!firstName || !lastName) return res.status(400).json({ error: 'Imię i nazwisko ucznia są wymagane.' });
  const student = await prisma.student.create({ data: { firstName, lastName, parent1, parent2, parent1Phone, parent2Phone, parent1Mail, parent2Mail, active, classId: req.params.classId } });
  res.status(201).json(student);
});

app.post('/api/classes/:classId/collections', async (req, res) => {
  const { name, schoolYear, startsAt, endsAt, target, studentIds = [] } = req.body;
  const collection = await prisma.collection.create({ data: { name, schoolYear, startsAt: new Date(startsAt), endsAt: new Date(endsAt), target, classId: req.params.classId, students: { connect: studentIds.map((id) => ({ id })) } } });
  res.status(201).json(collection);
});

app.post('/api/collections/:collectionId/contributions', async (req, res) => {
  const { studentId, amount, bankId, paidAt } = req.body;
  if (!studentId || !amount) return res.status(400).json({ error: 'Uczeń i kwota wpłaty są wymagani.' });
  const contribution = await prisma.contribution.create({ data: { studentId, collectionId: req.params.collectionId, amount, bankId, paidAt: paidAt ? new Date(paidAt) : undefined } });
  res.status(201).json(contribution);
});

app.listen(port, () => console.log(`Skarbona API działa na porcie ${port}`));
