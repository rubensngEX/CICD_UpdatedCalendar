const prisma = require('./prismaClient');

module.exports.getAllStatus = function getAllStatus() {
  return prisma.task.findMany({
    distinct:['status'],
    select:{
      status: true
    }
  }).then((statuses) => {
    return statuses;
  });
};
