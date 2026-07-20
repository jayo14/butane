const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_OcuS5lT3Irai@ep-still-shadow-au88lpma-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  // exams_exam
  await sql`INSERT INTO exams_exam (id, created_at, updated_at, is_deleted, deleted_at, title, description, course, course_code, status, duration_minutes, total_marks, passing_marks, available_from, available_to, shuffle_questions, shuffle_answers, show_result, allow_review, created_by_id, archived_at, class_group, instructions, is_public, passing_percentage, published_at, subject, term, public_token_hash, short_code)
    VALUES ('b0f59d1d-1ca6-4fe9-8e88-633b12fef0ff', '2026-07-20T08:43:13.660230+00:00', '2026-07-20T08:43:13.867521+00:00', false, NULL, 'Hey', '', '', '', 'ongoing', 60, 0, 0, NULL, NULL, false, false, false, true, '732be41c-30f6-4675-a89f-6ec3a173ff61', NULL, 'sss2', 'Answer all', true, 50, '2026-07-20T08:43:13.865894+00:00', 'chemistry', 'second-term', '6de77ce69638e3a355d4cda9444369cdc6919b33adbd4ab63c8e4a7fb4c320f0', NULL) ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO exams_exam (id, created_at, updated_at, is_deleted, deleted_at, title, description, course, course_code, status, duration_minutes, total_marks, passing_marks, available_from, available_to, shuffle_questions, shuffle_answers, show_result, allow_review, created_by_id, archived_at, class_group, instructions, is_public, passing_percentage, published_at, subject, term, public_token_hash, short_code)
    VALUES ('6ce4c21e-7fa2-4772-956a-5c32c8b0386e', '2026-07-20T11:10:39.785838+00:00', '2026-07-20T11:10:39.984010+00:00', false, NULL, 'wjkfwnjfwnf', '', '', '', 'ongoing', 60, 0, 0, NULL, NULL, false, false, false, false, '732be41c-30f6-4675-a89f-6ec3a173ff61', NULL, 'sss1', 'jwkfnwjfnwkjf3njkf3 fk3j fk3j f3k', true, 76, '2026-07-20T11:10:39.978947+00:00', 'physics', 'second-term', '67c62af1fb8046762cd3896ceecbd151fe3ad6b5714235e166dac6463e19fcc2', 'W88YPAWM') ON CONFLICT (id) DO NOTHING`;
  console.log('exams_exam done');

  // exams_question
  await sql`INSERT INTO exams_question (id, created_at, updated_at, "order", text, type, marks, explanation, exam_id) VALUES ('62d71231-8cc1-4da6-8e9e-07fcfa5bb53f', '2026-07-20T08:43:13.669634+00:00', '2026-07-20T08:43:13.669676+00:00', 1, 'hey', 'single_choice', 1, '', 'b0f59d1d-1ca6-4fe9-8e88-633b12fef0ff') ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO exams_question (id, created_at, updated_at, "order", text, type, marks, explanation, exam_id) VALUES ('44bb5e03-80d0-4418-a032-a9e140303a30', '2026-07-20T11:10:39.797233+00:00', '2026-07-20T11:10:39.797303+00:00', 1, 'Mammal', 'single_choice', 1, '', '6ce4c21e-7fa2-4772-956a-5c32c8b0386e') ON CONFLICT (id) DO NOTHING`;
  console.log('exams_question done');

  // exams_choice
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
  console.log('exams_choice done');

  // django_admin_log
  await sql`INSERT INTO django_admin_log (id, action_time, content_type_id, object_id, object_repr, action_flag, change_message, user_id) VALUES (1, '2026-07-20T07:28:43.928479+00:00', 10, 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 'staff@deesoar.edu', 1, '[{"added": {}}]', '6ef6f050-877d-4812-893f-b42ea423fdb9') ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO django_admin_log (id, action_time, content_type_id, object_id, object_repr, action_flag, change_message, user_id) VALUES (2, '2026-07-20T07:29:09.434188+00:00', 10, 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 'staff@deesoar.edu', 2, '[{"changed": {"fields": ["First name"]}}]', '6ef6f050-877d-4812-893f-b42ea423fdb9') ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO django_admin_log (id, action_time, content_type_id, object_id, object_repr, action_flag, change_message, user_id) VALUES (3, '2026-07-20T07:29:18.997280+00:00', 9, '732be41c-30f6-4675-a89f-6ec3a173ff61', 'Mika', 1, '[{"added": {}}]', '6ef6f050-877d-4812-893f-b42ea423fdb9') ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO django_admin_log (id, action_time, content_type_id, object_id, object_repr, action_flag, change_message, user_id) VALUES (4, '2026-07-20T07:34:25.399908+00:00', 10, 'd4ae4ccf-0bbe-49d6-ac51-5c235d75f908', 'staff@deesoar.edu', 2, '[]', '6ef6f050-877d-4812-893f-b42ea423fdb9') ON CONFLICT (id) DO NOTHING`;
  console.log('django_admin_log done');

  // token_blacklist_blacklistedtoken
  await sql`INSERT INTO token_blacklist_blacklistedtoken (id, blacklisted_at, token_id) VALUES (1, '2026-07-20T07:58:37.438762+00:00', 8) ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO token_blacklist_blacklistedtoken (id, blacklisted_at, token_id) VALUES (2, '2026-07-20T09:42:19.774352+00:00', 9) ON CONFLICT (id) DO NOTHING`;
  console.log('token_blacklist_blacklistedtoken done');

  console.log('All remaining data seeded!');
}

main().catch(e => { console.error(e); process.exit(1); });
