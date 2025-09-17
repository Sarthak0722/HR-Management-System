import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Admin user
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      employeeProfile: {
        create: {
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+1234567890',
          address: '123 Admin Street, City, State',
          employeeId: 'ADM001',
          salary: 100000,
          hireDate: new Date('2023-01-01'),
        },
      },
    },
  });

  // Create departments
  const hrDept = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: {
      name: 'Human Resources',
      description: 'HR Department for managing employees and policies',
    },
  });

  const engDept = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: {
      name: 'Engineering',
      description: 'Software development and engineering team',
    },
  });

  const salesDept = await prisma.department.upsert({
    where: { name: 'Sales' },
    update: {},
    create: {
      name: 'Sales',
      description: 'Sales and business development team',
    },
  });

  // Create positions
  const hrManagerPos = await prisma.position.upsert({
    where: { id: 'hr-manager-pos' },
    update: {},
    create: {
      id: 'hr-manager-pos',
      title: 'HR Manager',
      departmentId: hrDept.id,
      description: 'Manages HR operations and policies',
      minSalary: 70000,
      maxSalary: 90000,
    },
  });

  const devPos = await prisma.position.upsert({
    where: { id: 'dev-pos' },
    update: {},
    create: {
      id: 'dev-pos',
      title: 'Software Developer',
      departmentId: engDept.id,
      description: 'Develops software applications',
      minSalary: 60000,
      maxSalary: 80000,
    },
  });

  // Create HR user
  const hrPassword = await bcrypt.hash('hr123456', 10);
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@company.com' },
    update: {},
    create: {
      email: 'hr@company.com',
      password: hrPassword,
      role: UserRole.HR,
      employeeProfile: {
        create: {
          firstName: 'HR',
          lastName: 'Manager',
          phone: '+1234567891',
          address: '123 HR Street, City, State',
          departmentId: hrDept.id,
          positionId: hrManagerPos.id,
          employeeId: 'HR001',
          salary: 80000,
          hireDate: new Date('2023-01-01'),
        },
      },
    },
  });

  // Create sample employee
  const empPassword = await bcrypt.hash('emp123456', 10);
  const empUser = await prisma.user.upsert({
    where: { email: 'employee@company.com' },
    update: {},
    create: {
      email: 'employee@company.com',
      password: empPassword,
      role: UserRole.EMPLOYEE,
      employeeProfile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567892',
          address: '456 Employee Ave, City, State',
          departmentId: engDept.id,
          positionId: devPos.id,
          employeeId: 'EMP001',
          salary: 70000,
          hireDate: new Date('2023-06-01'),
        },
      },
    },
  });

  // Create company settings
  await prisma.companySettings.upsert({
    where: { id: 'company-settings' },
    update: {},
    create: {
      id: 'company-settings',
      companyName: 'TechCorp Solutions',
      companyEmail: 'info@techcorp.com',
      companyPhone: '+1-555-0123',
      companyAddress: '123 Business Ave, Tech City, TC 12345',
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      leavePolicy: {
        annualLeave: 20,
        sickLeave: 10,
        personalLeave: 5,
        maternityLeave: 90,
        paternityLeave: 14,
      },
    },
  });

  console.log('Seeded users:', { 
    adminUser: adminUser.email, 
    hrUser: hrUser.email, 
    empUser: empUser.email 
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });