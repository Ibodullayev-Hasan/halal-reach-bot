import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRoleToUser1766596930972 implements MigrationInterface {
    name = 'AddUserRoleToUser1766596930972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "userRole" SET DEFAULT 'client'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "userRole" SET DEFAULT 'superAdmin'`);
    }

}
