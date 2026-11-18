create table notification (
    id uuid primary key,
    user_id uuid not null references app_user(id) on delete cascade,
    type varchar(80) not null,
    title varchar(160) not null,
    message text not null,
    related_appointment_id uuid references appointment(id) on delete set null,
    read_at timestamptz,
    created_at timestamptz not null
);

create index idx_notification_user_created on notification(user_id, created_at desc);
create index idx_notification_user_unread on notification(user_id, read_at) where read_at is null;
