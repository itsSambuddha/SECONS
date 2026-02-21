# SECONS Permissions Protocol

This document outlines the hierarchical access control and operational capabilities of all member roles in the SECONS platform.

## Role Hierarchy

| Tier | Role | Description | Access Level |
| :--- | :--- | :--- | :--- |
| **1** | **General Animator (GA)** | Super Admin / Festival Director | Global Oversight (All Domains) |
| **2** | **Joint General Animator (JGA)** | Domain Leads | Domain Oversight (e.g., Sports Lead) |
| **3** | **Animator** | Event Coordinators | Operational Management |
| **4** | **Volunteer** | On-ground Staff | Content Management |
| **5** | **Student** | General Participants | View & Register (Read-only Internal) |

---

## Permission Matrices

### 1. Events & Categories
- **GA**: Create/Edit/Delete all events and categories. Bulk import via CSV.
- **JGA**: Create/Edit visibility for their own domain events.
- **Animator/Volunteer**: Update event flyers and details.
- **Student**: View events and register.

### 2. Sports Command Node
- **GA**: Create matches, seed teams, delete records.
- **JGA**: Update scores and finalize matches.
- **Animator**: Manage live telemetry (Cricket Scorer).
- **Student**: View live scoreboard (Public).

### 3. Communication (Announcements & Chat)
- **GA**: Broadcast global announcements, create public chat threads, pin messages.
- **JGA**: Broadcast domain-specific announcements.
- **Animator/Volunteer**: Send messages in assigned threads.
- **Student**: Receive notifications, join allowed chats, read announcements.

### 4. Finance (Circuit Funds)
- **GA**: Allocate budgets to domains, approve/reject all expenses.
- **JGA**: Submit expenses for their domain, approve/reject domain-level costs.
- **Animator/Volunteer**: Submit expenses with receipt links.
- **Student**: (No access).

### 5. Management & Privacy
- **GA**: Invite JGAs, manage all user profiles.
- **JGA**: Invite Animators/Volunteers to their domain.
- **All**: Update own profile settings (Phone, Photo).

---

## Public Access (Unauthenticated)
- **Home Page**: Featured events and overview.
- **All Events**: List of all festival happenings.
- **Live Scoreboard**: Real-time sports pulse.
- **Registration**: Public intent to join events.
