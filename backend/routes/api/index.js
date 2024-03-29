const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const spotsRouter = require('./spots.js')
const reviewsRouter = require('./reviews.js');
const bookingsRouter = require('./bookings');
const reviewImagesRouter = require('./review-images');
const spotImagesRouter = require('./spot-images');
const mapsRouter = require('./maps');

const { restoreUser } = require("../../utils/auth.js");
// Connect restoreUser middleware to the API router
router.use(restoreUser);

router.use('/session', sessionRouter);

router.use('/users', usersRouter);

router.use('/spots', spotsRouter);

router.use('/reviews', reviewsRouter);
// router.use('/reviews', reviewsRouter);

router.use('/bookings', bookingsRouter);

router.use('/spot-images', spotImagesRouter);
router.use('/review-images', reviewImagesRouter)

router.use('/maps', mapsRouter);

router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

module.exports = router;
