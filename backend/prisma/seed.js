
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Limpar banco de dados (ordem inversa para respeitar chaves estrangeiras)
  await prisma.medicao.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.endereco.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.empresa.deleteMany();

  console.log('🧹 Banco de dados limpo.');

  // 2. Criar Empresa
  const senhaHash = await bcrypt.hash('123456', 8);
  const empresa = await prisma.empresa.create({
    data: {
      nome: 'Empresa Teste Ltda',
      cnpj: '12345678000199', // CNPJ fictício válido para testes
      email: 'teste@medobras.com',
      telefone: '11999999999',
      senha: senhaHash,
      licenca: '1234'
    }
  });

  console.log(`🏢 Empresa criada: ${empresa.nome} (Licença: ${empresa.licenca})`);

  // 3. Criar Cliente
  const cliente = await prisma.cliente.create({
    data: {
      nome: 'João da Silva',
      cpf: '111.222.333-44',
      telefone: '11988888888',
      email: 'joao@email.com',
      empresaId: empresa.id
    }
  });

  console.log(`👤 Cliente criado: ${cliente.nome}`);

  // 4. Criar Endereços
  const end1 = await prisma.endereco.create({
    data: {
      rua: 'Rua das Flores',
      numero: '123',
      bairro: 'Jardim Primavera',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000',
      clienteId: cliente.id,
      empresaId: empresa.id
    }
  });

  const end2 = await prisma.endereco.create({
    data: {
      rua: 'Av. Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
      clienteId: cliente.id,
      empresaId: empresa.id
    }
  });

  console.log('🏠 Endereços criados.');

  // 5. Criar Produtos (para referência, embora o JSON seja independente)
  const prod1 = await prisma.produto.create({
    data: {
      nome: 'Janela de Alumínio',
      descricao: 'Janela de correr 2 folhas',
      preco: 500.00,
      unidade: 'm2',
      empresaId: empresa.id
    }
  });

  const prod2 = await prisma.produto.create({
    data: {
      nome: 'Porta de Vidro',
      descricao: 'Vidro temperado 8mm',
      preco: 1200.00,
      unidade: 'un',
      empresaId: empresa.id
    }
  });

  console.log('📦 Produtos criados.');

  // 6. Criar Medições (Usando JSON produtosSelecionados)

  // Medição 1: Pendente
  await prisma.medicao.create({
    data: {
      dataAgendada: new Date(),
      status: 'pendente',
      clienteId: cliente.id,
      enderecoId: end1.id,
      empresaId: empresa.id,
      produtosSelecionados: [
        {
          id: prod1.id,
          nome: prod1.nome,
          quantidade: 2,
          altura: null,
          largura: null
        },
        {
          id: prod2.id,
          nome: prod2.nome,
          quantidade: 1,
          altura: null,
          largura: null
        }
      ]
    }
  });

  // Medição 2: Concluída
  await prisma.medicao.create({
    data: {
      dataAgendada: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 dias atrás
      status: 'concluída',
      clienteId: cliente.id,
      enderecoId: end2.id,
      empresaId: empresa.id,
      observacao: 'Instalação agendada para semana que vem.',
      produtosSelecionados: [
        {
          id: prod1.id,
          nome: prod1.nome,
          quantidade: 1,
          altura: 1.5,
          largura: 2.0
        }
      ]
    }
  });
    // Medição 3: Concluída
    await prisma.medicao.create({
        data: {
          dataAgendada: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 dias atrás
          status: 'concluída',
          clienteId: cliente.id,
          enderecoId: end1.id,
          empresaId: empresa.id,
          observacao: 'Medição realizada com sucesso.',
          produtosSelecionados: [
            {
              id: prod2.id,
              nome: prod2.nome,
              quantidade: 3,
              altura: 2.1,
              largura: 0.9
            }
          ]
        }
      });

  console.log('📏 Medições criadas com sucesso (JSON formatado).');
  console.log('✅ Seed finalizado!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
