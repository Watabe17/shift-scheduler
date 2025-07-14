import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  const hashedPasswordAdmin = await bcrypt.hash('password123', 12)
  const hashedPasswordEmployee = await bcrypt.hash('password123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPasswordAdmin,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  })

  const employee = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      email: 'employee@example.com',
      password: hashedPasswordEmployee,
      name: 'Employee User',
      role: Role.EMPLOYEE,
    },
  })

  console.log('Upserted admin user:', admin)
  console.log('Upserted employee user:', employee)

  const position1 = await prisma.position.upsert({
    where: { id: 'clerk' },
    update: {},
    create: {
      id: 'clerk',
      name: 'Cashier',
    },
  })

  const position2 = await prisma.position.upsert({
    where: { id: 'stocker' },
    update: {},
    create: {
      id: 'stocker',
      name: 'Stocker',
    },
  })

  console.log('Upserted positions:', position1, position2)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 