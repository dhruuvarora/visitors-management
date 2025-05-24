// models/Visitor.js - Fixed BigInt issue
class VisitorModel {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    // Insert the data first
    const result = await this.db
      .insertInto('visitors')
      .values(data)
      .execute();

    // Convert BigInt to regular number
    const insertId = Number(result[0].insertId);

    // Return the ID in the expected format
    return { id: insertId };
  }

  async findById(id) {
    return await this.db
      .selectFrom('visitors')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findAll() {
    return await this.db
      .selectFrom('visitors')
      .selectAll()
      .execute();
  }

  async update(id, data) {
    return await this.db
      .updateTable('visitors')
      .set(data)
      .where('id', '=', id)
      .execute();
  }

  async delete(id) {
    return await this.db
      .deleteFrom('visitors')
      .where('id', '=', id)
      .execute();
  }

  async findByCondition(condition) {
    return await this.db
      .selectFrom('visitors')
      .selectAll()
      .where(condition.field, condition.operator, condition.value)
      .execute();
  }
}

module.exports = VisitorModel;