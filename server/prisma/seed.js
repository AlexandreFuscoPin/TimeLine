const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const dataDir = path.join(__dirname, '../src/data');

async function main() {
    console.log('Seeding database...');

    // 1. Migrate Company Map
    const companyMapPath = path.join(dataDir, 'companyMap.json');
    if (fs.existsSync(companyMapPath)) {
        const companyMap = JSON.parse(fs.readFileSync(companyMapPath, 'utf-8'));
        for (const [domain, data] of Object.entries(companyMap)) {
            await prisma.company.upsert({
                where: { domain },
                update: {
                    name: data.name,
                    ignored: data.ignored,
                    responsible: data.responsible || null,
                },
                create: {
                    domain,
                    name: data.name,
                    ignored: data.ignored,
                    responsible: data.responsible || null,
                },
            });
        }
        console.log('Companies migrated.');
    }

    // 2. Migrate Group Config
    const groupConfigPath = path.join(dataDir, 'groupConfig.json');
    if (fs.existsSync(groupConfigPath)) {
        const groupConfig = JSON.parse(fs.readFileSync(groupConfigPath, 'utf-8'));
        for (const [name, data] of Object.entries(groupConfig)) {
            await prisma.group.upsert({
                where: { name },
                update: {
                    responsible: data.responsible,
                },
                create: {
                    name,
                    responsible: data.responsible,
                },
            });
        }
        console.log('Group configs migrated.');
    }

    // 3. Migrate Ignored Groups
    const ignoredGroupsPath = path.join(dataDir, 'ignoredGroups.json');
    if (fs.existsSync(ignoredGroupsPath)) {
        const ignoredGroups = JSON.parse(fs.readFileSync(ignoredGroupsPath, 'utf-8'));
        // Assuming ignoredGroups is an array of strings or objects based on file content. 
        // I will check the file content in the tool call first, but writing generic handler for array of strings which is typical.
        // Actually, looking at previous turns, it might be an array.
        // Let's assume it's an array of strings for now based on typical usage, 
        // but I will verify with view_file output if I can before running this.
        // Wait, I am writing this file IN PARALLEL with view_file. 
        // I'll assume standard format (array of strings) but wrap in try-catch or type check.

        if (Array.isArray(ignoredGroups)) {
            for (const groupName of ignoredGroups) {
                // Check if string
                const name = typeof groupName === 'string' ? groupName : groupName.name;
                if (name) {
                    await prisma.ignoredGroup.upsert({
                        where: { name: name },
                        update: {},
                        create: { name: name }
                    });
                }
            }
            console.log('Ignored groups migrated.');
        } else {
            console.log('Ignored groups file format not recognized (expected array).');
        }
    }

    // 4. Migrate Subject Map
    const subjectMapPath = path.join(dataDir, 'subjectMap.json');
    if (fs.existsSync(subjectMapPath)) {
        const subjectMap = JSON.parse(fs.readFileSync(subjectMapPath, 'utf-8'));
        for (const [subject, groupName] of Object.entries(subjectMap)) {
            await prisma.subjectMap.upsert({
                where: { subject },
                update: { groupName },
                create: { subject, groupName },
            });
        }
        console.log('Subject map migrated.');
        console.log('Subject map migrated.');
    }

    // 5. Create Default Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sbsempreendimentos.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if any user exists, if not create admin
    const userCount = await prisma.user.count();

    if (userCount === 0) {
        console.log(`No users found. Creating default admin: ${adminEmail}`);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'Admin'
            }
        });
        console.log('Default admin created.');
    } else {
        console.log(`Users already exist (${userCount}). Skipping default admin creation.`);
    }

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
