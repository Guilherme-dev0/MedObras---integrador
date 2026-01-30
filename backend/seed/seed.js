import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const BASE_URL = process.env.API_URL || "http://localhost:8080";

function gerarCpfValido() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += base[i] * (10 - i);
  let d1 = (soma * 10) % 11;
  if (d1 === 10) d1 = 0;
  const cpf10 = base.concat(d1);
  soma = 0;
  for (let i = 0; i < 10; i++) soma += cpf10[i] * (11 - i);
  let d2 = (soma * 10) % 11;
  if (d2 === 10) d2 = 0;
  const cpf = cpf10.concat(d2).join("");
  return cpf;
}

async function ensureEmpresa() {
  const cnpj = "11222333000181";
  const email = "seed@medobras.local";
  const telefone = "11987654321";
  const nome = "Empresa Seed";
  const senha = "123456";
  const licenca = "9999";

  const senhaHash = await bcrypt.hash(senha, 8);

  let empresa = await prisma.empresa.findUnique({ where: { cnpj } });
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: { nome, cnpj, telefone, email, senha: senhaHash, licenca },
    });
  } else {
    // garante dados consistentes para login
    await prisma.empresa.update({
      where: { id: empresa.id },
      data: { licenca, senha: senhaHash },
    });
  }
  return { empresa, credenciais: { cnpj, senha, licenca } };
}

async function ensureEmpresaCustom({ cnpj, email, telefone, nome, senha, licenca }) {
  const senhaHash = await bcrypt.hash(senha, 8);
  let empresa = await prisma.empresa.findUnique({ where: { cnpj } });
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: { nome, cnpj, telefone, email, senha: senhaHash, licenca },
    });
  } else {
    await prisma.empresa.update({
      where: { id: empresa.id },
      data: { licenca, senha: senhaHash },
    });
  }
  return { empresa, credenciais: { cnpj, senha, licenca } };
}

async function http(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} => ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const { empresa, credenciais } = await ensureEmpresa();
  console.log("✅ Empresa pronta:", empresa.id);

  // LOGIN
  const login = await http("POST", "/empresas/login", {
    cnpj: credenciais.cnpj,
    senha: credenciais.senha,
    licenca: credenciais.licenca,
  });
  const token = login.token;
  console.log("🔐 Token obtido:", token ? "OK" : "FALHA");

  // PRODUTO
  const produto = await http("POST", "/produtos", { nome: "Box Temperado 8mm" }, token);
  console.log("📦 Produto criado:", produto.id);

  // CLIENTE
  const cliente = await http(
    "POST",
    "/clientes",
    { nome: "Cliente Seed", telefone: "11999999999", cpf: gerarCpfValido() },
    token
  );
  console.log("👤 Cliente criado:", cliente.id);

  // ENDEREÇO
  const endereco = await http(
    "POST",
    "/enderecos",
    {
      clienteId: cliente.id,
      logradouro: "Rua das Amostras, 100",
      bairro: "Centro",
      cidade: "São Paulo",
      cep: "01001000",
    },
    token
  );
  console.log("🏠 Endereço criado:", endereco.id);

  // MEDIÇÃO (pendente)
  const dt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const medicao = await http(
    "POST",
    "/medicoes",
    {
      clienteId: cliente.id,
      enderecoId: endereco.id,
      produtoId: produto.id,
      dataAgendada: dt,
      descricao: "Medição Seed",
    },
    token
  );
  console.log("📏 Medição criada:", medicao.id);

  // LISTAR PENDENTES
  const pendentes = await http("GET", "/medicoes/pendentes", null, token);
  console.log("🔎 Pendentes:", pendentes.length);

  // CONCLUIR MEDIÇÃO
  const concluida = await http(
    "PUT",
    `/medicoes/${medicao.id}/concluir`,
    { altura: 2.05, largura: 1.20, observacao: "Instalado com sucesso" },
    token
  );
  console.log("✅ Concluída status:", concluida.status);

  // LISTAR CONCLUÍDAS
  const concluidas = await http("GET", "/medicoes/concluidas", null, token);
  console.log("📈 Concluídas:", concluidas.length);

  // ATUALIZAR STATUS (voltar para pendente)
  const backToPending = await http(
    "PATCH",
    `/medicoes/${medicao.id}/status`,
    { status: "pendente" },
    token
  );
  console.log("♻️ Status reaberto:", backToPending.status);

  // EXCLUIR MEDIÇÃO
  await http("DELETE", `/medicoes/${medicao.id}`, null, token);
  console.log("🗑️ Medição excluída");

  // EXCLUIR CLIENTE (deve cascatar endereços/medições restantes)
  await http("DELETE", `/clientes/${cliente.id}`, null, token);
  console.log("🗑️ Cliente excluído (cascade OK)");

  // BATCH SEED ADICIONAL (produtos, clientes, endereços, medições variadas)
  const produtosNomes = [
    "Espelho Bisotado",
    "Janela de Alumínio",
    "Porta de Vidro Temperado",
    "Guarda-Corpo de Vidro",
  ];
  for (const nome of produtosNomes) {
    await prisma.produto.create({ data: { nome, empresaId: empresa.id } });
  }

  const clientes = [];
  for (let i = 0; i < 5; i++) {
    const c = await prisma.cliente.create({
      data: {
        nome: `Cliente ${i + 1}`,
        telefone: `1198${String(300000 + i * 1234).slice(0, 7)}`,
        cpf: gerarCpfValido(),
        empresaId: empresa.id,
      },
    });
    const e = await prisma.endereco.create({
      data: {
        logradouro: `Rua ${String.fromCharCode(65 + i)}, ${100 + i}`,
        bairro: i % 2 === 0 ? "Centro" : "Jardins",
        cidade: "São Paulo",
        cep: `0100${String(100 + i).slice(-3)}0`,
        clienteId: c.id,
      },
    });
    await prisma.medicao.create({
      data: {
        clienteId: c.id,
        enderecoId: e.id,
        empresaId: empresa.id,
        dataAgendada: new Date(Date.now() + i * 48 * 60 * 60 * 1000),
        status: i % 2 === 0 ? "concluída" : "pendente",
        altura: i % 2 === 0 ? 2.1 : null,
        largura: i % 2 === 0 ? 1.1 : null,
        observacao: i % 2 === 0 ? "Concluída" : "Agendada",
        descricao: `Seed batch ${i + 1}`,
      },
    });
    clientes.push(c);
  }

  console.log("🎯 Seed e testes concluídos com sucesso.");

  // ======= AMPLIAR: Múltiplas empresas + isolamento =======
  const { empresa: empresaB, credenciais: credB } = await ensureEmpresaCustom({
    cnpj: "22333444000162",
    email: "seed-b@medobras.local",
    telefone: "11988887777",
    nome: "Empresa Seed B",
    senha: "123456",
    licenca: "8888",
  });
  const loginB = await http("POST", "/empresas/login", {
    cnpj: credB.cnpj,
    senha: credB.senha,
    licenca: credB.licenca,
  });
  const tokenB = loginB.token;
  console.log("🔐 Token empresa B:", tokenB ? "OK" : "FALHA");

  // Criar dados para B
  const prodB = await http("POST", "/produtos", { nome: "Espelho 6mm" }, tokenB);
  const cliB = await http(
    "POST",
    "/clientes",
    { nome: "EmpresaB-Cliente 1", telefone: "11977777777", cpf: gerarCpfValido() },
    tokenB
  );
  const endB = await http(
    "POST",
    "/enderecos",
    {
      clienteId: cliB.id,
      logradouro: "Av. Exemplo, 200",
      bairro: "Jardins",
      cidade: "São Paulo",
      cep: "01415000",
    },
    tokenB
  );
  const dtB1 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const medB1 = await http(
    "POST",
    "/medicoes",
    {
      clienteId: cliB.id,
      enderecoId: endB.id,
      produtoId: prodB.id,
      dataAgendada: dtB1,
      descricao: "Med B1",
    },
    tokenB
  );
  console.log("📏 Medição B1:", medB1.id);

  // Isolamento: tokenA não deve ver dados de B e vice-versa
  const allA = await http("GET", "/medicoes", null, token);
  const allB = await http("GET", "/medicoes", null, tokenB);
  console.log("🔒 Isolamento A:", allA.every((m) => m.empresaId === empresa.id));
  console.log("🔒 Isolamento B:", allB.every((m) => m.empresaId === empresaB.id));

  // Testes de filtro q/de/ate para A
  // Cria duas medições em datas distintas para empresa A
  const cliA = await http(
    "POST",
    "/clientes",
    { nome: "EmpresaA-Cliente Filtro", telefone: "11966666666", cpf: gerarCpfValido() },
    token
  );
  const endA = await http(
    "POST",
    "/enderecos",
    {
      clienteId: cliA.id,
      logradouro: "Rua Filtro, 321",
      bairro: "Centro",
      cidade: "São Paulo",
      cep: "01002000",
    },
    token
  );
  const dtA1 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
  const dtA2 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const medA1 = await http(
    "POST",
    "/medicoes",
    {
      clienteId: cliA.id,
      enderecoId: endA.id,
      dataAgendada: dtA1.toISOString(),
      descricao: "Filtro A1",
    },
    token
  );
  const medA2 = await http(
    "POST",
    "/medicoes",
    {
      clienteId: cliA.id,
      enderecoId: endA.id,
      dataAgendada: dtA2.toISOString(),
      descricao: "Filtro A2",
    },
    token
  );
  // Concluir A1 para aparecer em concluídas
  await http("PUT", `/medicoes/${medA1.id}/concluir`, { altura: 2.0, largura: 1.0 }, token);

  function fmt(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const de = fmt(new Date(Date.now()));
  const ate = fmt(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

  const concluidasRange = await http("GET", `/medicoes/concluidas?de=${de}&ate=${ate}`, null, token);
  console.log("📅 Concluídas no intervalo:", concluidasRange.length);

  const concluidasBusca = await http("GET", `/medicoes/concluidas?q=Filtro`, null, token);
  console.log("🔎 Concluídas com q=Filtro:", concluidasBusca.length);

  // Verificação de erro padronizado ao tentar acessar recurso de A com token B
  try {
    await http("GET", `/medicoes/${medA2.id}`, null, tokenB);
  } catch (err) {
    console.log("🚫 Acesso indevido com token B (esperado):", String(err.message).includes("404"));
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
