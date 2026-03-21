<div align="center">

# PsyScreen PsychAnalysis Microservice

Event-driven psych analysis microservice built with NestJS, Kafka, and PostgreSQL for candidate scoring workflows.

</div>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white" alt="Kafka"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
</p>

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- **pnpm** (recommended) or npm/yarn
- **Docker** and **Docker Compose** for running dependencies
- **Node.js 22+**

### Installation & Running

All commands should be executed from the **root directory** of the project.

**1. Clone the Repository**

```bash
git clone https://github.com/guilherhenri/psyscreen.git
cd psyscreen/services/psych-analysis
```

**2. Set Up Environment Variables**

Copy the example file or create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Or create manually with the following variables:

```env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_USER=psych_analysis
DATABASE_PASSWORD=psychanalysis123
DATABASE_NAME=psych_analysis
DATABASE_PORT=5454
KAFKAJS_NO_PARTITIONER_WARNING=1
KAFKA_BROKER=localhost:9092
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.4
GEMINI_MAX_OUTPUT_TOKENS=1024
```

**3. Start Dependencies (PostgreSQL + Kafka)**

```bash
docker compose up -d
```

**4. Install Dependencies & Run Migrations**

```bash
pnpm install
pnpm migration:run:dev
```

**5. Start the Microservice**

```bash
pnpm start:dev
```

🎉 **All done!** The microservice is now listening to Kafka topics and ready to process candidate profiles.

---

## Kafka Topics

The service listens to the following Kafka topics:

| Topic                              | Handler                                   | Description                       |
| ---------------------------------- | ----------------------------------------- | --------------------------------- |
| `candidates.event.profile_created` | `candidate-profile-created-event.handler` | Candidate profile created payload |

The service will publish:

| Topic                            | Description                      |
| -------------------------------- | -------------------------------- |
| `psych-analysis.event.completed` | Psych analysis completed payload |

**Consumer Group:** `psych-analysis-consumer`

---

## Tests

There are two types of tests:

- **Unit tests** → Domain logic and use cases
- **Integration tests** → Kafka handlers with real database

### Available test scripts

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run integration tests
pnpm test:integration

# Generate coverage report
pnpm test:cov
```

---

## Technical Decisions

### Architecture

**Clean Architecture + DDD**  
The project follows Clean Architecture principles with Domain-Driven Design patterns:

- **Domain Layer**: Entities (business logic)
- **Application Layer**: Use cases and repository interfaces
- **Infrastructure Layer**: Framework-specific implementations (NestJS, TypeORM, Kafka)

This separation ensures:

- Business logic is framework-agnostic
- Easy testing with in-memory repositories
- Flexibility to swap implementations

**Event-Driven with Kafka**  
Chose Kafka over HTTP REST for decoupled communication between microservices. This provides:

- Asynchronous processing
- Scalability and fault tolerance
- Event sourcing capabilities for audit logs

### Database

**TypeORM + PostgreSQL**  
TypeORM provides:

- Type-safe database operations
- Automatic migrations
- Repository pattern implementation

**Migration Strategy**  
All schema changes are versioned and tracked via TypeORM migrations, ensuring consistent deployments across environments.

---

## Project Structure

```
src/
├── core/              # Shared kernel (entities, Either monad)
├── domain/
│   ├── application/   # Use cases and interfaces
│   └── enterprise/    # Domain entities
└── infra/             # Framework implementations
    ├── database/      # TypeORM entities and repositories
    ├── handlers/      # Kafka message handlers
    └── services/      # Kafka client
```

---

## Environment Variables

| Variable                         | Required | Default                 | Description               |
| -------------------------------- | -------- | ----------------------- | ------------------------- |
| `NODE_ENV`                       | Yes      | -                       | Application environment   |
| `DATABASE_HOST`                  | Yes      | -                       | PostgreSQL host           |
| `DATABASE_USER`                  | Yes      | -                       | Database user             |
| `DATABASE_PASSWORD`              | Yes      | -                       | Database password         |
| `DATABASE_NAME`                  | Yes      | -                       | Database name             |
| `DATABASE_PORT`                  | Yes      | -                       | Database port             |
| `DATABASE_SCHEMA`                | No       | public                  | PostgreSQL schema         |
| `KAFKA_BROKER`                   | No       | localhost:9092          | Kafka broker address      |
| `KAFKA_CLIENT_ID`                | No       | psych-analysis          | Kafka client id           |
| `KAFKA_CONSUMER_GROUP`           | No       | psych-analysis-consumer | Kafka consumer group      |
| `KAFKA_RETRY_COUNT`              | No       | 8                       | Kafka retry count         |
| `KAFKAJS_NO_PARTITIONER_WARNING` | No       | 1                       | Suppress KafkaJS warnings |
| `GEMINI_API_KEY`                 | Yes      | -                       | Gemini API key            |
| `GEMINI_MODEL`                   | No       | gemini-2.5-flash        | Gemini model name         |
| `GEMINI_TEMPERATURE`             | No       | 0.4                     | Gemini temperature        |
| `GEMINI_MAX_OUTPUT_TOKENS`       | No       | 1024                    | Max output tokens         |

---

## License

This project is licensed under the ISC License - see the `LICENSE` file for details.
