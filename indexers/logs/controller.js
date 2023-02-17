class Controller {
  constructor(model, logs) {
    this.model = model;
    this.logs = logs;
  }

  create(data) {
    if (data == null) {
      throw new ValidationError('Invalid request object');
    }

    return this.model.create(data, { transaction: this.logs.currentTransaction });
  }

  bulkCreate(arr) {
    return this.model.bulkCreate(arr, { transaction: this.logs.currentTransaction, ignoreDuplicates: true });
  }

  findAll(query, options) {
    return this.model.findAll({ where: query }, options);
  }

  findOne(query) {
    return this.model.findOne({ where: query });
  }

  static update(instance, update) {
    Object.assign(instance, update);
    return instance.save();
  }

  findAndUpdate(query, update) {

    return this.model.update(
      update,
      {
        where: query,
      },
      { transaction: this.logs.currentTransaction }
    );
  }

  static delete(instance) {
    instance.destroy();
  }

  findAndDelete(query) {
    return this.model.destroy({
      where: query,
    },
    { transaction: this.logs.currentTransaction });
  }
}

module.exports = Controller;
