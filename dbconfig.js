const mysql = require('mysql2')

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Midorima240",
    database: "order"
})

db.connect(function(err){
    if (err) {
        console.log(err)
    } else {
        console.log("connected to database")
    }
})

module.exports = db