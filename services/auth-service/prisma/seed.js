"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const hrPassword = await bcryptjs_1.default.hash('hr123456', 10);
    const hrUser = await prisma.user.upsert({
        where: { email: 'hr@company.com' },
        update: {},
        create: {
            email: 'hr@company.com',
            password: hrPassword,
            role: client_1.UserRole.HR,
            employeeProfile: {
                create: {
                    firstName: 'HR',
                    lastName: 'Manager',
                    department: 'Human Resources',
                    position: 'HR Manager',
                    salary: 80000,
                    hireDate: new Date('2023-01-01'),
                },
            },
        },
    });
    const empPassword = await bcryptjs_1.default.hash('emp123456', 10);
    const empUser = await prisma.user.upsert({
        where: { email: 'employee@company.com' },
        update: {},
        create: {
            email: 'employee@company.com',
            password: empPassword,
            role: client_1.UserRole.EMPLOYEE,
            employeeProfile: {
                create: {
                    firstName: 'John',
                    lastName: 'Doe',
                    department: 'Engineering',
                    position: 'Software Developer',
                    salary: 70000,
                    hireDate: new Date('2023-06-01'),
                },
            },
        },
    });
    console.log('Seeded users:', { hrUser: hrUser.email, empUser: empUser.email });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map