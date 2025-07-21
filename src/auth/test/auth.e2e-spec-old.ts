import { Test, TestingModule } from "@nestjs/testing";
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { DataSource } from "typeorm";
import request from "supertest";
import { AuthModule } from "../auth.module";
import { PostgreSQLDatabaseModule } from "../../database/postgresql.module";
import { ConfigService } from "@nestjs/config";
import { mockConfigService, mockMailerService } from "../../../test/mocks";
import { CreateUserDto } from "../dto/create-user.dto";
import { Reflector } from "@nestjs/core";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, PostgreSQLDatabaseModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(MailerService)
      .useValue(mockMailerService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.init();

    dataSource = app.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name); // Get repository
      // await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`); // Truncate the table and restart identity
      await repository.clear();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/signup", () => {
    const badInput: Partial<CreateUserDto>[] = [
      { lastName: "last name", email: "test@mail.com", password: "Password@123" }, // no firstName
      { firstName: "firstname", email: "test@mail.com", password: "Password@123" }, // no lastName
      { firstName: "firstname", lastName: "last name", password: "Password@123" }, // no email
      { firstName: "firstname", lastName: "last name", email: "test@mail.com" }, // no password
      { firstName: "firstname", lastName: "last name", email: "test@mail", password: "Password@123" }, // bad email
      { firstName: "firstname", lastName: "last name", email: "test@mail.com", password: "1243" }, // bad password
      { firstName: "firstname", lastName: "last name", email: "test@mail.com", password: "password" }, // bad password
      { firstName: "first-name", lastName: "last name", email: "test@mail.com", password: "Password@123" }, // first name is not a-zA-Z
      { firstName: "admin", lastName: "last name", email: "test@mail.com", password: "Password@123" }, // first name is admin
    ];

    const successInput: CreateUserDto = {
      firstName: "firstname",
      lastName: "last name",
      email: "test@mail.com",
      password: "Password@123",
    };

    it("[404 Not Found] check -- signup route exists", async () => {
      const res = await request(global.app.getHttpServer()).post("/auth/signup").send({});

      expect(res.status).not.toBe(404);
    });

    it("[400 Bad Request] check -- signup doesn't occur for bad input data", async () => {
      for (let i = 0; i < badInput.length; i++) {
        // console.log(badInput[i]);

        const res = await request(global.app.getHttpServer()).post("/auth/signup").send(badInput[i]);
        // console.log(res.body);
        // console.log(res.error);

        expect(res.status).toBe(400);
      }
    });

    it("[201 Created] check -- signup occurs for good input data", async () => {
      const res = await request(global.app.getHttpServer()).post("/auth/signup").send(successInput);

      // console.log(res.body);

      expect(res.status).toBe(201);
    });

    it("[409 Conflict] check -- signup doesn't occur for duplicate email", async () => {
      await request(global.app.getHttpServer()).post("/auth/signup").send(successInput).expect(201);
      const res = await request(global.app.getHttpServer()).post("/auth/signup").send(successInput);

      // console.log(res.status);
      // console.log(res.body);

      expect(res.status).toBe(409);
    });
  });
});
