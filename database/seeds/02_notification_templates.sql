-- Notification Templates Seed Data
-- Insert common notification templates for email, SMS, and push notifications

-- Email Templates
INSERT INTO notifications.templates (
  template_id, template_name, description, template_type, channel, 
  subject_template, body_template, html_template, variables, is_active
) VALUES
(
  'drive_eligibility_email',
  'Drive Eligibility Notification (Email)',
  'Notify students when they are eligible for a job drive',
  'JOB_NOTIFICATION',
  'EMAIL',
  'You are eligible for {{company_name}} - {{job_title}}',
  'Dear {{student_name}}, You are eligible for {{company_name}} - {{job_title}}. CTC: {{ctc}}. Deadline: {{deadline}}.',
  '<html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background-color:#2563eb;color:white;padding:20px;text-align:center}.content{padding:20px;background-color:#f9fafb}.button{display:inline-block;padding:12px 24px;background-color:#2563eb;color:white;text-decoration:none;border-radius:5px;margin:10px 0}.footer{text-align:center;padding:20px;font-size:12px;color:#6b7280}</style></head><body><div class="container"><div class="header"><h1>New Job Opportunity!</h1></div><div class="content"><p>Dear {{student_name}},</p><p>Great news! You are eligible for the following job opportunity:</p><h2>{{company_name}} - {{job_title}}</h2><p><strong>CTC:</strong> {{ctc}}</p><p><strong>Location:</strong> {{location}}</p><p><strong>Application Deadline:</strong> {{deadline}}</p><p>{{job_description}}</p><a href="{{application_link}}" class="button">Apply Now</a><p>Don''t miss this opportunity! Apply before the deadline.</p></div><div class="footer"><p>TPO Management System | {{college_name}}</p><p>This is an automated notification. Please do not reply to this email.</p></div></div></body></html>',
  '["student_name", "company_name", "job_title", "ctc", "location", "deadline", "job_description", "application_link", "college_name"]'::jsonb,
  true
),
(
  'application_status_email',
  'Application Status Update (Email)',
  'Notify students about application status changes',
  'APPLICATION_STATUS',
  'EMAIL',
  'Application Status Update - {{company_name}}',
  'Dear {{student_name}}, Your application for {{job_title}} at {{company_name}} has been updated. Status: {{status}}.',
  '<html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background-color:#2563eb;color:white;padding:20px;text-align:center}.content{padding:20px;background-color:#f9fafb}.status{padding:10px;border-radius:5px;margin:10px 0;font-weight:bold}.status-approved{background-color:#d1fae5;color:#065f46}.status-shortlisted{background-color:#dbeafe;color:#1e40af}.status-rejected{background-color:#fee2e2;color:#991b1b}.footer{text-align:center;padding:20px;font-size:12px;color:#6b7280}</style></head><body><div class="container"><div class="header"><h1>Application Status Update</h1></div><div class="content"><p>Dear {{student_name}},</p><p>Your application for <strong>{{job_title}}</strong> at <strong>{{company_name}}</strong> has been updated.</p><div class="status status-{{status_class}}">Status: {{status}}</div><p>{{status_message}}</p><p>{{next_steps}}</p></div><div class="footer"><p>TPO Management System | {{college_name}}</p></div></div></body></html>',
  '["student_name", "company_name", "job_title", "status", "status_class", "status_message", "next_steps", "college_name"]'::jsonb,
  true
),
(
  'deadline_reminder_email',
  'Application Deadline Reminder (Email)',
  'Remind students about upcoming application deadlines',
  'DEADLINE_REMINDER',
  'EMAIL',
  'Reminder: Application Deadline - {{company_name}}',
  'URGENT: Application deadline for {{company_name}} - {{job_title}} is {{deadline}}. Time remaining: {{time_remaining}}.',
  '<html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background-color:#dc2626;color:white;padding:20px;text-align:center}.content{padding:20px;background-color:#f9fafb}.urgent{background-color:#fef2f2;border-left:4px solid #dc2626;padding:15px;margin:15px 0}.button{display:inline-block;padding:12px 24px;background-color:#dc2626;color:white;text-decoration:none;border-radius:5px;margin:10px 0}.footer{text-align:center;padding:20px;font-size:12px;color:#6b7280}</style></head><body><div class="container"><div class="header"><h1>⏰ Deadline Reminder</h1></div><div class="content"><p>Dear {{student_name}},</p><div class="urgent"><p><strong>URGENT:</strong> The application deadline for <strong>{{company_name}} - {{job_title}}</strong> is approaching!</p><p><strong>Deadline:</strong> {{deadline}}</p><p><strong>Time Remaining:</strong> {{time_remaining}}</p></div><p>If you haven''t applied yet, please do so before the deadline.</p><a href="{{application_link}}" class="button">Apply Now</a></div><div class="footer"><p>TPO Management System | {{college_name}}</p></div></div></body></html>',
  '["student_name", "company_name", "job_title", "deadline", "time_remaining", "application_link", "college_name"]'::jsonb,
  true
),
(
  'interview_invitation_email',
  'Interview Invitation (Email)',
  'Invite students for interviews',
  'EVENT_REMINDER',
  'EMAIL',
  'Interview Invitation - {{company_name}}',
  'Congratulations! You have been shortlisted for an interview with {{company_name}} on {{interview_date}} at {{interview_time}}.',
  '<html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background-color:#059669;color:white;padding:20px;text-align:center}.content{padding:20px;background-color:#f9fafb}.details{background-color:white;border:1px solid #d1d5db;padding:15px;margin:15px 0;border-radius:5px}.button{display:inline-block;padding:12px 24px;background-color:#059669;color:white;text-decoration:none;border-radius:5px;margin:10px 0}.footer{text-align:center;padding:20px;font-size:12px;color:#6b7280}</style></head><body><div class="container"><div class="header"><h1>🎉 Interview Invitation</h1></div><div class="content"><p>Dear {{student_name}},</p><p>Congratulations! You have been shortlisted for an interview with <strong>{{company_name}}</strong>.</p><div class="details"><p><strong>Position:</strong> {{job_title}}</p><p><strong>Interview Date:</strong> {{interview_date}}</p><p><strong>Interview Time:</strong> {{interview_time}}</p><p><strong>Interview Mode:</strong> {{interview_mode}}</p><p><strong>Location/Link:</strong> {{interview_location}}</p><p><strong>Duration:</strong> {{interview_duration}}</p></div><p><strong>Instructions:</strong></p><p>{{interview_instructions}}</p><a href="{{rsvp_link}}" class="button">Confirm Attendance</a><p>Please confirm your attendance by clicking the button above.</p></div><div class="footer"><p>TPO Management System | {{college_name}}</p></div></div></body></html>',
  '["student_name", "company_name", "job_title", "interview_date", "interview_time", "interview_mode", "interview_location", "interview_duration", "interview_instructions", "rsvp_link", "college_name"]'::jsonb,
  true
),
(
  'offer_notification_email',
  'Job Offer Notification (Email)',
  'Notify students about job offers',
  'OFFER_NOTIFICATION',
  'EMAIL',
  'Job Offer - {{company_name}}',
  'Congratulations! You have received a job offer from {{company_name}} for {{job_title}}. CTC: {{ctc}}.',
  '<html><head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background-color:#7c3aed;color:white;padding:20px;text-align:center}.content{padding:20px;background-color:#f9fafb}.offer{background-color:#faf5ff;border:2px solid #7c3aed;padding:20px;margin:15px 0;border-radius:5px}.button{display:inline-block;padding:12px 24px;background-color:#7c3aed;color:white;text-decoration:none;border-radius:5px;margin:10px 5px}.footer{text-align:center;padding:20px;font-size:12px;color:#6b7280}</style></head><body><div class="container"><div class="header"><h1>🎊 Congratulations!</h1></div><div class="content"><p>Dear {{student_name}},</p><p>We are delighted to inform you that you have received a job offer from <strong>{{company_name}}</strong>!</p><div class="offer"><h2>Offer Details</h2><p><strong>Position:</strong> {{job_title}}</p><p><strong>CTC:</strong> {{ctc}}</p><p><strong>Joining Date:</strong> {{joining_date}}</p><p><strong>Location:</strong> {{location}}</p><p><strong>Offer Valid Until:</strong> {{offer_expiry}}</p></div><p>Please review the offer letter attached and respond before the expiry date.</p><a href="{{accept_link}}" class="button">Accept Offer</a><a href="{{decline_link}}" class="button" style="background-color:#6b7280">Decline Offer</a></div><div class="footer"><p>TPO Management System | {{college_name}}</p></div></div></body></html>',
  '["student_name", "company_name", "job_title", "ctc", "joining_date", "location", "offer_expiry", "accept_link", "decline_link", "college_name"]'::jsonb,
  true
);

-- SMS Templates
INSERT INTO notifications.templates (
  template_id, template_name, description, template_type, channel, 
  subject_template, body_template, variables, is_active
) VALUES
(
  'drive_eligibility_sms',
  'Drive Eligibility Notification (SMS)',
  'SMS notification for job eligibility',
  'JOB_NOTIFICATION',
  'SMS',
  '',
  'Hi {{student_name}}, You are eligible for {{company_name}} - {{job_title}}. CTC: {{ctc}}. Deadline: {{deadline}}. Apply now at {{short_link}}',
  '["student_name", "company_name", "job_title", "ctc", "deadline", "short_link"]'::jsonb,
  true
),
(
  'application_status_sms',
  'Application Status Update (SMS)',
  'SMS notification for application status',
  'APPLICATION_STATUS',
  'SMS',
  '',
  'Hi {{student_name}}, Your application for {{company_name}} - {{job_title}} is now {{status}}. {{next_steps}}',
  '["student_name", "company_name", "job_title", "status", "next_steps"]'::jsonb,
  true
),
(
  'deadline_reminder_sms',
  'Deadline Reminder (SMS)',
  'SMS reminder for application deadline',
  'DEADLINE_REMINDER',
  'SMS',
  '',
  'URGENT: Application deadline for {{company_name}} - {{job_title}} is {{deadline}}. Time remaining: {{time_remaining}}. Apply now!',
  '["company_name", "job_title", "deadline", "time_remaining"]'::jsonb,
  true
),
(
  'interview_invitation_sms',
  'Interview Invitation (SMS)',
  'SMS notification for interview',
  'EVENT_REMINDER',
  'SMS',
  '',
  'Congratulations! Interview scheduled with {{company_name}} on {{interview_date}} at {{interview_time}}. Mode: {{interview_mode}}. Confirm at {{rsvp_link}}',
  '["company_name", "interview_date", "interview_time", "interview_mode", "rsvp_link"]'::jsonb,
  true
),
(
  'offer_notification_sms',
  'Job Offer Notification (SMS)',
  'SMS notification for job offer',
  'OFFER_NOTIFICATION',
  'SMS',
  '',
  'Congratulations {{student_name}}! You have received a job offer from {{company_name}} for {{job_title}}. CTC: {{ctc}}. Check your email for details.',
  '["student_name", "company_name", "job_title", "ctc"]'::jsonb,
  true
);

-- Push Notification Templates
INSERT INTO notifications.templates (
  template_id, template_name, description, template_type, channel, 
  subject_template, body_template, variables, is_active
) VALUES
(
  'drive_eligibility_push',
  'Drive Eligibility Notification (Push)',
  'Push notification for job eligibility',
  'JOB_NOTIFICATION',
  'PUSH',
  'New Job Opportunity!',
  'You are eligible for {{company_name}} - {{job_title}}. CTC: {{ctc}}. Apply before {{deadline}}.',
  '["company_name", "job_title", "ctc", "deadline"]'::jsonb,
  true
),
(
  'application_status_push',
  'Application Status Update (Push)',
  'Push notification for application status',
  'APPLICATION_STATUS',
  'PUSH',
  'Application Update',
  'Your application for {{company_name}} is now {{status}}.',
  '["company_name", "status"]'::jsonb,
  true
),
(
  'deadline_reminder_push',
  'Deadline Reminder (Push)',
  'Push notification for deadline',
  'DEADLINE_REMINDER',
  'PUSH',
  '⏰ Deadline Alert',
  'Application deadline for {{company_name}} is {{deadline}}. {{time_remaining}} remaining!',
  '["company_name", "deadline", "time_remaining"]'::jsonb,
  true
),
(
  'interview_invitation_push',
  'Interview Invitation (Push)',
  'Push notification for interview',
  'EVENT_REMINDER',
  'PUSH',
  '🎉 Interview Invitation',
  'Interview with {{company_name}} on {{interview_date}} at {{interview_time}}.',
  '["company_name", "interview_date", "interview_time"]'::jsonb,
  true
),
(
  'offer_notification_push',
  'Job Offer Notification (Push)',
  'Push notification for job offer',
  'OFFER_NOTIFICATION',
  'PUSH',
  '🎊 Job Offer Received!',
  'Congratulations! Offer from {{company_name}} for {{job_title}}. CTC: {{ctc}}.',
  '["company_name", "job_title", "ctc"]'::jsonb,
  true
);

-- Success message
SELECT 'Notification templates inserted successfully! Total: 15 templates' AS message;
