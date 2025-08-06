import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorPatientAndAddProfiles1753290436979 implements MigrationInterface {
    name = 'RefactorPatientAndAddProfiles1753290436979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "patients" ("user_id" uuid NOT NULL, "weight" numeric(5,2), "height" numeric(5,2), "medical_history" text, CONSTRAINT "PK_7fe1518dc780fd777669b5cb7a0" PRIMARY KEY ("user_id")); COMMENT ON COLUMN "patients"."weight" IS 'Weight in kilograms'; COMMENT ON COLUMN "patients"."height" IS 'Height in meters'`);
        await queryRunner.query(`CREATE TABLE "slots" ("slot_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_user_id" uuid NOT NULL, "date" date NOT NULL, "session" character varying NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "max_tokens" integer NOT NULL, "tokens_issued" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7a16272977b74f83f126456cd82" PRIMARY KEY ("slot_id"))`);
        await queryRunner.query(`CREATE TABLE "chats" ("chat_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointment_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "message" text NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb573d310bde330521e7715db2a" PRIMARY KEY ("chat_id"))`);
        await queryRunner.query(`CREATE TABLE "reschedule_history" ("reschedule_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointment_id" uuid NOT NULL, "original_date" TIMESTAMP WITH TIME ZONE NOT NULL, "new_date" TIMESTAMP WITH TIME ZONE NOT NULL, "reason" text NOT NULL, "logged_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a6f5d8d3d6417e4a71ddabf7ad5" PRIMARY KEY ("reschedule_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELED', 'RESCHEDULED')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("appointment_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_user_id" uuid NOT NULL, "patient_user_id" uuid NOT NULL, "slot_id" uuid NOT NULL, "token_number" integer NOT NULL, "complaint" text NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'SCHEDULED', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dde485d1b7ca51845c075befb6b" PRIMARY KEY ("appointment_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_availabilities_weekday_enum" AS ENUM('0', '1', '2', '3', '4', '5', '6')`);
        await queryRunner.query(`CREATE TABLE "recurring_availabilities" ("recurring_availability_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_user_id" uuid NOT NULL, "weekday" "public"."recurring_availabilities_weekday_enum" NOT NULL, "session" character varying NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "max_tokens" integer NOT NULL, CONSTRAINT "PK_d2924db22e6892ab0a4bbd91def" PRIMARY KEY ("recurring_availability_id"))`);
        await queryRunner.query(`CREATE TABLE "doctors" ("user_id" uuid NOT NULL, "yeo" integer NOT NULL DEFAULT '0', "specialization" character varying NOT NULL, "availability_schedule" jsonb, "services" text array, CONSTRAINT "PK_653c27d1b10652eb0c7bbbc4427" PRIMARY KEY ("user_id")); COMMENT ON COLUMN "doctors"."availability_schedule" IS 'Stores doctor availability rules'`);
        await queryRunner.query(`CREATE TYPE "public"."users_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('DOCTOR', 'PATIENT', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("user_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "phone" character varying, "age" integer, "gender" "public"."users_gender_enum", "role" "public"."users_role_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`ALTER TABLE "patients" ADD CONSTRAINT "FK_7fe1518dc780fd777669b5cb7a0" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "slots" ADD CONSTRAINT "FK_1c7619ceadf4d734627e696e500" FOREIGN KEY ("doctor_user_id") REFERENCES "doctors"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_1e09e326485759a027f13a99298" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("appointment_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_ed49245ae87902459011243d69a" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reschedule_history" ADD CONSTRAINT "FK_88f4b0132f95158526c2d33073b" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("appointment_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_972630bc519b982d22d01819129" FOREIGN KEY ("doctor_user_id") REFERENCES "doctors"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_8cd86f8376020c81f7b3a65f48d" FOREIGN KEY ("patient_user_id") REFERENCES "patients"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_b1ccdd43ac8ccbb787c68a64a13" FOREIGN KEY ("slot_id") REFERENCES "slots"("slot_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_availabilities" ADD CONSTRAINT "FK_02599af1a0cb5cf45f075d7b58f" FOREIGN KEY ("doctor_user_id") REFERENCES "doctors"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctors" ADD CONSTRAINT "FK_653c27d1b10652eb0c7bbbc4427" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctors" DROP CONSTRAINT "FK_653c27d1b10652eb0c7bbbc4427"`);
        await queryRunner.query(`ALTER TABLE "recurring_availabilities" DROP CONSTRAINT "FK_02599af1a0cb5cf45f075d7b58f"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_b1ccdd43ac8ccbb787c68a64a13"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_8cd86f8376020c81f7b3a65f48d"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_972630bc519b982d22d01819129"`);
        await queryRunner.query(`ALTER TABLE "reschedule_history" DROP CONSTRAINT "FK_88f4b0132f95158526c2d33073b"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_ed49245ae87902459011243d69a"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_1e09e326485759a027f13a99298"`);
        await queryRunner.query(`ALTER TABLE "slots" DROP CONSTRAINT "FK_1c7619ceadf4d734627e696e500"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP CONSTRAINT "FK_7fe1518dc780fd777669b5cb7a0"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
        await queryRunner.query(`DROP TABLE "doctors"`);
        await queryRunner.query(`DROP TABLE "recurring_availabilities"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_availabilities_weekday_enum"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
        await queryRunner.query(`DROP TABLE "reschedule_history"`);
        await queryRunner.query(`DROP TABLE "chats"`);
        await queryRunner.query(`DROP TABLE "slots"`);
        await queryRunner.query(`DROP TABLE "patients"`);
    }

}
