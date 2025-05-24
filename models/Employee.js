// models/Employee.js - Fixed BigInt issue
class EmployeeModel {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    // Insert the data first
    const result = await this.db
      .insertInto('employees')
      .values(data)
      .execute();

    // Convert BigInt to regular number
    const insertId = Number(result[0].insertId);

    // Return the ID in the expected format
    return { id: insertId };
  }

  async findById(id) {
    return await this.db
      .selectFrom('employees')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByEmail(email) {
    return await this.db
      .selectFrom('employees')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }

  async findAll() {
    return await this.db
      .selectFrom('employees')
      .selectAll()
      .execute();
  }

  async update(id, data) {
    return await this.db
      .updateTable('employees')
      .set(data)
      .where('id', '=', id)
      .execute();
  }

  async delete(id) {
    return await this.db
      .deleteFrom('employees')
      .where('id', '=', id)
      .execute();
  }
}

module.exports = EmployeeModel;