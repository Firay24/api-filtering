const mysql = require('mysql2')

const db = mysql.createConnection({
    host: "sql12.freesqldatabase.com",
    user: "sql12649938",
    password: "PlIT5EDfpQ",
    database: "sql12649938"
})

db.connect(function(err){
    if (err) {
        console.log(err)
    } else {
        console.log("connected to database")
    }
})

module.exports = db