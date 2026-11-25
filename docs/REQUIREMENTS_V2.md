# Kuri Labo Requirements V2

## 1. Product scope

Kuri Labo is a nail salon CRM and appointment platform with two roles:

- **User**: manages their profile, browses their own nail history and inspiration, saves inspiration, requests appointments, and reviews appointment history.
- **Admin**: manages all users, appointments, availability, services, media, inspiration, visit records, and customer preferences.

The product will be available through:

- an Expo React Native mobile app;
- a React web application for users and admins;
- a Spring Boot backend shared by both clients.

## 2. Roles and permissions

### 2.1 User

A user can:

- register, sign in, sign out, and update their own profile;
- view their own nail collection and visit history;
- browse inspiration images;
- save and remove personal inspiration favorites;
- request an appointment;
- view their own pending, confirmed, completed, rejected, and cancelled appointments;
- submit a cancellation request more than 24 hours before an appointment;
- view the salon contact reminder and WeChat ID when manual contact is required.

A user cannot:

- confirm their own appointment;
- directly cancel an appointment;
- request cancellation within 24 hours of the appointment through the app;
- view or modify another user's private data.

### 2.2 Admin

An admin can manage all product data, including:

- users and profiles;
- service definitions and durations;
- appointments and cancellation requests;
- normal business hours and exceptional availability;
- nail collections and visit records;
- inspiration images and user favorites;
- uploaded media;
- prices, service notes, customer notes, and appointment status;
- audit records.

Admin accounts may create appointments at any time of day and are not restricted to normal user booking hours.

### 2.3 Interface language

- Users and admins can choose English (`en`) or Simplified Chinese (`zh-CN`) in Personal Details on web and mobile.
- The preference belongs to the account and defaults to English for existing accounts.
- A draft selection takes effect only after Save changes succeeds. Failed saves preserve the active interface language.
- Authentication and profile responses include the preference so another device can restore it when signing in or refreshing the profile.
- Navigation, forms, statuses, system notifications and display dates follow the selected language. Names, custom service definitions, notes and uploaded content retain their original text.

## 3. Services

The initial service catalog contains:

| Service | Duration |
| --- | ---: |
| Basic | 120 minutes |
| Complex | 180 minutes |

Service definitions must be stored in the database rather than hard-coded so admins can manage them later.

## 4. User appointment rules

### 4.1 Business hours

- Normal user booking hours are **09:00 to 18:00** in the salon's configured timezone.
- The initial salon timezone is **America/Vancouver**.
- User-selectable start times use 30-minute increments: `09:00`, `09:30`, `10:00`, and so on.
- An appointment must finish by 18:00.
- The latest normal start time therefore depends on the selected service:
  - Basic: 16:00
  - Complex: 15:00

### 4.2 Availability

The system calculates the end time from the selected service duration.

A candidate appointment is unavailable when it overlaps any active appointment or an admin availability block. Two intervals overlap when:

```text
candidateStart < existingEnd
AND
existingStart < candidateEnd
```

Example: if an active appointment exists from 11:00 to 12:00, a Basic appointment from 10:00 to 12:00 must be disabled.

Statuses that occupy time:

- `PENDING_CONFIRMATION`
- `CONFIRMED`
- `CANCELLATION_REQUESTED`

Statuses that do not occupy time:

- `REJECTED`
- `CANCELLED`

Completed and no-show appointments remain historical records. Past records do not affect future availability calculations.

Availability must be enforced by the backend and database under concurrent requests. Frontend availability checks are advisory only.

### 4.3 Booking workflow

1. User selects a service.
2. User selects a future date.
3. The system displays valid 30-minute start times.
4. User selects a start time and may add a note.
5. Backend validates availability and creates the appointment as `PENDING_CONFIRMATION`.
6. A pending appointment immediately reserves the time.
7. Admin confirms or rejects the appointment.
8. Only `CONFIRMED` means the booking has been accepted by the salon.
9. If rejected, the reserved time is released.

## 5. Admin appointment rules

- Admin can create an appointment for any customer.
- Admin selects both the start and end time.
- Admin appointment times use 30-minute increments.
- Admin may create appointments outside 09:00 to 18:00.
- Admin may confirm, reject, edit, cancel, complete, or mark an appointment as no-show.
- An explicit override may allow an admin to create an overlapping appointment.
- An overlap override must show a warning and create an audit record.

## 6. Cancellation rules

Users never directly cancel a confirmed appointment.

### More than 24 hours before start

- User may submit a cancellation request.
- Status becomes `CANCELLATION_REQUESTED`.
- The appointment continues occupying its time.
- Admin reviews the request and either cancels the appointment or rejects the cancellation request.
- The time is released only when the appointment becomes `CANCELLED`.

### Within 24 hours of start

- The app does not provide a cancellation request action.
- The user is instructed to contact the nail artist directly.
- The contact reminder displays the salon's configured WeChat ID.

Admin may cancel or modify an appointment at any time.

## 7. Appointment lifecycle

```text
PENDING_CONFIRMATION
  -> CONFIRMED
  -> REJECTED

CONFIRMED
  -> CANCELLATION_REQUESTED
  -> COMPLETED
  -> NO_SHOW
  -> CANCELLED

CANCELLATION_REQUESTED
  -> CANCELLED
  -> CONFIRMED (cancellation request rejected)
```

Every status transition records who performed it and when it occurred.

## 8. Nail artist contact

The MVP does not include in-app chat.

The booking and appointment screens display a configurable reminder such as:

> Have a special request or need help within 24 hours of your appointment? Contact the nail artist on WeChat: `{wechatId}`.

The WeChat ID and contact text must be configurable by an admin. A copy action should be provided where supported.

## 9. Inspiration favorites

- Favorites are persisted in the database.
- A favorite belongs to one client record and one inspiration item.
- A user cannot save the same inspiration item more than once.
- Users can view and remove their saved inspiration.
- Admins can view a customer's saved inspiration as part of the customer's preference profile.
- Favorite events may later be used for recommendations and analytics.

## 9.1 Client records and login accounts

- CRM client records and login accounts are separate entities linked by `clientId`.
- Admins can create a client with only a unique admin-only internal name; phone is optional.
- Customer-facing names may repeat. Admin internal names must be unique among active clients.
- A customer registration creates an account and a client record unless an eligible existing client is claimed.
- In test mode, an unlinked client with the same normalized phone can be claimed automatically while preserving its `clientId`, appointments, photos, favorites, and history.
- Production must not use automatic phone claiming without verification. Until OTP is implemented, same-phone matches create a separate registered client for an admin-reviewed merge.
- Manual merge moves all customer-owned records, keeps the registered account attached to the target, and archives the source through merge history rather than deleting it.

## 10. Visit completion

When completing an appointment, an admin can:

- record the final price;
- add private service notes;
- upload one or more nail photos;
- add the result to the customer's collection;
- optionally publish selected media to Inspiration.

## 11. Data safety and auditability

- Important business records use soft deletion where appropriate.
- Admin overrides and important status transitions are audited.
- Media files are stored in object storage, not inside PostgreSQL as binary or base64 data.
- All authorization is enforced by the Spring Boot backend.
- Mobile and web clients never connect directly to PostgreSQL.

## 12. Out of scope for the first backend release

- in-app chat;
- online payment and deposits;
- automatic SMS delivery;
- AI recommendations;
- multiple salon locations;
- multiple nail artists and staff scheduling.

