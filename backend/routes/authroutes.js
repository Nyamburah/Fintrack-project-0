const express = require('express');
const router = express.Router()
const cors = require ('cors')
const {test, registerUser, loginUser } = require ('../controllers/authcontroller')

//middleware
router.use(
    cors({
        credentials:true,
        origin:'http://localhost:5173'
    })
)

router.get('/', test)
router.post('/register', registerUser)
router.post('/login', loginUser)

router.get('/', (req, res) => {
  res.send("Auth route working");
});


module.exports = router