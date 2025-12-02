-- Test Students
INSERT INTO auth.users (id, email, encrypted_password, role, is_active, email_verified)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'test.student1@student.com',
   '$2b$10$rKvVJKJ5fZ5fZ5fZ5fZ5fOqKvVJKJ5fZ5fZ5fZ5fZ5fZ5fZ5fZ5fZ',
   'ROLE_STUDENT', true, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO students.profiles (
  id, user_id, first_name, last_name,
  date_of_birth, gender, mobile_number, personal_email,
  address_permanent, enrollment_number, department, degree,
  year_of_admission, current_semester, expected_graduation_year,
  cgpi, tpo_dept_verified, profile_complete_percent, profile_status
)
VALUES (
  '11111111-1111-1111-1111-111111111112',
  '11111111-1111-1111-1111-111111111111',
  'Rajesh', 'Sharma',
  '2003-05-15', 'Male', '+91-9876543210', 'rajesh.sharma@gmail.com',
  '123 MG Road, Mumbai, Maharashtra - 400001',
  'TEST2021CSE001', 'CSE', 'B.Tech',
  2021, 7, 2025,
  8.75, true, 100, 'VERIFIED'
)
ON CONFLICT (enrollment_number) DO NOTHING;

SELECT 'Seed data inserted!' AS message;
