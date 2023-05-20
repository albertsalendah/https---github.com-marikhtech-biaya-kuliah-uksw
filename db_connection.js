const mysql = require('mysql')

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"db_biaya_kuliah",
    charset : 'utf8mb4'
})

module.exports = {
    db
}