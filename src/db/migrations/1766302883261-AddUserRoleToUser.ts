import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRoleToUser1766302883261 implements MigrationInterface {
    name = 'AddUserRoleToUser1766302883261'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "temporaryRoleReversal" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "temporaryRoleReversal"`);
    }

}
