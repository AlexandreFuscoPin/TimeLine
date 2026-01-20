const imapSimple = require('imap-simple');
const { simpleParser } = require('mailparser');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const prisma = new PrismaClient();

// --- Helper: Parsing & Syncing Single Account ---
const syncAccountEmails = async (account) => {
    console.log(`[Sync] Starting sync for ${account.user}...`);
    let connection;

    try {
        // 1. Find latest email date in DB to determine fetch range
        const lastEmail = await prisma.email.findFirst({
            where: { accountId: account.id },
            orderBy: { date: 'desc' },
            select: { date: true }
        });

        // Default to 90 days ago if new account, otherwise use last date
        const sinceDate = lastEmail ? lastEmail.date : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        console.log(`[Sync] Fetching ${account.user} SINCE ${sinceDate.toISOString()}`);

        // 2. Connect IMAP
        const config = {
            imap: {
                user: account.user,
                password: account.password,
                host: account.host,
                port: account.port,
                tls: account.tls,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 15000,
                connTimeout: 20000
            }
        };

        connection = await imapSimple.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = [['SINCE', sinceDate]];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`[Sync] Found ${messages.length} messages for ${account.user}`);

        // 3. Process & Save
        for (const item of messages) {
            try {
                const headerPart = item.parts.find(p => p.which === 'HEADER');
                const textPart = item.parts.find(p => p.which === 'TEXT');

                const uid = item.attributes.uid.toString();
                const messageId = `<${account.id}-${uid}>`; // Custom unique ID combined with account

                // Check if already exists (optimization to skip parsing if known)
                // Actuallyupsert handles this, but saving parser time is good.
                const exists = await prisma.email.findUnique({ where: { messageId } });
                if (exists) continue;

                const subject = headerPart.body.subject ? headerPart.body.subject[0] : 'No Subject';
                const from = headerPart.body.from ? headerPart.body.from[0] : 'Unknown';
                const to = headerPart.body.to ? headerPart.body.to[0] : 'Unknown';
                const date = new Date(item.attributes.date);

                let text = '';
                let snippet = '';

                if (textPart) {
                    const parsed = await simpleParser(textPart.body);
                    text = parsed.text || '';
                    snippet = text.substring(0, 100).replace(/\s+/g, ' ') + '...';
                }

                // Initial Tag Extraction (can be refined later dynamically)
                const explicitGroupRegex = /#SBS:\s*([^#\r\n]+)/i;
                const match = subject.match(explicitGroupRegex) || text.match(explicitGroupRegex);
                const tag = match ? match[1].trim() : null;

                await prisma.email.upsert({
                    where: { messageId },
                    update: {}, // Don't update if exists
                    create: {
                        messageId,
                        subject,
                        from,
                        to,
                        date,
                        snippet,
                        fullBody: text, // Storing full body for AI analysis
                        extractedTags: tag ? JSON.stringify([tag]) : '[]',
                        accountId: account.id
                    }
                });
            } catch (err) {
                console.error(`[Sync] Error processing msg ${item.attributes.uid}:`, err.message);
            }
        }

        connection.end();
        console.log(`[Sync] Componented for ${account.user}`);

    } catch (error) {
        console.error(`[Sync] Failed for ${account.user}:`, error.message);
        if (connection) connection.end();
    }
};


// --- Service Logic ---

// Grouping Logic (In-Memory, from DB objects)
const groupEmailsFromDB = async (dbEmails) => {
    const groups = {};
    const diversousKey = 'Diversos';
    const explicitGroupRegex = /#SBS:\s*([^#\r\n]+)/i;
    const hasTagRegex = /#SBS/i;

    // Load Maps
    const subjects = await prisma.subjectMap.findMany();
    const subjectMap = subjects.reduce((acc, curr) => ({ ...acc, [curr.subject]: curr.groupName }), {});

    const ignored = await prisma.ignoredGroup.findMany();
    const ignoredGroups = ignored.map(g => g.name);

    // Filter & Assign
    for (const email of dbEmails) {
        // Parse "tags" from JSON if we stored them, or re-evaluate
        // Re-evaluating is safer if regex changes
        let match = null;
        if (email.subject) match = email.subject.match(explicitGroupRegex);
        if (!match && email.fullBody) match = email.fullBody.match(explicitGroupRegex);

        let groupName = null;
        if (match) {
            groupName = match[1].trim();
            // Auto-Learn Subject Map
            if (email.subject && subjectMap[email.subject] !== groupName) {
                subjectMap[email.subject] = groupName;
                await prisma.subjectMap.upsert({
                    where: { subject: email.subject },
                    create: { subject: email.subject, groupName },
                    update: { groupName }
                }).catch(e => console.error(e));
            }
        } else if (email.subject && subjectMap[email.subject]) {
            groupName = subjectMap[email.subject];
        } else {
            // Heuristic: Check if contains #SBS tag even if no group name
            const hasTag = hasTagRegex.test(email.subject) || (email.fullBody && hasTagRegex.test(email.fullBody));
            if (hasTag) groupName = diversousKey; // Pending assignment
        }

        if (!groupName) continue; // Skip irrelevant emails
        if (ignoredGroups.includes(groupName)) continue;

        if (!groups[groupName]) {
            groups[groupName] = { tag: groupName, emails: [] };
        }

        // Map DB object to frontend expected object
        groups[groupName].emails.push({
            id: email.messageId,
            subject: email.subject,
            from: email.from,
            date: email.date,
            snippet: email.snippet,
            text: email.fullBody
        });
    }

    return Object.values(groups);
};


const fetchEmails = async () => {
    // 1. Get Accounts
    // Note: We need to handle .env fallback by ensuring a DB record exists
    let accounts = await prisma.emailAccount.findMany({ where: { ignored: false } });

    // Fallback: If no accounts in DB, check .env and create one if needed
    if (accounts.length === 0 && process.env.IMAP_USER) {
        console.log("Creating default account from .env...");
        try {
            await prisma.emailAccount.create({
                data: {
                    user: process.env.IMAP_USER,
                    password: process.env.IMAP_PASSWORD,
                    host: process.env.IMAP_HOST,
                    port: parseInt(process.env.IMAP_PORT || 993),
                    tls: process.env.IMAP_TLS === 'true'
                }
            });
            accounts = await prisma.emailAccount.findMany({ where: { ignored: false } });
        } catch (e) {
            console.error("Failed to seed .env account", e);
        }
    }

    // 2. Sync All Accounts (Parallel)
    // Fire and forget so we don't timeout the request. User can refresh to see updates.
    console.log("Triggering background sync...");
    Promise.all(accounts.map(syncAccountEmails)).catch(err => console.error("Background sync error:", err));

    // 3. Fetch All Emails from DB
    // Optimization: filtering by account IDs we just synced
    const allEmails = await prisma.email.findMany({
        where: { accountId: { in: accounts.map(a => a.id) } },
        orderBy: { date: 'desc' },
        include: { account: true }
    });

    // 4. Group by Account -> Group by Tag
    const resultsByAccount = {};

    // Initialize results structure
    accounts.forEach(acc => {
        resultsByAccount[acc.id] = { account: acc.user, emails: [] };
    });

    // Distribute emails to their account buckets
    allEmails.forEach(email => {
        if (resultsByAccount[email.accountId]) {
            resultsByAccount[email.accountId].emails.push(email);
        }
    });

    // Process valid groups for each account
    const finalOutput = await Promise.all(Object.values(resultsByAccount).map(async (accData) => {
        const groups = await groupEmailsFromDB(accData.emails);
        return {
            account: accData.account,
            groups: groups
        };
    }));

    return finalOutput;
};

// --- Other Exports (Unchanged or Adapted) ---
const unfollowGroup = async (groupName, deleteData) => {
    try {
        await prisma.ignoredGroup.create({ data: { name: groupName } }).catch(() => { });
        if (deleteData) {
            await prisma.subjectMap.deleteMany({ where: { groupName } });
        }
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: e.message };
    }
};

const generateGroupSummary = async (groupTag) => {
    // Fetch relevant emails from DB directly for efficiency
    // This is valid assuming 'groupTags' are unique across accounts or we summarize globally for that tag
    // The previous logic was global summarization, which is fine.

    // Logic: Find emails that MATCH this groupTag.
    // 1. By Subject Map
    const mappedSubjects = await prisma.subjectMap.findMany({ where: { groupName: groupTag } });
    const subjects = mappedSubjects.map(s => s.subject);

    // 2. Query DB
    const emails = await prisma.email.findMany({
        where: {
            OR: [
                { subject: { in: subjects } },
                { fullBody: { contains: `#SBS: ${groupTag}` } }, // Simple text match
                { subject: { contains: `#SBS: ${groupTag}` } }
            ]
        },
        orderBy: { date: 'asc' },
        take: 50 // Limit content for AI
    });

    if (emails.length === 0) return "No emails found for this group.";

    const emailContent = emails
        .map(e => `Date: ${e.date}\nFrom: ${e.from}\nSubject: ${e.subject}\nContent: ${e.snippet}`)
        .join("\n\n---\n\n");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "Error: GEMINI_API_KEY missing.";

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
        const prompt = `Analise a seguinte thread de emails do projeto '${groupTag}'. Crie um resumo executivo em Português.\n\n${emailContent}`;

        const result = await model.generateContent(prompt);
        return (await result.response).text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Failed to generate summary.";
    }
};

// Passthroughs for unchanged config functions
const loadIgnoredGroups = async () => (await prisma.ignoredGroup.findMany()).map(g => g.name);
const getGroupConfig = async () => {
    const groups = await prisma.group.findMany();
    return groups.reduce((acc, g) => ({ ...acc, [g.name]: { responsible: g.responsible } }), {});
};
const updateGroupConfig = async (name, cfg) => {
    await prisma.group.upsert({
        where: { name },
        create: { name, responsible: cfg.responsible },
        update: { responsible: cfg.responsible }
    });
    return getGroupConfig();
};
const getCompanyMap = async () => {
    const comps = await prisma.company.findMany();
    return comps.reduce((acc, c) => ({ ...acc, [c.domain]: c }), {});
};
const updateCompanyDomain = async (domain, name, ignored, responsible) => {
    await prisma.company.upsert({
        where: { domain },
        create: { domain, name, ignored, responsible },
        update: { name, ignored, responsible }
    });
    return getCompanyMap();
};

module.exports = {
    fetchEmails,
    unfollowGroup,
    generateGroupSummary,
    loadIgnoredGroups,
    getGroupConfig,
    updateGroupConfig,
    getCompanyMap,
    updateCompanyDomain
};
