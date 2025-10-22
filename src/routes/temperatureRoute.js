import Router from 'express'

const router = Router()

router.post('/', require('../controller/temperatureController').addTemperature)
router.get('/', require('../controller/temperatureController').getTemperatures)