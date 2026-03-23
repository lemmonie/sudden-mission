const express = require('express')
const router  = express.Router()

const {
  sendMission,
  getMissions,
  acceptMission,
  completeMission,
} = require('../controllers/missionController')
const { protect } = require('../middleware/auth')

router.post('/',               protect, sendMission)
router.get('/',                protect, getMissions)
router.patch('/:id/accept',    protect, acceptMission)
router.patch('/:id/complete',  protect, completeMission)

module.exports = router