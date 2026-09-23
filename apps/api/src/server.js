import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const databaseHost = String(process.env.DB_HOST || 'localhost').trim();
if (!databaseHost) throw new Error('DB_HOST is required. Set it to the PostgreSQL container name or host address.');
const databaseHostWithPort = databaseHost.includes(':') ? databaseHost : `${databaseHost}:${process.env.DB_PORT || '5432'}`;
const configuredDatabaseUrl = `postgresql://${process.env.DB_USER || 'skarbona'}:${process.env.DB_PASSWORD || 'skarbona'}@${databaseHostWithPort}/${process.env.DB_NAME || 'skarbona'}?schema=${process.env.DB_SCHEMA || 'skarbona'}`;
process.env.DATABASE_URL = configuredDatabaseUrl;

const app = express();
const prisma = new PrismaClient();
const port = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: 'skarbona-api', database: 'connected' });
  } catch (error) {
    res.status(503).json({ ok: false, service: 'skarbona-api', database: 'unavailable', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { login, email, password, name, surname } = req.body;
  if (!login || !email || !password || !name || !surname) return res.status(400).json({ error: 'Uzupełnij wszystkie pola.' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { login, email, passwordHash, name, surname } });
  res.status(201).json({ id: user.id, login: user.login, email: user.email, name: user.name, surname: user.surname });
});

app.get('/api/users/by-login/:login', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { login: req.params.login }, select: { id: true, login: true, name: true, surname: true, role: true } });
  if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika.' });
  res.json(user);
});

app.get('/api/users/by-login/:login/classes', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { login: req.params.login } });
  if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika.' });
  const classes = await prisma.class.findMany({
    where: { ownerId: user.id },
    include: { teacherUser: true, chairperson: true, deputy: true, students: true, collections: { include: { contributions: true, students: true, transactions: { orderBy: { transactionDate: 'desc' } } }, orderBy: { startsAt: 'desc' } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(classes);
});

app.get('/api/classes/:classId/summary', async (req, res) => {
  const classData = await prisma.class.findUnique({
    where: { id: req.params.classId },
    include: { teacherUser: true, chairperson: true, deputy: true, members: { include: { user: true } }, students: true, collections: { include: { contributions: true, students: true, transactions: { orderBy: { transactionDate: 'desc' } } }, orderBy: { startsAt: 'desc' } } }
  });
  if (!classData) return res.status(404).json({ error: 'Nie znaleziono klasy.' });
  res.json(classData);
});

app.get('/api/classes/:classId/transactions', async (req, res) => {
  const references = String(req.query.references || '').split(',').map((reference) => reference.trim()).filter(Boolean);
  const transactions = await prisma.transaction.findMany({ where: { classId: req.params.classId, ...(references.length ? { referenceNumber: { in: references } } : {}) }, include: { collection: true, student: true }, orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }] });
  res.json(transactions);
});

app.post('/api/classes/:classId/transactions/import', async (req, res) => {
  const { bank = 'PEKAO', transactions = [] } = req.body;
  if (bank !== 'PEKAO') return res.status(400).json({ error: 'Ten bank nie jest jeszcze obsługiwany.' });
  if (!Array.isArray(transactions) || !transactions.length) return res.status(400).json({ error: 'Brak transakcji do zapisania.' });
  const classData = await prisma.class.findUnique({ where: { id: req.params.classId }, select: { id: true } });
  if (!classData) return res.status(404).json({ error: 'Nie znaleziono klasy.' });
  const references = [...new Set(transactions.map((transaction) => String(transaction.referenceNumber || '').trim()).filter(Boolean))];
  const existing = await prisma.transaction.findMany({ where: { referenceNumber: { in: references } }, select: { referenceNumber: true } });
  const existingReferences = new Set(existing.map((transaction) => transaction.referenceNumber));
  const seenReferences = new Set(existingReferences);
  const fresh = transactions.filter((transaction) => { const reference = String(transaction.referenceNumber || '').trim(); if (!reference || seenReferences.has(reference)) return false; seenReferences.add(reference); return true; });
  const invalid = fresh.filter((transaction) => !transaction.transactionDate || !transaction.counterparty || !transaction.title || !transaction.amount || !['PRZYCHOD', 'WYDATEK'].includes(transaction.type));
  if (invalid.length) return res.status(400).json({ error: 'Każda transakcja musi mieć numer referencyjny, datę, nadawcę/odbiorcę, tytuł, kwotę i typ.' });
  const created = await prisma.$transaction(fresh.map((transaction) => prisma.transaction.create({ data: { referenceNumber: transaction.referenceNumber, bank, transactionDate: new Date(transaction.transactionDate), counterparty: transaction.counterparty || null, title: transaction.title, amount: transaction.amount, type: transaction.type, classId: req.params.classId, collectionId: transaction.collectionId || null, studentId: transaction.studentId || null } })));
  res.status(201).json({ created, skipped: transactions.length - fresh.length });
});

app.post('/api/classes', async (req, res) => {
  const { ownerId, name, schoolYear, description, teacher, teacherId, chairpersonName, chairpersonId, deputyName, deputyId } = req.body;
  if (!ownerId || !name || !teacher) return res.status(400).json({ error: 'Właściciel, nazwa klasy i wychowawca są wymagani.' });
  const members = [
    { userId: ownerId, role: 'SKARBNIK' },
    chairpersonId && { userId: chairpersonId, role: 'PRZEWODNICZACY' },
    deputyId && { userId: deputyId, role: 'ZASTEPCA' },
  ].filter(Boolean);
  const created = await prisma.class.create({ data: { ownerId, name, schoolYear: schoolYear || undefined, description, teacher, teacherId, chairpersonName, chairpersonId, deputyName, deputyId, members: { create: members.map(({ userId, role }) => ({ user: { connect: { id: userId } }, role })) } } });
  res.status(201).json(created);
});

app.put('/api/classes/:classId', async (req, res) => {
  const { name, schoolYear, description, teacher, teacherId, chairpersonName, chairpersonId, deputyName, deputyId } = req.body;
  const updated = await prisma.class.update({ where: { id: req.params.classId }, data: { name, schoolYear, description, teacher, teacherId: teacherId || null, chairpersonName: chairpersonName || null, chairpersonId: chairpersonId || null, deputyName: deputyName || null, deputyId: deputyId || null } });
  res.json(updated);
});

app.post('/api/classes/:classId/members', async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role) return res.status(400).json({ error: 'Użytkownik i rola są wymagani.' });
  const member = await prisma.classMembership.upsert({ where: { classId_userId: { classId: req.params.classId, userId } }, update: { role }, create: { classId: req.params.classId, userId, role } });
  res.status(201).json(member);
});

app.post('/api/classes/:classId/students', async (req, res) => {
  const { firstName, lastName, parent1, parent2, parent1Phone, parent2Phone, parent1Mail, parent2Mail, gender = 'NIE_PODANO', active = true } = req.body;
  if (!firstName || !lastName) return res.status(400).json({ error: 'Imię i nazwisko ucznia są wymagane.' });
  const student = await prisma.student.create({ data: { firstName, lastName, parent1, parent2, parent1Phone, parent2Phone, parent1Mail, parent2Mail, gender, active, classId: req.params.classId } });
  res.status(201).json(student);
});

app.put('/api/classes/:classId/students/:studentId', async (req, res) => {
  const { firstName, lastName, parent1, parent2, parent1Phone, parent2Phone, parent1Mail, parent2Mail, gender, active } = req.body;
  const student = await prisma.student.update({ where: { id: req.params.studentId }, data: { firstName, lastName, parent1, parent2, parent1Phone, parent2Phone, parent1Mail, parent2Mail, gender, active } });
  res.json(student);
});

app.patch('/api/classes/:classId/students/:studentId/status', async (req, res) => {
  const student = await prisma.student.update({ where: { id: req.params.studentId, classId: req.params.classId }, data: { active: Boolean(req.body.active) } });
  res.json(student);
});

app.post('/api/classes/:classId/collections', async (req, res) => {
  const { name, startsAt, endsAt, target, studentIds = [] } = req.body;
  const classData = await prisma.class.findUnique({ where: { id: req.params.classId }, select: { schoolYear: true } });
  if (!classData) return res.status(404).json({ error: 'Nie znaleziono klasy.' });
  if (!name || !startsAt || !target) return res.status(400).json({ error: 'Nazwa, data rozpoczęcia i kwota są wymagane.' });
  const collectionData = { name, schoolYear: classData.schoolYear, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : null, target, classId: req.params.classId, students: { connect: studentIds.map((id) => ({ id })) } };
  const collection = await prisma.collection.create({ data: collectionData });
  res.status(201).json(await prisma.collection.findUnique({ where: { id: collection.id }, include: { contributions: true, students: true } }));
});

app.put('/api/classes/:classId/collections/:collectionId', async (req, res) => {
  const { name, startsAt, endsAt, target, studentIds } = req.body;
  if (!name || !startsAt || !target) return res.status(400).json({ error: 'Nazwa, data rozpoczęcia i kwota są wymagane.' });
  const existing = await prisma.collection.findFirst({ where: { id: req.params.collectionId, classId: req.params.classId } });
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono zbiórki.' });
  const collectionData = { name, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : null, target, ...(Array.isArray(studentIds) ? { students: { set: studentIds.map((id) => ({ id })) } } : {}) };
  const collection = await prisma.collection.update({ where: { id: existing.id }, data: collectionData });
  res.json(await prisma.collection.findUnique({ where: { id: collection.id }, include: { contributions: true, students: true } }));
});

app.post('/api/collections/:collectionId/contributions', async (req, res) => {
  const { studentId, amount, bankId, paidAt } = req.body;
  if (!studentId || !amount) return res.status(400).json({ error: 'Uczeń i kwota wpłaty są wymagani.' });
  const contribution = await prisma.contribution.create({ data: { studentId, collectionId: req.params.collectionId, amount, bankId, paidAt: paidAt ? new Date(paidAt) : undefined } });
  res.status(201).json(contribution);
});

app.listen(port, () => console.log(`Skarbona API działa na porcie ${port}`));
