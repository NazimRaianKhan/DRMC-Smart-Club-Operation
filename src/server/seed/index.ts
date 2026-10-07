import { db } from '@/db/client';
import { withTransaction } from '@/db/tx';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';
import { hashSync } from 'bcryptjs';
import crypto from 'crypto';

export async function seedDatabase({ now = new Date() }: { now?: Date } = {}) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Seed refused to run in production. Set ALLOW_SEED=true to override.');
  }

  // PRNG state for deterministic data
  let seedState = 123456789;
  function prng() {
    let t = seedState += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function randomInt(min: number, max: number) {
    return Math.floor(prng() * (max - min + 1)) + min;
  }
  function randomItem<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length - 1)];
  }
  
  function uuid() {
    return crypto.randomUUID();
  }

  const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let generatedCodes = new Set<string>();
  function generateTicketCode() {
    let res = '';
    do {
      res = '';
      for (let i = 0; i < 8; i++) {
        res += ALPHABET[randomInt(0, ALPHABET.length - 1)];
      }
    } while (generatedCodes.has(res));
    generatedCodes.add(res);
    return res;
  }

  const FIRST_NAMES = ['Abdur', 'Hasan', 'Mahmud', 'Tamim', 'Sakib', 'Nazmul', 'Rahim', 'Karim', 'Rafiq', 'Shafiq', 'Nafis', 'Ayman', 'Farhan', 'Tariq', 'Sadman', 'Fahim', 'Tahmid', 'Jawad', 'Zayed', 'Anika', 'Nusrat', 'Sadia', 'Fatema', 'Ayesha', 'Mariya', 'Nadia', 'Sumaiya', 'Jannat', 'Farjana'];
  const LAST_NAMES = ['Rahman', 'Islam', 'Hossain', 'Ahmed', 'Ali', 'Uddin', 'Khan', 'Chowdhury', 'Hasan', 'Sikder', 'Haque', 'Talukder', 'Khatun', 'Akter', 'Begum'];
  function generateName() {
    return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
  }

  function addDays(d: Date, days: number) {
    const nd = new Date(d.getTime());
    nd.setDate(nd.getDate() + days);
    return nd;
  }
  function addHours(d: Date, hours: number) {
    const nd = new Date(d.getTime());
    nd.setHours(nd.getHours() + hours);
    return nd;
  }

  await withTransaction(async (tx) => {
    // 1. Truncate
    await tx.execute(sql`
      TRUNCATE TABLE 
        audit_log,
        registration_members,
        registrations,
        events,
        fests,
        organizations,
        users
      RESTART IDENTITY CASCADE;
    `);

    // 2. Hash Passwords ONCE
    const adminHash = hashSync('Admin@12345', 10);
    const organizerHash = hashSync('Organizer@12345', 10);
    const participantHash = hashSync('Participant@12345', 10);

    // 3. Users
    const usersData: (typeof schema.users.$inferInsert)[] = [];
    const demoAdminId = uuid();
    const demoOrgId = uuid();
    const demoPartId = uuid();

    usersData.push({
      id: demoAdminId, email: 'admin@drmc-demo.test', passwordHash: adminHash, fullName: 'Demo Admin', role: 'admin',
      institution: 'DRMC', classLevel: '12', studentId: 'ADM-001', phone: '01700000001', preferredLang: 'en'
    });
    usersData.push({
      id: demoOrgId, email: 'organizer@drmc-demo.test', passwordHash: organizerHash, fullName: 'Demo Organizer', role: 'organizer',
      institution: 'DRMC', classLevel: '11', studentId: 'ORG-001', phone: '01700000002', preferredLang: 'en'
    });
    usersData.push({
      id: demoPartId, email: 'participant@drmc-demo.test', passwordHash: participantHash, fullName: 'Demo Participant', role: 'participant',
      institution: 'DRMC', classLevel: '10', studentId: 'PRT-001', phone: '01700000003', preferredLang: 'en'
    });

    const otherParticipants = [];
    for (let i = 1; i <= 300; i++) {
      const pid = uuid();
      otherParticipants.push(pid);
      usersData.push({
        id: pid,
        email: `p${String(i).padStart(3, '0')}@drmc-demo.test`,
        passwordHash: participantHash,
        fullName: generateName(),
        role: 'participant',
        institution: randomItem(['DRMC', 'NDC', 'DCC', 'VNC', 'HCC']),
        classLevel: randomItem(['6', '7', '8', '9', '10', '11', '12']),
        studentId: `S-${randomInt(10000, 99999)}`,
        phone: `017${String(randomInt(10000000, 99999999))}`,
        preferredLang: randomItem(['en', 'bn'])
      });
    }

    async function insertChunks<T>(table: any, data: T[], chunkSize = 500) {
      for (let i = 0; i < data.length; i += chunkSize) {
        await tx.insert(table).values(data.slice(i, i + chunkSize));
      }
    }
    await insertChunks(schema.users, usersData);

    // 4. Organization
    const orgId = uuid();
    await tx.insert(schema.organizations).values({
      id: orgId, name: 'DRMC IT Club', slug: 'drmc-it-club', description: 'The official IT Club of Dhaka Residential Model College.'
    });

    // 5. Fests
    const festsData: (typeof schema.fests.$inferInsert)[] = [];
    const tc2026Id = uuid();
    const wt2026Id = uuid();
    const ft2027Id = uuid();
    const tc2025Id = uuid();
    const hw2027Id = uuid();

    festsData.push({
      id: tc2026Id, organizationId: orgId, slug: 'tech-carnival-2026', title: 'Tech Carnival 2026', titleBn: 'টেক কার্নিভাল ২০২৬',
      tagline: 'Empowering the next generation.', taglineBn: 'আগামীর প্রজন্মকে ক্ষমতায়ন।',
      description: 'The biggest tech festival in town.', descriptionBn: 'শহরের সবচেয়ে বড় টেক উৎসব।',
      startsAt: addDays(now, 12), endsAt: addDays(now, 15), venue: 'DRMC Campus', accent: 'cyan', status: 'published'
    });
    festsData.push({
      id: wt2026Id, organizationId: orgId, slug: 'winter-tech-fest-2026', title: 'Winter Tech Fest 2026', titleBn: 'উইন্টার টেক ফেস্ট ২০২৬',
      tagline: 'Coding in the cold.', taglineBn: 'শীতে কোডিং।',
      description: 'Join us for a cozy tech fest.', descriptionBn: 'একটি আরামদায়ক টেক ফেস্টে যোগ দিন।',
      startsAt: addDays(now, 40), endsAt: addDays(now, 42), venue: 'DRMC Campus', accent: 'violet', status: 'published'
    });
    festsData.push({
      id: ft2027Id, organizationId: orgId, slug: 'freshers-tech-fest-2027', title: 'Freshers Tech Fest 2027', titleBn: 'ফ্রেশার্স টেক ফেস্ট ২০২৭',
      tagline: 'Welcome to the tech world.', taglineBn: 'প্রযুক্তি জগতে স্বাগতম।',
      description: 'Specially for newcomers.', descriptionBn: 'নতুনদের জন্য বিশেষ।',
      startsAt: addDays(now, 120), endsAt: addDays(now, 121), venue: 'DRMC Campus', accent: 'gold', status: 'published'
    });
    festsData.push({
      id: tc2025Id, organizationId: orgId, slug: 'tech-carnival-2025', title: 'Tech Carnival 2025', titleBn: 'টেক কার্নিভাল ২০২৫',
      tagline: 'A glorious past.', taglineBn: 'এক গৌরবময় অতীত।',
      description: 'Last year\'s tech carnival.', descriptionBn: 'গত বছরের টেক কার্নিভাল।',
      startsAt: addDays(now, -330), endsAt: addDays(now, -328), venue: 'DRMC Campus', accent: 'emerald', status: 'published'
    });
    festsData.push({
      id: hw2027Id, organizationId: orgId, slug: 'spring-hack-week-2027', title: 'Spring Hack Week 2027', titleBn: 'স্প্রিং হ্যাক উইক ২০২৭',
      tagline: 'Draft Fest', taglineBn: 'খসড়া ফেস্ট',
      description: 'Draft fest description.', descriptionBn: 'খসড়া ফেস্ট বর্ণনা।',
      startsAt: addDays(now, 150), endsAt: addDays(now, 157), venue: 'DRMC Campus', accent: 'cyan', status: 'draft'
    });
    await insertChunks(schema.fests, festsData);

    // 6. Events
    const eventsData: (typeof schema.events.$inferInsert)[] = [];
    const evtIds: Record<string, string> = {};

    function makeEvent(festId: string, slug: string, props: any) {
      const eid = uuid();
      evtIds[slug] = eid;
      eventsData.push({
        id: eid,
        festId,
        slug,
        title: props.title,
        titleBn: props.title + ' Bn',
        shortDescription: 'Short description for ' + props.title,
        shortDescriptionBn: props.title + ' সংক্ষিপ্ত বর্ণনা।',
        description: 'Long description paragraph 1.\n\nParagraph 2.',
        descriptionBn: 'দীর্ঘ বর্ণনা অনুচ্ছেদ ১।\n\nঅনুচ্ছেদ ২।',
        faq: [{ q: 'Will there be food?', a: 'Yes' }, { q: 'Is it free?', a: 'Yes' }, { q: 'Do I need a laptop?', a: 'Yes' }],
        venue: randomItem(['ICT Lab', 'Main Auditorium', 'Playground Pavilion']),
        updatedAt: now,
        ...props
      });
      return eid;
    }

    const aiWebId = makeEvent(tc2026Id, 'ai-web-dev', {
      title: 'AI Web Development Contest', category: 'web_dev', participationType: 'team', teamMinSize: 2, teamMaxSize: 3,
      capacity: 40, confirmedCount: 22, registrationDeadline: addHours(now, 36), startsAt: addDays(now, 13), endsAt: addDays(now, 14), status: 'published'
    });
    const progId = makeEvent(tc2026Id, 'prog-contest', {
      title: 'Programming Contest', category: 'programming', participationType: 'individual',
      capacity: 60, confirmedCount: 60, registrationDeadline: addDays(now, 5), startsAt: addDays(now, 13), endsAt: addDays(now, 14), status: 'published'
    });
    const robotId = makeEvent(tc2026Id, 'robotics', {
      title: 'Robotics Challenge', category: 'robotics', participationType: 'team', teamMinSize: 3, teamMaxSize: 4,
      capacity: 20, confirmedCount: 13, registrationDeadline: addDays(now, -2), startsAt: addDays(now, 13), endsAt: addDays(now, 14), status: 'published'
    });
    const gamingId = makeEvent(tc2026Id, 'gaming', {
      title: 'Gaming Tournament', category: 'gaming', participationType: 'individual',
      capacity: 32, confirmedCount: 30, registrationDeadline: addDays(now, 5), startsAt: addDays(now, 13), endsAt: addDays(now, 14), status: 'published'
    });

    const hackId = makeEvent(wt2026Id, 'hackathon-wt', {
      title: 'Hackathon', category: 'hackathon', participationType: 'team', teamMinSize: 3, teamMaxSize: 5,
      capacity: 30, confirmedCount: 9, registrationDeadline: addDays(now, 30), startsAt: addDays(now, 40), endsAt: addDays(now, 41), status: 'published'
    });
    const workshopId = makeEvent(wt2026Id, 'cloud-workshop', {
      title: 'Cloud & DevOps Workshop', category: 'workshop', participationType: 'individual',
      capacity: 50, confirmedCount: 12, registrationDeadline: addDays(now, 30), startsAt: addDays(now, 40), endsAt: addDays(now, 41), status: 'published'
    });
    makeEvent(wt2026Id, 'quiz', {
      title: 'Tech Quiz', category: 'quiz', participationType: 'team', teamMinSize: 2, teamMaxSize: 2,
      capacity: 60, confirmedCount: 18, registrationDeadline: addDays(now, 30), startsAt: addDays(now, 40), endsAt: addDays(now, 41), status: 'published'
    });

    makeEvent(ft2027Id, 'coding-challenge-ft', {
      title: 'Coding Challenge', category: 'programming', participationType: 'individual',
      capacity: 60, confirmedCount: 5, registrationDeadline: addDays(now, 110), startsAt: addDays(now, 120), endsAt: addDays(now, 121), status: 'published'
    });
    makeEvent(ft2027Id, 'ai-workshop-ft', {
      title: 'AI Workshop', category: 'workshop', participationType: 'individual',
      capacity: 50, confirmedCount: 0, registrationOpensAt: addDays(now, 3), registrationDeadline: addDays(now, 110), startsAt: addDays(now, 120), endsAt: addDays(now, 121), status: 'published'
    });

    const pastProgId = makeEvent(tc2025Id, 'prog-2025', {
      title: 'Programming Contest 2025', category: 'programming', participationType: 'individual',
      capacity: 50, confirmedCount: 40, registrationDeadline: addDays(now, -340), startsAt: addDays(now, -330), endsAt: addDays(now, -329), status: 'published'
    });
    const pastWebId = makeEvent(tc2025Id, 'web-2025', {
      title: 'Web Design Contest 2025', category: 'web_dev', participationType: 'individual',
      capacity: 30, confirmedCount: 25, registrationDeadline: addDays(now, -340), startsAt: addDays(now, -330), endsAt: addDays(now, -329), status: 'published'
    });

    makeEvent(hw2027Id, 'draft-kickoff', {
      title: 'Spring Hack Week Kickoff', category: 'other', participationType: 'individual',
      capacity: 100, confirmedCount: 0, registrationDeadline: addDays(now, 140), startsAt: addDays(now, 150), endsAt: addDays(now, 151), status: 'draft'
    });

    makeEvent(tc2026Id, 'concurrency-lab', {
      title: 'Concurrency Lab', category: 'other', participationType: 'individual',
      capacity: 50, confirmedCount: 0, registrationDeadline: addDays(now, 10), startsAt: addDays(now, 13), endsAt: addDays(now, 14), status: 'published', isLab: true
    });

    await insertChunks(schema.events, eventsData);

    // 7. Registrations & Members
    const regsData: (typeof schema.registrations.$inferInsert)[] = [];
    const membersData: (typeof schema.registrationMembers.$inferInsert)[] = [];

    function randomPastDate() {
      const daysAgo = prng() < 0.7 ? randomInt(0, 3) : randomInt(4, 14);
      return addHours(addDays(now, -daysAgo), -randomInt(0, 23));
    }

    let pIndex = 0;
    function getNextParticipant() {
      return otherParticipants[pIndex++ % otherParticipants.length];
    }

    let syntheticMemberCount = 1;
    let waitlistOrder = 0;

    function createRegistration(eventId: string, userId: string, status: any, isTeam: boolean, minSize: number, maxSize: number, specificTeamName?: string) {
      const regId = uuid();
      let qAt = randomPastDate();
      if (status === 'waitlisted') {
        // FIFO order for waitlist
        qAt = addHours(addDays(now, -5), waitlistOrder++);
      }
      
      const teamSize = isTeam ? randomInt(minSize, maxSize) : 1;
      
      const r: typeof schema.registrations.$inferInsert = {
        id: regId, eventId, userId, status, ticketCode: generateTicketCode(),
        queuedAt: qAt, createdAt: qAt, updatedAt: qAt,
        teamName: isTeam ? (specificTeamName || `Team Alpha ${randomInt(100, 999)}`) : null,
      };
      if (status === 'checked_in') r.checkedInAt = now;
      if (status === 'cancelled') r.cancelledAt = now;
      regsData.push(r);

      const leaderUser = usersData.find(u => u.id === userId)!;
      membersData.push({
        id: uuid(), registrationId: regId, eventId, isLeader: true, fullName: leaderUser.fullName, email: leaderUser.email,
        phone: leaderUser.phone, institution: leaderUser.institution || 'DRMC', classLevel: leaderUser.classLevel || '10', studentId: leaderUser.studentId, isActive: status !== 'cancelled' && status !== 'rejected'
      });

      for (let i = 1; i < teamSize; i++) {
        membersData.push({
          id: uuid(), registrationId: regId, eventId, isLeader: false, fullName: generateName(), email: `member-${syntheticMemberCount++}@drmc-demo.test`,
          phone: `017${randomInt(10000000, 99999999)}`, institution: 'DRMC', classLevel: randomItem(['9','10','11']), studentId: `S-${randomInt(10000, 99999)}`, isActive: status !== 'cancelled' && status !== 'rejected'
        });
      }
    }

    createRegistration(workshopId, demoPartId, 'confirmed', false, 1, 1);
    createRegistration(aiWebId, demoPartId, 'confirmed', true, 3, 3, 'Demo Coders');
    createRegistration(progId, demoPartId, 'waitlisted', false, 1, 1);

    for (let i = 0; i < 21; i++) {
      createRegistration(aiWebId, getNextParticipant(), 'confirmed', true, 2, 3);
    }
    createRegistration(aiWebId, getNextParticipant(), 'rejected', true, 2, 3);

    for (let i = 0; i < 60; i++) {
      createRegistration(progId, getNextParticipant(), 'confirmed', false, 1, 1);
    }
    for (let i = 0; i < 13; i++) {
      createRegistration(progId, getNextParticipant(), 'waitlisted', false, 1, 1);
    }
    createRegistration(progId, getNextParticipant(), 'cancelled', false, 1, 1);

    for (let i = 0; i < 13; i++) {
      createRegistration(robotId, getNextParticipant(), 'confirmed', true, 3, 4);
    }
    for (let i = 0; i < 30; i++) {
      createRegistration(gamingId, getNextParticipant(), 'confirmed', false, 1, 1);
    }
    for (let i = 0; i < 9; i++) {
      createRegistration(hackId, getNextParticipant(), 'confirmed', true, 3, 5);
    }
    for (let i = 0; i < 11; i++) {
      createRegistration(workshopId, getNextParticipant(), 'confirmed', false, 1, 1);
    }
    for (let i = 0; i < 18; i++) {
      createRegistration(evtIds['quiz'], getNextParticipant(), 'confirmed', true, 2, 2);
    }
    for (let i = 0; i < 5; i++) {
      createRegistration(evtIds['coding-challenge-ft'], getNextParticipant(), 'confirmed', false, 1, 1);
    }
    for (let i = 0; i < 40; i++) {
      createRegistration(pastProgId, getNextParticipant(), prng() > 0.1 ? 'checked_in' : 'confirmed', false, 1, 1);
    }
    for (let i = 0; i < 25; i++) {
      createRegistration(pastWebId, getNextParticipant(), prng() > 0.1 ? 'checked_in' : 'confirmed', false, 1, 1);
    }

    await insertChunks(schema.registrations, regsData);
    await insertChunks(schema.registrationMembers, membersData);

    // 8. Audit Log
    const auditData: (typeof schema.auditLog.$inferInsert)[] = [];
    for (let i = 0; i < 15; i++) {
      auditData.push({
        actorId: demoOrgId, action: 'event.updated', entityType: 'event', entityId: aiWebId, meta: { changed: 'capacity' }, createdAt: randomPastDate()
      });
    }
    await insertChunks(schema.auditLog, auditData);

    // 9. Verify and set confirmed_count
    await tx.execute(sql`
      UPDATE events e SET confirmed_count = (
        SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status IN ('confirmed', 'checked_in')
      )
    `);

    const verifyRes = await tx.execute(sql`
      SELECT e.id, e.confirmed_count, e.capacity
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id
      HAVING e.confirmed_count != COUNT(r.id) FILTER (WHERE r.status IN ('confirmed', 'checked_in'))
    `);
    if (verifyRes.rows.length > 0) throw new Error('Verification failed: confirmed_count mismatch');

    console.log(`Seeded: Users: ${usersData.length}, Fests: ${festsData.length}, Events: ${eventsData.length}, Regs: ${regsData.length}, Members: ${membersData.length}`);
  });
}

