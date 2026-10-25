// Seed de la cuenta demo de FinanzApp (idempotente).
// Ejecutar dentro del contenedor de Mongo con mongosh.

const EMAIL = "demo@finanzapp.com";
const now = new Date();
const Y = now.getFullYear();
const M = now.getMonth() + 1;
const TODAY = now.getDate();

// RNG determinista para que el seed sea reproducible
let seed = 20261025;
function rnd() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function money(base, pct) {
  const v = base * (1 + (rnd() * 2 - 1) * pct);
  return Math.round(v / 100) * 100;
}

// Últimos 12 meses, del más viejo al actual
const months = [];
for (let i = 11; i >= 0; i--) {
  const d = new Date(Y, M - 1 - i, 1);
  months.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
}

// ---------- limpieza ----------
const prev = db.users.findOne({ email: EMAIL });
if (prev) {
  const oldId = prev._id;
  const oldServices = db.services.find({ userId: oldId }).toArray().map((s) => s._id);
  db.pagomensuals.deleteMany({ serviceId: { $in: oldServices } });
  db.services.deleteMany({ userId: oldId });
  db.categories.deleteMany({ userId: oldId });
  const oldCredits = db.credits.find({ userId: oldId }).toArray().map((c) => c._id);
  db.abonocapitals.deleteMany({ creditId: { $in: oldCredits } });
  db.credits.deleteMany({ userId: oldId });
  db.notificationlogs.deleteMany({ userId: oldId });
  db.users.deleteOne({ _id: oldId });
  print("· datos previos de la demo eliminados");
}

// ---------- usuario ----------
const userId = new ObjectId();
const uid = userId.toString();

db.users.insertOne({
  _id: userId,
  id: uid,
  name: "Camila Restrepo",
  email: EMAIL,
  whatsappVerified: false,
  monthlyBudget: 5200000,
  montosOcultos: false,
  language: "es",
  createdAt: new Date(Y - 2, 0, 15, 9, 0, 0),
  updatedAt: new Date(),
  __v: 0,
});

// ---------- categorías ----------
const categories = [
  { name: "Hogar", color: "#6366f1" },
  { name: "Servicios públicos", color: "#0ea5e9" },
  { name: "Transporte", color: "#f59e0b" },
  { name: "Alimentación", color: "#10b981" },
  { name: "Salud", color: "#ef4444" },
  { name: "Educación", color: "#8b5cf6" },
  { name: "Entretenimiento", color: "#ec4899" },
  { name: "Financiero", color: "#14b8a6" },
];

const catIds = {};
for (const c of categories) {
  const _id = new ObjectId();
  db.categories.insertOne({ _id, name: c.name, color: c.color, userId, createdAt: new Date(Y - 2, 0, 15), updatedAt: new Date(), __v: 0 });
  catIds[c.name] = _id;
}

// ---------- servicios ----------
// due = día de vencimiento, skipMonths = meses sin pagar (para mostrar vencidos)
const services = [
  { name: "Arriendo apartamento", monto: 1750000, cat: "Hogar", due: 5 },
  { name: "Administración", monto: 320000, cat: "Hogar", due: 3, overdueNow: true },
  { name: "Energía eléctrica", monto: 185000, cat: "Servicios públicos", due: 12, spikeMonth: 9 },
  { name: "Acueducto", monto: 78000, cat: "Servicios públicos", due: 12 },
  { name: "Gas natural", monto: 42000, cat: "Servicios públicos", due: 12 },
  { name: "Internet fibra", monto: 129900, cat: "Servicios públicos", due: 8 },
  { name: "Gasolina", monto: 420000, cat: "Transporte", due: 20 },
  { name: "Parqueadero", monto: 180000, cat: "Transporte", due: 4 },
  { name: "Mercado del mes", monto: 950000, cat: "Alimentación", due: 6 },
  { name: "EPS", monto: 210000, cat: "Salud", due: 10 },
  { name: "Medicina prepagada", monto: 165000, cat: "Salud", due: 10 },
  { name: "Universidad", monto: 890000, cat: "Educación", due: 5 },
  { name: "Netflix", monto: 44900, cat: "Entretenimiento", due: 14 },
  { name: "Spotify", monto: 24900, cat: "Entretenimiento", due: 14 },
  { name: "Gimnasio", monto: 135000, cat: "Entretenimiento", due: 28 },
  { name: "Cuota tarjeta de crédito", monto: 380000, cat: "Financiero", due: 15 },
  { name: "Seguro de vida", monto: 95000, cat: "Financiero", due: 30 },
];

const methods = ["TARJETA_DEBITO", "TARJETA_CREDITO", "TRANSFERENCIA", "EFECTIVO"];
let totalPagos = 0;

for (const s of services) {
  const serviceId = new ObjectId();
  const pagos = [];
  let lastPaid = null;
  let anyOverdue = false;
  let currentUnpaid = false;

  for (const mo of months) {
    const isCurrent = mo.y === Y && mo.m === M;
    let paid = true;

    if (s.overdueNow && isCurrent) {
      paid = false;
    } else if (isCurrent && s.due > TODAY) {
      paid = false;
      currentUnpaid = true;
    }

    if (!paid) {
      if (isCurrent) currentUnpaid = true;
      else anyOverdue = true;
      continue;
    }

    let valor = money(s.monto, 0.05);
    if (s.spikeMonth && mo.m === s.spikeMonth) valor = Math.round(s.monto * 1.62);

    const day = Math.max(1, Math.min(s.due - Math.floor(rnd() * 3), 28));
    const fecha = new Date(mo.y, mo.m - 1, day, 10, 30, 0);

    pagos.push({
      _id: new ObjectId(),
      serviceId,
      mes: mo.m,
      año: mo.y,
      valorPagado: valor,
      fechaPago: fecha,
      metodoPago: methods[Math.floor(rnd() * methods.length)],
      notas: "",
      createdAt: fecha,
      updatedAt: fecha,
      __v: 0,
    });
    lastPaid = fecha;
    totalPagos++;
  }

  db.pagomensuals.insertMany(pagos);

  const estado = anyOverdue || s.overdueNow ? "VENCIDO" : currentUnpaid ? "PENDIENTE" : "PAGADO";
  const proximo = new Date(Y, M - 1, s.due);
  if (proximo < new Date(Y, M - 1, TODAY)) proximo.setMonth(proximo.getMonth() + 1);

  db.services.insertOne({
    _id: serviceId,
    name: s.name,
    montoEstimado: s.monto,
    fechaUltimoPago: lastPaid,
    estado,
    proximoPago: proximo,
    fechaLimitePago: new Date(Y, M - 1, s.due),
    diasRecordatorio: [3, 1],
    categoryId: catIds[s.cat],
    userId,
    createdAt: new Date(Y - 2, 0, 20),
    updatedAt: new Date(),
    __v: 0,
  });
}

// ---------- crédito + abonos ----------
const creditId = new ObjectId();
const valorInicial = 180000000;
const saldoActual = 142500000;
db.credits.insertOne({
  _id: creditId,
  userId,
  nombre: "Crédito hipotecario",
  valorInicial,
  saldoActual,
  tasaInteresAnual: 11.2,
  plazoMeses: 240,
  cuotaMensual: 1940000,
  subsidioPorcentaje: 0,
  fechaInicio: new Date(2023, 2, 1),
  estado: "ACTIVO",
  tipoPago: "MENSUAL",
  createdAt: new Date(2023, 2, 1),
  updatedAt: new Date(),
  __v: 0,
});

const abonos = [
  { monto: 8000000, fecha: new Date(Y, M - 8, 15), saldoAnterior: valorInicial, saldoNuevo: 165000000 },
  { monto: 12000000, fecha: new Date(Y, M - 5, 12), saldoAnterior: 165000000, saldoNuevo: 152000000 },
  { monto: 9500000, fecha: new Date(Y, M - 2, 18), saldoAnterior: 152000000, saldoNuevo: 142500000 },
];

for (const a of abonos) {
  db.abonocapitals.insertOne({
    _id: new ObjectId(),
    creditId,
    monto: a.monto,
    fecha: a.fecha,
    saldoAnterior: a.saldoAnterior,
    saldoNuevo: a.saldoNuevo,
    cuotaAnterior: 2060000,
    cuotaNueva: 1940000,
    plazoAnterior: 252,
    plazoNuevo: 240,
    createdAt: a.fecha,
    updatedAt: a.fecha,
    __v: 0,
  });
}

print("✔ cuenta demo lista");
print("  usuario: " + uid);
print("  categorías: " + categories.length);
print("  servicios: " + services.length);
print("  pagos: " + totalPagos);
print("  créditos: 1 (con 3 abonos)");
