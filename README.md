# ShiftMate

ShiftMate is a workforce management and shift scheduling application designed to help companies manage employees, shifts, availability, leave requests, and automatic shift assignment.

The project is built as a full-stack application with an ASP.NET Core backend and a React + TypeScript frontend.

## Features

### Authentication & Authorization

- JWT-based authentication
- Secure password hashing
- User registration and company onboarding
- Role-based authorization
- Admin, Manager and Employee roles
- Current-user context
- Multi-tenant company isolation
- Secure company-specific data access

### Employee Management

- Employee creation and management
- Department management
- Employee roles
- Employee availability
- Employee preferences
- Day-specific preferences
- Maximum weekly working hours

### Shift Management

- Shift creation and management
- Shift status workflow
- Shift assignments
- Role requirements for shifts
- Prevention of duplicate assignments
- Shift conflict detection
- Leave and availability validation

### Automatic Scheduling

ShiftMate provides an automatic scheduling system that evaluates employees based on multiple factors:

- Required role
- Availability
- Existing workload
- Scheduled working hours
- Preferred working days
- Maximum weekly hours
- Existing leave
- Shift conflicts

The scheduling system also considers fairness when selecting employees.

### Security & Validation

- Multi-tenant authorization
- Role-based endpoint protection
- Company ownership checks
- Employee ownership checks
- Shift ownership checks
- Duplicate data prevention
- Request validation
- Global exception handling
- Consistent HTTP error responses

## Technologies

### Backend

- C#
- ASP.NET Core
- .NET 8
- Entity Framework Core
- Microsoft SQL Server
- SQL Server Express
- JWT Authentication
- Swagger / OpenAPI
- xUnit
- Moq

### Frontend

- React
- TypeScript

## Project Structure

```text
ShiftMate/
├── backend/
│   ├── ShiftMate.API/
│   └── ShiftMate.Tests/
├── frontend/
├── docs/
├── .gitignore
└── README.md
```

## Backend Architecture

The backend follows a layered structure:

```text
Controllers
    ↓
Services
    ↓
Entity Framework Core
    ↓
SQL Server
```

Controllers are responsible for HTTP requests and authorization.

Services contain the application's business logic, including:

- Shift eligibility
- Candidate scoring
- Automatic scheduling
- Employee workload calculation
- Shift status management
- Authentication
- Authorization

Entity Framework Core is used for database access and migrations.

## Database

ShiftMate uses Microsoft SQL Server.

Main entities include:

- Companies
- Locations
- Departments
- Employees
- Roles
- EmployeeRoles
- Shifts
- ShiftAssignments
- ShiftRoleRequirements
- Availabilities
- LeaveRequests
- EmployeePreferences
- EmployeeDayPreferences
- Users

Entity Framework Core migrations are used to manage database schema changes.

## Authentication

ShiftMate uses JWT bearer authentication.

Authentication flow:

```text
User
 ↓
Login
 ↓
Password verification
 ↓
JWT generation
 ↓
Authenticated API requests
```

The JWT contains information such as:

- User ID
- Email
- Company ID
- Role
- Employee ID (when applicable)

JWT secrets are stored using ASP.NET Core User Secrets during development and should be provided through secure environment configuration in production.

## Multi-Tenancy

Each company represents an isolated tenant.

Authenticated users can only access data belonging to their own company.

For example:

```text
Company 1
 ├── Employees
 ├── Locations
 ├── Departments
 └── Shifts

Company 2
 ├── Employees
 ├── Locations
 ├── Departments
 └── Shifts
```

Cross-company access is rejected by the API.

## Shift Status Workflow

Shifts use the following statuses:

```text
Draft
  ↓
Open
  ↓
Scheduled
  ↓
InProgress
  ↓
Completed
```

A shift can also be cancelled from the appropriate states.

`Completed` and `Cancelled` are terminal states.

## Automatic Scheduling

The automatic scheduling process follows this general flow:

```text
Shift
 ↓
Role Requirements
 ↓
Find eligible employees
 ↓
Calculate candidate scores
 ↓
Order candidates
 ↓
Apply fairness rules
 ↓
Assign employees
 ↓
Return scheduling result
```

Candidate selection considers eligibility first and scoring second.

## API

The backend exposes REST API endpoints through ASP.NET Core controllers.

Swagger / OpenAPI is available during development:

```text
http://localhost:5083/swagger
```

The API health endpoint is:

```text
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "message": "ShiftMate API is running"
}
```

## Running the Backend

### Requirements

- .NET 8 SDK
- Microsoft SQL Server Express
- SQL Server Management Studio or another SQL client
- Git

### Database Configuration

The backend uses the following SQL Server connection:

```text
Server=localhost\SQLEXPRESS;
Database=ShiftMateDb;
Trusted_Connection=True;
TrustServerCertificate=True;
```

Update the connection string if your local SQL Server configuration is different.

### JWT Configuration

The JWT configuration contains:

```json
"Jwt": {
  "Issuer": "ShiftMate",
  "Audience": "ShiftMate",
  "ExpirationMinutes": 60
}
```

The JWT signing key is stored separately using ASP.NET Core User Secrets.

### Apply Migrations

From the API project:

```powershell
dotnet ef database update
```

### Run the API

```powershell
dotnet run
```

The API will be available at:

```text
http://localhost:5083
```

Swagger:

```text
http://localhost:5083/swagger
```

## Testing

The project uses xUnit for automated tests.

Run all tests with:

```powershell
dotnet test
```

Current test suite:

```text
58 tests
58 succeeded
0 failed
0 skipped
```

The tests cover important areas such as:

- Authentication
- Authorization
- Tenant isolation
- Shift eligibility
- Candidate scoring
- Automatic scheduling
- Shift status management
- Validation and security scenarios

## Development

Build the backend:

```powershell
dotnet build
```

Run tests:

```powershell
dotnet test
```

Run the application:

```powershell
dotnet run
```

## Project Status

### Backend

- Authentication: Complete
- Authorization: Complete
- Multi-tenancy: Complete
- Employee management: Complete
- Shift management: Complete
- Availability management: Complete
- Leave management: Complete
- Employee preferences: Complete
- Candidate scoring: Complete
- Automatic scheduling: Complete
- Shift status management: Complete
- Error handling: Complete
- Validation: Complete
- CORS configuration: Complete
- Automated tests: 58 passing

### Frontend

React + TypeScript frontend development is the next major phase of the project.

## License

This project is developed as an academic and portfolio project.
