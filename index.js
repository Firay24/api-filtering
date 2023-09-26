const express = require('express')
const app = express()
const port = 5000
const apiroutes = require('./apiRoutes')
const cors = require('cors')

app.use(express.json())

const allowedOrigins = [
    "http://localhost:3000"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}))

app.use('/', apiroutes)

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})