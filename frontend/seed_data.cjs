const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_OcuS5lT3Irai@ep-still-shadow-au88lpma-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  // 1. django_content_type
  console.log('Seeding django_content_type...');
  const contentTypes = [
    [1,'admin','logentry'],[2,'auth','group'],[3,'auth','permission'],
    [4,'contenttypes','contenttype'],[5,'sessions','session'],
    [6,'token_blacklist','blacklistedtoken'],[7,'token_blacklist','outstandingtoken'],
    [8,'accounts','student'],[9,'accounts','teacher'],[10,'accounts','user'],
    [11,'exams','attempt'],[12,'exams','attemptanswer'],[13,'exams','choice'],
    [14,'exams','exam'],[15,'exams','question'],[16,'exams','result'],
  ];
  for (const [id, app, model] of contentTypes) {
    await sql`INSERT INTO django_content_type (id, app_label, model) VALUES (${id}, ${app}, ${model}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  done');

  // 2. auth_permission
  console.log('Seeding auth_permission...');
  const perms = [
    [1,1,'add_logentry','Can add log entry'],[2,1,'change_logentry','Can change log entry'],
    [3,1,'delete_logentry','Can delete log entry'],[4,1,'view_logentry','Can view log entry'],
    [5,3,'add_permission','Can add permission'],[6,3,'change_permission','Can change permission'],
    [7,3,'delete_permission','Can delete permission'],[8,3,'view_permission','Can view permission'],
    [9,2,'add_group','Can add group'],[10,2,'change_group','Can change group'],
    [11,2,'delete_group','Can delete group'],[12,2,'view_group','Can view group'],
    [13,4,'add_contenttype','Can add content type'],[14,4,'change_contenttype','Can change content type'],
    [15,4,'delete_contenttype','Can delete content type'],[16,4,'view_contenttype','Can view content type'],
    [17,5,'add_session','Can add session'],[18,5,'change_session','Can change session'],
    [19,5,'delete_session','Can delete session'],[20,5,'view_session','Can view session'],
    [21,6,'add_blacklistedtoken','Can add Blacklisted Token'],[22,6,'change_blacklistedtoken','Can change Blacklisted Token'],
    [23,6,'delete_blacklistedtoken','Can delete Blacklisted Token'],[24,6,'view_blacklistedtoken','Can view Blacklisted Token'],
    [25,7,'add_outstandingtoken','Can add Outstanding Token'],[26,7,'change_outstandingtoken','Can change Outstanding Token'],
    [27,7,'delete_outstandingtoken','Can delete Outstanding Token'],[28,7,'view_outstandingtoken','Can view Outstanding Token'],
    [29,10,'add_user','Can add user'],[30,10,'change_user','Can change user'],
    [31,10,'delete_user','Can delete user'],[32,10,'view_user','Can view user'],
    [33,8,'add_student','Can add student'],[34,8,'change_student','Can change student'],
    [35,8,'delete_student','Can delete student'],[36,8,'view_student','Can view student'],
    [37,9,'add_teacher','Can add teacher'],[38,9,'change_teacher','Can change teacher'],
    [39,9,'delete_teacher','Can delete teacher'],[40,9,'view_teacher','Can view teacher'],
    [41,14,'add_exam','Can add exam'],[42,14,'change_exam','Can change exam'],
    [43,14,'delete_exam','Can delete exam'],[44,14,'view_exam','Can view exam'],
    [45,11,'add_attempt','Can add attempt'],[46,11,'change_attempt','Can change attempt'],
    [47,11,'delete_attempt','Can delete attempt'],[48,11,'view_attempt','Can view attempt'],
    [49,15,'add_question','Can add question'],[50,15,'change_question','Can change question'],
    [51,15,'delete_question','Can delete question'],[52,15,'view_question','Can view question'],
    [53,13,'add_choice','Can add choice'],[54,13,'change_choice','Can change choice'],
    [55,13,'delete_choice','Can delete choice'],[56,13,'view_choice','Can view choice'],
    [57,12,'add_attemptanswer','Can add attempt answer'],[58,12,'change_attemptanswer','Can change attempt answer'],
    [59,12,'delete_attemptanswer','Can delete attempt answer'],[60,12,'view_attemptanswer','Can view attempt answer'],
    [61,16,'add_result','Can add result'],[62,16,'change_result','Can change result'],
    [63,16,'delete_result','Can delete result'],[64,16,'view_result','Can view result'],
  ];
  for (const [id, ctid, codename, name] of perms) {
    await sql`INSERT INTO auth_permission (id, content_type_id, codename, name) VALUES (${id}, ${ctid}, ${codename}, ${name}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  done');

  // 3. accounts_teacher
  console.log('Seeding accounts_teacher...');
  await sql`INSERT INTO accounts_teacher (id, created_at, updated_at, is_deleted, deleted_at, department, title, phone, avatar, bio, user_id, employee_id)
    VALUES ('732be41c-30f6-4675-a89f-6ec3a173ff61', '2026-07-20T07:29:18.991164+00:00', '2026-07-20T07:29:18.991253+00:00', false, NULL, '', 'Ms', '', '', '', 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 'TCH-732BE41C30F6')
    ON CONFLICT (id) DO NOTHING`;
  console.log('  done');

  // 4. accounts_user_user_permissions
  console.log('Seeding user permissions...');
  await sql`INSERT INTO accounts_user_user_permissions (id, user_id, permission_id) VALUES (1, 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 33) ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO accounts_user_user_permissions (id, user_id, permission_id) VALUES (2, 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 34) ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO accounts_user_user_permissions (id, user_id, permission_id) VALUES (3, 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 36) ON CONFLICT (id) DO NOTHING`;
  console.log('  done');

  // 5. exams_exam
  console.log('Seeding exams_exam...');
  await sql`INSERT INTO exams_exam (id, created_at, updated_at, is_deleted, deleted_at, title, description, course, course_code, status, duration_minutes, total_marks, passing_marks, available_from, available_to, shuffle_questions, shuffle_answers, show_result, allow_review, created_by_id, archived_at, class_group, instructions, is_public, passing_percentage, published_at, subject, term, public_token_hash, short_code)
    VALUES ('b0f59d1d-1ca6-4fe9-8e88-633b12fef0ff', '2026-07-20T08:43:13.660230+00:00', '2026-07-20T08:43:13.867521+00:00', false, NULL, 'Hey', '', '', '', 'ongoing', 60, 0, 0, NULL, NULL, false, false, false, true, '732be41c-30f6-4675-a89f-6ec3a173ff61', NULL, 'sss2', 'Answer all', true, 50, '2026-07-20T08:43:13.865894+00:00', 'chemistry', 'second-term', '6de77ce69638e3a355d4cda9444369cdc6919b33adbd4ab63c8e4a7fb4c320f0', NULL)
    ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO exams_exam (id, created_at, updated_at, is_deleted, deleted_at, title, description, course, course_code, status, duration_minutes, total_marks, passing_marks, available_from, available_to, shuffle_questions, shuffle_answers, show_result, allow_review, created_by_id, archived_at, class_group, instructions, is_public, passing_percentage, published_at, subject, term, public_token_hash, short_code)
    VALUES ('6ce4c21e-7fa2-4772-956a-5c32c8b0386e', '2026-07-20T11:10:39.785838+00:00', '2026-07-20T11:10:39.984010+00:00', false, NULL, 'wjkfwnjfwnf', '', '', '', 'ongoing', 60, 0, 0, NULL, NULL, false, false, false, false, '732be41c-30f6-4675-a89f-6ec3a173ff61', NULL, 'sss1', 'jwkfnwjfnwkjf3njkf3 fk3j fk3j f3k', true, 76, '2026-07-20T11:10:39.978947+00:00', 'physics', 'second-term', '67c62af1fb8046762cd3896ceecbd151fe3ad6b5714235e166dac6463e19fcc2', 'W88YPAWM')
    ON CONFLICT (id) DO NOTHING`;
  console.log('  done');

  // 6. exams_question
  console.log('Seeding exams_question...');
  await sql`INSERT INTO exams_question (id, created_at, updated_at, "order", text, type, marks, explanation, exam_id)
    VALUES ('62d71231-8cc1-4da6-8e9e-07fcfa5bb53f', '2026-07-20T08:43:13.669634+00:00', '2026-07-20T08:43:13.669676+00:00', 1, 'hey', 'single_choice', 1, '', 'b0f59d1d-1ca6-4fe9-8e88-633b12fef0ff')
    ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO exams_question (id, created_at, updated_at, "order", text, type, marks, explanation, exam_id)
    VALUES ('44bb5e03-80d0-4418-a032-a9e140303a30', '2026-07-20T11:10:39.797233+00:00', '2026-07-20T11:10:39.797303+00:00', 1, 'Mammal', 'single_choice', 1, '', '6ce4c21e-7fa2-4772-956a-5c32c8b0386e')
    ON CONFLICT (id) DO NOTHING`;
  console.log('  done');

  // 7. exams_choice
  console.log('Seeding exams_choice...');
  const choices = [
    ['7f36b508-dc0a-4e3b-be5e-c12c7b31200d', '2026-07-20T08:43:13.675589+00:00', '2026-07-20T08:43:13.675627+00:00', 'A', 'hjb', false, '62d71231-8cc1-4da6-8e9e-07fcfa5bb53f'],
    ['7d7e30d8-7a12-4d82-9b7a-513d5989f76f', '2026-07-20T08:43:13.680028+00:00', '2026-07-20T08:43:13.680062+00:00', 'B', 'jnkn', false, '62d71231-8cc1-4da6-8e9e-07fcfa5bb53f'],
    ['b5d72c7b-8e3f-4ee7-8fc5-dfff81e28dbd', '2026-07-20T08:43:13.684864+00:00', '2026-07-20T08:43:13.684926+00:00', 'C', 'knjkk', true, '62d71231-8cc1-4da6-8e9e-07fcfa5bb53f'],
    ['f58bbce2-2454-49c2-ae6c-bacd71c19320', '2026-07-20T08:43:13.689667+00:00', '2026-07-20T08:43:13.689704+00:00', 'D', 'jnnkn', false, '62d71231-8cc1-4da6-8e9e-07fcfa5bb53f'],
    ['f4a7fc7e-533d-4af5-a551-e3a324443441', '2026-07-20T11:10:39.803283+00:00', '2026-07-20T11:10:39.803349+00:00', 'A', 'Me', true, '44bb5e03-80d0-4418-a032-a9e140303a30'],
    ['acb6106e-0555-4597-b3b5-1d4c556e35cc', '2026-07-20T11:10:39.809745+00:00', '2026-07-20T11:10:39.809825+00:00', 'B', 'Yu', false, '44bb5e03-80d0-4418-a032-a9e140303a30'],
    ['66e4599b-6379-4143-afab-c80051132b29', '2026-07-20T11:10:39.816070+00:00', '2026-07-20T11:10:39.816206+00:00', 'C', 'Them', false, '44bb5e03-80d0-4418-a032-a9e140303a30'],
    ['29cb3218-c62c-4682-b45a-d054334231b5', '2026-07-20T11:10:39.823725+00:00', '2026-07-20T11:10:39.823794+00:00', 'D', 'None', false, '44bb5e03-80d0-4418-a032-a9e140303a30'],
  ];
  for (const [id, ca, ua, label, text, isCorrect, qid] of choices) {
    await sql`INSERT INTO exams_choice (id, created_at, updated_at, label, text, is_correct, question_id) VALUES (${id}, ${ca}, ${ua}, ${label}, ${text}, ${isCorrect}, ${qid}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  done');

  // 8. token_blacklist_outstandingtoken
  console.log('Seeding token_blacklist_outstandingtoken...');
  const tokens = [
    [1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTEzNzk1NywiaWF0IjoxNzg0NTMzMTU3LCJqdGkiOiIyYzUxNzRhMGUwY2Q0MGYwYjgwYjcyZGUxMzE1ZGUxMCIsInVzZXJfaWQiOiI2ZWY2ZjA1MC04NzdkLTQ4MTItODkzZi1iNDJlYTQyM2ZkYjkifQ.GnXIi1w39Y6XdIriawonyovK24W4q7SD1hYr0kO7n5c','2026-07-20T07:39:17.072337+00:00','2026-07-27T07:39:17+00:00','6ef6f050-877d-4812-893f-b42ea423fdb9','2c5174a0e0cd40f0b80b72de1315de10'],
    [2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTEzODA1MSwiaWF0IjoxNzg0NTMzMjUxLCJqdGkiOiJmMWM1YTI5ZDM5YjM0NGRkYTJjODUwMmNhODJmNzM2ZCIsInVzZXJfaWQiOiI2ZWY2ZjA1MC04NzdkLTQ4MTItODkzZi1iNDJlYTQyM2ZkYjkifQ.Mb5Cq4QsTgHEdWpqjOw_EfZ87khPNQAc_1Xa8YChQvI','2026-07-20T07:40:51.298864+00:00','2026-07-27T07:40:51+00:00','6ef6f050-877d-4812-893f-b42ea423fdb9','f1c5a29d39b344dda2c8502ca82f736d'],
    [3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTEzODEyNCwiaWF0IjoxNzg0NTMzMzI0LCJqdGkiOiI5OWJlODRmZGY1M2Y0ZWJmODdmYzk2MjdkOWQ5YWE3ZSIsInVzZXJfaWQiOiI2ZWY2ZjA1MC04NzdkLTQ4MTItODkzZi1iNDJlYTQyM2ZkYjkifQ.RZV27V1keJGkZeHpqWgvBDmkHQ4gLNkGrzohK5kMFjc','2026-07-20T07:42:04.618222+00:00','2026-07-27T07:42:04+00:00','6ef6f050-877d-4812-893f-b42ea423fdb9','99be84fdf53f4ebf87fc9627d9d9aa7e'],
    [4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTEzODI0OCwiaWF0IjoxNzg0NTMzNDQ4LCJqdGkiOiI5ZmUyN2M5NWU2MDk0M2IxYWM4YjJhZThkZGNiOWI2NiIsInVzZXJfaWQiOiI2ZWY2ZjA1MC04NzdkLTQ4MTItODkzZi1iNDJlYTQyM2ZkYjkifQ.fpBMrEZxvrnUFqxtNCx2vaYBaftoRWOFZDgCsCTVz94','2026-07-20T07:44:08.460639+00:00','2026-07-27T07:44:08+00:00','6ef6f050-877d-4812-893f-b42ea423fdb9','9fe27c95e60943b1ac8b2ae8ddcb9b66'],
    [5,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTEzODI1NCwiaWF0IjoxNzg0NTMzNDU0LCJqdGkiOiJjM2YyYjllN2NjMjI0NDU4YTQ5YmU1Y2UzMmI1OTBmYSIsInVzZXJfaWQiOiI2ZWY2ZjA1MC04NzdkLTQ4MTItODkzZi1iNDJlYTQyM2ZkYjkifQ.UU8-iYNKY6Nq-useJBXD6Qdf3XEosw8VvhyRfD_QW6w','2026-07-20T07:44:14.868412+00:00','2026-07-27T07:44:14+00:00','6ef6f050-877d-4812-893f-b42ea423fdb9','c3f2b9e7cc224458a49be5ce32b590fa'],
    [6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTEzODI4MSwiaWF0IjoxNzg0NTMzNDgxLCJqdGkiOiI3MjZmOGUwMDYzNWQ0MmQ3YjcwOTBlOWUxZGYxODM0YiIsInVzZXJfaWQiOiI2ZWY2ZjA1MC04NzdkLTQ4MTItODkzZi1iNDJlYTQyM2ZkYjkifQ.kFFFn4jjetrSAt5Xj9ycZm3x5PfK9V-kUFV3D1jxKbU','2026-07-20T07:44:41.558663+00:00','2026-07-27T07:44:41+00:00','6ef6f050-877d-4812-893f-b42ea423fdb9','726f8e00635d42d7b7090e9e1df1834b'],
    [7,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTEzODQwNSwiaWF0IjoxNzg0NTMzNjA1LCJqdGkiOiIzMGRmYzJlZDBlZWI0YzFmOTkzZGY0YzE0NWM4NmM0OSIsInVzZXJfaWQiOiI2ZWY2ZjA1MC04NzdkLTQ4MTItODkzZi1iNDJlYTQyM2ZkYjkifQ.IxVSjvJlN5MDgkJSSaz8RsNmz14QyvNCgTCDhSMNKkg','2026-07-20T07:46:45.992925+00:00','2026-07-27T07:46:45+00:00','6ef6f050-877d-4812-893f-b42ea423fdb9','30dfc2ed0eeb4c1f993df4c145c86c49'],
    [8,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTEzOTEwNCwiaWF0IjoxNzg0NTM0MzA0LCJqdGkiOiI4YTFiNWZkNzNjNDA0MzU0YTFiODZjOTJmZTA2MDAyOSIsInVzZXJfaWQiOiI2ZWY2ZjA1MC04NzdkLTQ4MTItODkzZi1iNDJlYTQyM2ZkYjkifQ.51gJLegud6SlgDlr1a5MA0Ofobw6r7s_Nkd1iPvi0kg','2026-07-20T07:58:24.456324+00:00','2026-07-27T07:58:24+00:00','6ef6f050-877d-4812-893f-b42ea423fdb9','8a1b5fd73c404354a1b86c92fe060029'],
    [9,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTEzOTIyMywiaWF0IjoxNzg0NTM0NDIzLCJqdGkiOiJhZWVmNTFjNTlmMmE0MmZmOGNjYTA0NmE4MjE2YjE0ZiIsInVzZXJfaWQiOiJkNGFlNGNjZi0wYmJlLTQ5ZDYtYWM1MS01YzIzNWQ3NWY5MDgifQ.kZqQX3oHhcdRoD77YlxwPIY3QZJyojqp6flZtF5Pi_c','2026-07-20T08:00:23.003249+00:00','2026-07-27T08:00:23+00:00','d4ae4ccf-0bbe-49d6-ac51-5c235d75f908','aeef51c59f2a42ff8cca046a8216b14f'],
    [10,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTE0NTMzOSwiaWF0IjoxNzg0NTQwNTM5LCJqdGkiOiI5MTdmMjZiMjEwNzI0YmM5YWQyZjViYTBlZjAxY2NhMSIsInVzZXJfaWQiOiJkNGFlNGNjZi0wYmJlLTQ5ZDYtYWM1MS01YzIzNWQ3NWY5MDgifQ.kNLxw1KCMch3IrzKc7vMR32ackR2tHVPbhS9HDKy7G0','2026-07-20T09:42:19.705305+00:00','2026-07-27T09:42:19+00:00','d4ae4ccf-0bbe-49d6-ac51-5c235d75f908','917f26b210724bc9ad2f5ba0ef01cca1'],
    [11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4NTE1MDYyMywiaWF0IjoxNzg0NTQ1ODIzLCJqdGkiOiJlYjYzYTUyYjgwZTc0NGM4OTc1NTA4Nzk5OTI2NWM0ZCIsInVzZXJfaWQiOiJkNGFlNGNjZi0wYmJlLTQ5ZDYtYWM1MS01YzIzNWQ3NWY5MDgifQ.5iULP9FkyYo7Cd__PzIensokm7D9mnkEvdUZQUMEilw','2026-07-20T11:10:23.849620+00:00','2026-07-27T11:10:23+00:00','d4ae4ccf-0bbe-49d6-ac51-5c235d75f908','eb63a52b80e744c89755087999265c4d'],
  ];
  for (const [id, token, created, expires, uid, jti] of tokens) {
    await sql`INSERT INTO token_blacklist_outstandingtoken (id, token, created_at, expires_at, user_id, jti)
      VALUES (${id}, ${token}, ${created}, ${expires}, ${uid}, ${jti}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log('  done');

  // 9. django_admin_log
  console.log('Seeding django_admin_log...');
  await sql`INSERT INTO django_admin_log (id, action_time, content_type_id, object_id, object_repr, action_flag, change_message, user_id)
    VALUES (1, '2026-07-20T07:28:43.928479+00:00', 10, 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 'staff@deesoar.edu', 1, '[{"added": {}}]', '6ef6f050-877d-4812-893f-b42ea423fdb9')
    ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO django_admin_log (id, action_time, content_type_id, object_id, object_repr, action_flag, change_message, user_id)
    VALUES (2, '2026-07-20T07:29:09.434188+00:00', 10, 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 'staff@deesoar.edu', 2, '[{"changed": {"fields": ["First name"]}}]', '6ef6f050-877d-4812-893f-b42ea423fdb9')
    ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO django_admin_log (id, action_time, content_type_id, object_id, object_repr, action_flag, change_message, user_id)
    VALUES (3, '2026-07-20T07:29:18.997280+00:00', 9, '732be41c-30f6-4675-a89f-6ec3a173ff61', 'Mika', 1, '[{"added": {}}]', '6ef6f050-877d-4812-893f-b42ea423fdb9')
    ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO django_admin_log (id, action_time, content_type_id, object_id, object_repr, action_flag, change_message, user_id)
    VALUES (4, '2026-07-20T07:34:25.399908+00:00', 10, 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 'staff@deesoar.edu', 2, '[]', '6ef6f050-877d-4812-893f-b42ea423fdb9')
    ON CONFLICT (id) DO NOTHING`;
  console.log('  done');

  console.log('All data seeded successfully!');
}

main().catch(e => { console.error(e); process.exit(1); });
