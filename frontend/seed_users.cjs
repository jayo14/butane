const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_OcuS5lT3Irai@ep-still-shadow-au88lpma-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const users = [
    {
      id: '6ef6f050-877d-4812-893f-b42ea423fdb9',
      email: 'admin@deesoar.edu',
      password: 'pbkdf2_sha256$1200000$grGLdg8NFRQU4qONAtThyd$3iwcr8Pt10bp5lng9l+vVQvetZIb2l7A1ejyZKRJdT8=',
      first_name: '',
      last_name: '',
      role: 'admin',
      is_active: true,
      is_staff: true,
      is_superuser: true,
      created_at: '2026-07-20T07:26:30.355058+00:00',
      updated_at: '2026-07-20T07:26:30.355565+00:00',
      last_login: '2026-07-20T07:58:24.476478+00:00',
    },
    {
      id: 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908',
      email: 'staff@deesoar.edu',
      password: 'pbkdf2_sha256$1200000$RFjzTHC8OpM3wp0aOGCY3t$QbdR/10RES9prSiB3ZuUM20KS9NYnHV9gapzcywpVy8=',
      first_name: 'Mika',
      last_name: '',
      role: 'teacher',
      is_active: true,
      is_staff: true,
      is_superuser: false,
      created_at: '2026-07-20T07:28:43.899403+00:00',
      updated_at: '2026-07-20T07:34:25.390102+00:00',
      last_login: '2026-07-20T11:10:23.864018+00:00',
    },
  ];

  for (const u of users) {
    await sql`
      INSERT INTO accounts_user (id, password, email, first_name, last_name, role, is_active, is_staff, is_superuser, created_at, updated_at, last_login)
      VALUES (${u.id}, ${u.password}, ${u.email}, ${u.first_name}, ${u.last_name}, ${u.role}, ${u.is_active}, ${u.is_staff}, ${u.is_superuser}, ${u.created_at}, ${u.updated_at}, ${u.last_login})
      ON CONFLICT (id) DO NOTHING
    `;
    console.log(`Inserted user: ${u.email}`);
  }

  console.log('Users seeded successfully!');
}

main().catch(e => { console.error(e); process.exit(1); });
