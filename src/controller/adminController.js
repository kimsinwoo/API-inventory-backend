import service from '../services/adminService'

async function getUserList(req, res) {
    try {
        const userList = service.getUserList()
        return userList
    } catch (err) {
        console.log(err)
    }
  }
  
  async function addUserRole(req, res) {
    try {
        const { authority, id } = req.body()
        
        service.addUserRole({authority, id})
    } catch (err) {
        console.log(err)
    }
  }
  
  module.exports = {
    getUserList,
    addUserRole,
  };
  