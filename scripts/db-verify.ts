import { pool } from '../src/db/client';

async function verify() {
  console.log('Running database verification...\n');
  let hasFailures = false;

  const runCheck = async (name: string, query: string) => {
    const res = await pool.query(query);
    const passed = res.rows.length === 0;
    if (passed) {
      console.log(`[PASS] ${name}`);
    } else {
      console.log(`[FAIL] ${name}`);
      console.error(res.rows);
      hasFailures = true;
    }
  };

  // (a) for every event, confirmed_count equals the number of registrations in confirmed or checked_in
  await runCheck(
    'Event confirmed_count equals actual active registrations',
    `
      SELECT e.id, e.title, e.confirmed_count,
             COUNT(r.id) FILTER (WHERE r.status IN ('confirmed', 'checked_in')) as actual_count
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id
      HAVING e.confirmed_count != COUNT(r.id) FILTER (WHERE r.status IN ('confirmed', 'checked_in'))
    `
  );

  // (b) no event has waitlisted registrations while confirmed_count < capacity
  await runCheck(
    'No event has waitlisted registrations while under capacity',
    `
      SELECT e.id, e.title, e.confirmed_count, e.capacity
      FROM events e
      JOIN registrations r ON e.id = r.event_id
      WHERE r.status = 'waitlisted' AND e.confirmed_count < e.capacity
    `
  );

  // (c) every active registration has exactly one leader member
  await runCheck(
    'Every active registration has exactly one leader member',
    `
      SELECT r.id, r.status, COUNT(rm.id) FILTER (WHERE rm.is_leader = true) as leader_count
      FROM registrations r
      LEFT JOIN registration_members rm ON r.id = rm.registration_id
      WHERE r.status NOT IN ('cancelled', 'rejected')
      GROUP BY r.id
      HAVING COUNT(rm.id) FILTER (WHERE rm.is_leader = true) != 1
    `
  );

  // (d) member count constraints based on participation_type
  await runCheck(
    'Active registration member count within bounds',
    `
      SELECT r.id, e.participation_type, e.team_min_size, e.team_max_size, COUNT(rm.id) as member_count
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN registration_members rm ON r.id = rm.registration_id AND rm.is_active = true
      WHERE r.status NOT IN ('cancelled', 'rejected')
      GROUP BY r.id, e.participation_type, e.team_min_size, e.team_max_size
      HAVING 
        (e.participation_type = 'individual' AND COUNT(rm.id) != 1) OR
        (e.participation_type = 'team' AND (COUNT(rm.id) < e.team_min_size OR COUNT(rm.id) > e.team_max_size))
    `
  );

  // (e) members.is_active matches registration status
  await runCheck(
    'Member is_active matches registration status',
    `
      SELECT rm.id, rm.is_active, r.status
      FROM registration_members rm
      JOIN registrations r ON rm.registration_id = r.id
      WHERE 
        (rm.is_active = true AND r.status IN ('cancelled', 'rejected')) OR
        (rm.is_active = false AND r.status NOT IN ('cancelled', 'rejected'))
    `
  );

  await pool.end();
  
  if (hasFailures) {
    console.error('\nVerification failed! Check the errors above.');
    process.exit(1);
  } else {
    console.log('\nAll checks passed successfully!');
  }
}

verify().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
