# Database Schema

## Tables & Relations

```sql
┌─────────────┐         ┌──────────────┐
│   cgroups    │────┬───→│    users     │
└─────────────┘    │    └──────────────┘
                   │           │
                   │           │ (user_id)
                   │           ↓
                   │    ┌──────────────┐
                   └───→│ reservations │
                        └──────────────┘
                               │
                               │ (reservation_id)
                               ↓
                        ┌──────────────┐
                        │  fuel_logs   │
                        └──────────────┘

                   ┌──────────────┐
                   │    rules     │
                   └──────────────┘
```

## Table: cgroups
Stores household/family cgroups that share a car.

| Column      | Type         | Constraints                    |
|-------------|--------------|--------------------------------|
| id          | INT          | PRIMARY KEY, AUTO_INCREMENT    |
| name        | VARCHAR(100) | NOT NULL                       |
| car_model   | VARCHAR(100) | NULL                           |
| created_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      |

## Table: users
Stores all users in the system.

| Column         | Type         | Constraints                           |
|----------------|--------------|---------------------------------------|
| id             | INT          | PRIMARY KEY, AUTO_INCREMENT           |
| group_id       | INT          | NOT NULL, FOREIGN KEY → cgroups(id)    |
| username       | VARCHAR(50)  | NOT NULL, UNIQUE                      |
| password_hash  | VARCHAR(255) | NOT NULL                              |
| full_name      | VARCHAR(100) | NOT NULL                              |
| is_admin       | BOOLEAN      | DEFAULT FALSE                         |
| fuel_balance   | DECIMAL(10,2)| DEFAULT 0.00                          |
| created_at     | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP             |

**Indexes:**
- `idx_username` on username
- `idx_group_id` on group_id

## Table: reservations
Stores car reservations.

| Column         | Type         | Constraints                           |
|----------------|--------------|---------------------------------------|
| id             | INT          | PRIMARY KEY, AUTO_INCREMENT           |
| user_id        | INT          | NOT NULL, FOREIGN KEY → users(id)     |
| group_id       | INT          | NOT NULL, FOREIGN KEY → cgroups(id)    |
| start_time     | DATETIME     | NOT NULL                              |
| end_time       | DATETIME     | NOT NULL                              |
| status         | ENUM         | 'pending','approved','completed','cancelled' |
| notes          | TEXT         | NULL                                  |
| created_at     | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP             |
| updated_at     | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE   |

**Indexes:**
- `idx_group_time` on (group_id, start_time, end_time)
- `idx_user_id` on user_id
- `idx_status` on status

**Constraints:**
- CHECK (end_time > start_time)
- UNIQUE constraint to prevent overlaps (handled in application logic)

## Table: fuel_logs
Tracks fuel usage per reservation.

| Column              | Type         | Constraints                              |
|---------------------|--------------|------------------------------------------|
| id                  | INT          | PRIMARY KEY, AUTO_INCREMENT              |
| reservation_id      | INT          | NOT NULL, FOREIGN KEY → reservations(id) |
| user_id             | INT          | NOT NULL, FOREIGN KEY → users(id)        |
| fuel_before         | DECIMAL(5,2) | NOT NULL (% 0-100)                       |
| fuel_after          | DECIMAL(5,2) | NOT NULL (% 0-100)                       |
| fuel_added_liters   | DECIMAL(6,2) | DEFAULT 0.00                             |
| cost_paid           | DECIMAL(8,2) | DEFAULT 0.00                             |
| logged_at           | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP                |

**Indexes:**
- `idx_reservation_id` on reservation_id
- `idx_user_id` on user_id

## Table: rules
Admin-defined rules for the group.

| Column         | Type         | Constraints                           |
|----------------|--------------|---------------------------------------|
| id             | INT          | PRIMARY KEY, AUTO_INCREMENT           |
| group_id       | INT          | NOT NULL, FOREIGN KEY → cgroups(id)    |
| rule_type      | VARCHAR(50)  | NOT NULL                              |
| rule_value     | VARCHAR(255) | NOT NULL                              |
| description    | TEXT         | NULL                                  |
| is_active      | BOOLEAN      | DEFAULT TRUE                          |
| created_at     | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP             |

**Rule Types:**
- `min_fuel_level`: Minimum fuel % to return car with
- `max_reservation_hours`: Maximum reservation duration
- `advance_booking_days`: How far ahead users can book
- `admin_approval_required`: Whether reservations need approval

**Indexes:**
- `idx_group_type` on (group_id, rule_type, is_active)

## Relationships Summary

1. **cgroups → users**: One-to-Many (One group has many users)
2. **users → reservations**: One-to-Many (One user has many reservations)
3. **cgroups → reservations**: One-to-Many (One group has many reservations)
4. **reservations → fuel_logs**: One-to-One or One-to-Many
5. **cgroups → rules**: One-to-Many (One group has many rules)

## Data Integrity Rules

1. Cannot delete a group if it has users
2. Cannot delete a user if they have active reservations
3. Fuel balance is calculated from fuel_logs
4. Overlapping reservations prevented via application logic
5. Only one admin per group during setup (can be changed)
