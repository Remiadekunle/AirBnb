const express = require('express')
const { setTokenCookie, requireAuth, restoreUser, requireProperAuth } = require('../../utils/auth');
const { Spot, User, SpotImage, Review, ReviewImage, Booking, sequelize } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { response } = require('../../app');
const fetch = require("node-fetch");
// import fetch from "node-fetch";
const router = express.Router();
const { googleMapsAPIKey } = require('../../config');
const { Op } = require("sequelize");

router.get('/', async (req, res) => {
    let {page, size} = req.query;


    const spots = await Spot.findAll({
    });
    const Spots = []
    for (let i = 0; i < spots.length; i++){
        let spot = spots[i]
        spot = spot.toJSON();
        let image = await SpotImage.findOne({
            where: {
                spotId: spot.id,
                preview: true
            },
            attributes: {
                exclude: ['id', 'spotId', 'createdAt', 'updatedAt']
            },
        });
        if (image){
            const url = image.url
            spot.previewImage = url;

        }
        else{
            spot.previewImage = 'No preview image found'
        }

        let reviews = await Review.findAll({
            where: {
                spotId: spot.id
            },

        })

        let stars = 0;
        count = 0
        if (reviews.length > 0){
            reviews.forEach(review => {
                stars += review.stars
                count++
            })
            stars = stars/count

            spot.avgRating = stars
        } else{
            spot.avgRating = 'This restaurant has not been rated'
        }

        Spots.push(spot)
    }
    page = parseInt(page);
    size = parseInt(size);
    return res.json({
        Spots,
        page,
        size
    })
})

router.get('/current', restoreUser, async (req, res) => {
    const { user } = req;
    const where = {}
    if (user){
        where.ownerId = user.id
    }
    const spots = await Spot.findAll({
        where
    })

    const Spots = []
    for (let i = 0; i < spots.length; i++){
        let spot = spots[i]
        spot = spot.toJSON();
        let image = await SpotImage.findOne({
            where: {
                spotId: spot.id,
                preview: true
            },
            attributes: {
                exclude: ['id', 'spotId', 'createdAt', 'updatedAt']
            }
        });
        if (image){
            const url = image.url
            spot.previewImage = url;

        }
        else{
            spot.previewImage = 'No preview image found'
        }

        let reviews = await Review.findAll({
            where: {
                spotId: spot.id
            },

        })

        let stars = 0;
        count = 0
        if (reviews.length > 0){
            reviews.forEach(review => {
                stars += review.stars
                count++
            })
            stars = stars/count

            spot.avgRating = stars
        } else{
            spot.avgRating = 'This restaurant has not been rated'
        }

        Spots.push(spot)
    }

    return res.json({
        Spots
    })
})

router.get('/:spotId', async(req, res, next) => {
    const id = req.params.spotId
    const spot = await Spot.findOne({
        where: {
            id
        },
        include: [
            {
                model: Review,
            },
            {
                model: SpotImage,
                attributes: {
                    exclude: ['spotId', 'createdAt', 'updatedAt']
                }
            },
            {
                model: User,
                attributes: {
                    exclude: ['username', 'hashedPassword', 'createdAt', 'updatedAt', 'email']
                }
            }
        ]
    })

    if (!spot) {
        const err = new Error('Spot couldn\'t be found');
        err.status = 404;
        err.message = 'Spot couldn\'t be found';
        return next(err);
    }
    const newSpot = spot.toJSON();
    newSpot.numReviews = newSpot.Reviews.length
    let scores = 0
    newSpot.Reviews.forEach(review => {
        scores += review.stars
    })
    const stars = scores/spot.Reviews.length
    if (stars){
        newSpot.avgStarRating = stars
    } else{
        newSpot.avgStarRating = 'This spot has not been rated'
    }

    delete newSpot.Reviews
    newSpot.Owner = newSpot.User
    delete newSpot.User


    return res.json(newSpot)
})

const validateAddress = async (payload) => {
    const res = await fetch(`https://addressvalidation.googleapis.com/v1:validateAddress?key=${googleMapsAPIKey}`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(async (res) => {
        const data = await res.json();

        if (data && (data.errors || data.message || data.error)) {
          console.log('did we get here?')
          return next(data.errors);
        }
    });

    if (res.ok){
        const body = await res.json()
        // console.log('what is the body rn', body)
        // console.log('what is the data here',  body.result.geocode)
        let latitude = body.result.geocode.location.latitude? body.result.geocode.location.latitude : 0
        let formattedAddres = body.result.address.formattedAddress? body.result.address.formattedAddress : ''
        let longitude = body.result.geocode.location.longitude? body.result.geocode.location.longitude : 0
        let addressComplete = body.result?.verdict.addressComplete? body.result?.verdict.addressComplete : false
        let unconfirmedComponentTypes = body.result.address.unconfirmedComponentTypes?  body.result.address.unconfirmedComponentTypes : false
        // console.log('what ended uyp being the payload', {
        //     latitude,
        //     longitude,
        //     addressComplete,
        //     unconfirmedComponentTypes
        // } )
        return {
            latitude,
            longitude,
            addressComplete,
            unconfirmedComponentTypes,
            formattedAddres
        }
    }
}

router.post('/', requireAuth, async(req, res, next) => {
    const {address, city, state, country, lat, lng, name, description, price, beds, baths, guests} = req.body;

    const { user } = req;
    const id = user.id
    const errorMessages = {}
    if (!address){
        errorMessages.address = 'Street address is required';
    }
    if (!city){
        errorMessages.city = "City is required";
    }
    if (!state){
        errorMessages.state = "State is required";
    }
    if (!country){
        errorMessages.country = "Country is required";
    }
    if (!lat){
        errorMessages.lat = "Latitude is not valid";
    }
    if (!lng){
        errorMessages.lng = "Longitude is not valid";
    }
    if (!name){
        errorMessages.name = "Name must be less than 50 characters";
    }
    if (!description){
        errorMessages.description = "Description is required";
    }
    if (!price){
        errorMessages.price = "Price per day is required";
    }

    if (Object.values(errorMessages).length > 0){
        const err = new Error('Please enter all required information');
        err.status = 400;
        err.errors = errorMessages
        return next(err)
    }

    const payload = {
        address: {
            regionCode: country,
            locality: city,
            addressLines: [address]
        },
    }
    const validated = await validateAddress(payload).catch(async (res) => {
        const data = await res.json();
        console.log('ummmmm are u catching')
        console.log('ummmmmmmmm what is the data', data)
        if (data && (data.errors || data.message || data.error)) {
          console.log('did we get here?')
          return next(data.errors);
        }
    });
    console.log('what is the validation rn', validated)
    if (!validated?.addressComplete){
        console.log('what is the validation rn in the iff ', validated)
        const err = new Error('Please enter all required information');
        err.status = 400;
        const resp = {
            errors: `The address you provided is invalid: `,
            inputs: validated?.unconfirmedComponentTypes
        }
        err.errors = resp
        resp.status = 400;
        return next(err)
    }
    const { latitude, longitude, unconfirmedComponentTypes, formattedAddres } = validated
    console.log('what are the details here', latitude, longitude)
    const newSpot = await Spot.build({
        address,
        city,
        state,
        country,
        lat: latitude,
        lng: longitude,
        name,
        description,
        price,
        beds,
        baths,
        guests,
        ownerId: id,
        formattedAddres
    })

    await newSpot.save();

    const check = await Spot.findOne({
        where: {
            price
        }
    })



    res.json(newSpot)
})

router.post('/:spotId/images', async(req, res, next) => {
    const { user } = req;
    const id = parseInt(req.params.spotId)
    const { url, preview} = req.body;
    const spot = await Spot.findOne({
        where: {
            id
        },
        include: {
            model: User
        }
    })
    if (!spot){
        const err = new Error('Spot couldn\'t be found');
        err.status = 404;
        err.message = 'Spot couldn\'t be found';
        return next(err);
    }

    if (user.id !== spot.User.id){
        return requireProperAuth(req, res, next);
    }

    const newImage = await SpotImage.create({
        url,
        preview,
        spotId: id
    })
    const image = newImage.toJSON();
    delete image.updatedAt;
    delete image.createdAt;
    delete image.spotId;
    res.json(image);
});

router.put('/:spotId', async(req, res, next) => {
    const { user } = req;
    const id = parseInt(req.params.spotId)
    const {address, city, state, country, lat, lng, name, description, price} = req.body;

    let spot = await Spot.findOne({
        where: {
            id
        },
        include: {
            model: User
        }
    })
    if (!spot){
        const err = new Error('Spot couldn\'t be found');
        err.status = 404;
        err.message = 'Spot couldn\'t be found';
        return next(err);
    }
    const payload = {
        address: {
            regionCode: country,
            locality: city,
            addressLines: [address]
        },
    }

    if (user.id !== spot.User.id){
        return requireProperAuth(req, res, next);
    }

    const validated = await validateAddress(payload).catch(async (res) => {
        const data = await res.json();
        console.log('ummmmm are u catching')
        console.log('ummmmmmmmm what is the data', data)
        if (data && (data.errors || data.message || data.error)) {
          console.log('did we get here?')
          return next(data.errors);
        }
    });
    console.log('what is the validation rn', validated)
    if (!validated?.addressComplete){
        console.log('what is the validation rn in the iff ', validated)
        const err = new Error('Please enter all required information');
        err.status = 400;
        const resp = {
            errors: `The address you provided is invalid: `,
            inputs: validated?.unconfirmedComponentTypes
        }
        err.errors = resp
        resp.status = 400;
        return next(err)
    }
    const { latitude, longitude, unconfirmedComponentTypes, formattedAddres } = validated
    console.log('what are the details here', latitude, longitude)


    const errors = {}
    if (address) spot.address = address;
    else errors.address = "Street address is required";
    if (city) spot.city = city;
    else errors.city = "City is required";
    if (state) spot.state = state;
    else errors.state = "State is required"
    if (country) spot.country = country;
    else errors.country = "Country is required"
    if (latitude) spot.lat = latitude;
    else errors.lat = "Latitude is not valid";
    if (longitude) spot.lng = longitude;
    else errors.lng = "Longitude is not valid";
    if (name) spot.name = name;
    else errors.name = "Name must be less than 50 characters";
    if (description) spot.description = description;
    else errors.description = "Description is required";
    spot.formattedAddres = formattedAddres
    if (price) {
        spot.price = price;
    }
    else {
        errors.price = "Price per day is required";
    }

    if (Object.values(errors).length > 0){
        const err = new Error('Validation Error');
        err.status = 400;
        err.errors = errors
        return next(err)
    }

    spot.save();
    spot = spot.toJSON();
    delete spot.User;
    res.json(spot);
})

router.get('/:spotId/reviews', async (req, res, next) => {
    const id = req.params.spotId;
    const Reviews = await Review.findAll({
        where: {
            spotId: id,
        },
        include: [
            {
                model: User,
                attributes: {
                    exclude: ['spotId', 'createdAt', 'updatedAt', 'username', 'email', 'hashedPassword']
                }
            },
            {
                model: ReviewImage,
                attributes: {
                    exclude: ['reviewId', 'createdAt', 'updatedAt',]
                }
            }

        ]
    })

    if (!Reviews.length > 0){
        const err = new Error("Spot couldn\'t be found")
        err.status = 404;
        return next(err)
    }

    res.json({
        Reviews
    })
});

router.post('/:spotId/reviews', requireAuth, async (req, res, next) =>{
    const id = req.params.spotId;
    const {user} = req;

    const {review, stars} = req.body;
    const errors = {}

    const reviews = await Review.findAll({
        where: {
            userId: user.id
        }
    });


    reviews.forEach(review => {
        if (review.spotId === parseInt(id)){
            const err = new Error('User already has a review for this spot')
            err.status = 403;
            return next(err)
        }
    })

    if (!review){
        errors.review = "Review text is required"
    }
    if (parseInt(stars) < 0 || parseInt(stars) > 5 ){
        errors.stars = "Stars must be an integer from 1 to 5"
    }

    if (Object.values(errors).length > 0){
        const err = new Error('Please enter all required information');
        err.status = 400;
        err.errors = errors
        return next(err)
    }

    const where = {};

    let spot = await Spot.findOne({
        where: {
            id
        },
    })

    if (!spot){
        const err = new Error("Spot couldn\'t be found")
        err.status = 404;
        return next(err)
    }

    const newReview = await Review.build({
        review,
        stars,
        userId: user.id,
        spotId: spot.id
    })

    await newReview.save();


    res.json(newReview)
})

router.post('/:spotId/bookings', requireAuth, async (req, res, next) => {
    const {user} = req;

    const id = req.params.spotId;

    const {startDate, endDate} = req.body;

    const nextDate = new Date()

    const spot = await Spot.findOne({
        where: {
            id
        },
    })

    if (!spot){
        const err = new Error("Spot couldn\'t be found")
        err.errors = {"error": "Spot couldn\'t be found"}
        err.status = 404;
        return next(err)
    }
    if (spot.ownerId == user.id){
        const err = new Error("Owner cannot create a booking for this spot!!!")
        err.errors = {"error": "Owner cannot create a booking for this spot!!!"}
        err.status = 404;
        return next(err)
    }


    // if (endDate <= startDate){
    //     console.log('what is the startDate', startDate)
    //     console.log('what is the startDate', typeof startDate)
    //     console.log('what is the endDate', endDate)
    //     console.log('what is the endDate', typeof endDate)
    //     console.log('fuck bro huh', endDate <= startDate)
    //     const err = new Error("endDate cannot be on or before startDate")
    //     err.errors = {"error":"End Date cannot be on or before startDate"};
    //     err.status = 400;
    //     return next(err)
    // }


    const bookings = await Booking.findAll({
        where: {
            spotId: spot.id
        }
    })


    const booking = await Booking.build({
        startDate,
        endDate,
        spotId: spot.id,
        userId: user.id,
    })

    const errors = {};
    console.log(bookings)
    for (let i = 0; i < bookings.length; i++){
        let bookingA = bookings[i];
        let bStart = bookingA.startDate.getTime();
        let bEnd = bookingA.endDate.getTime();

        const start = booking.startDate.getTime();
        const end = booking.endDate.getTime();

        if ((start >= bStart) && (start <= bEnd)){
            errors.startDate = `Start date conflicts with an existing booking ${bookingA.startDate.toDateString()} - ${bookingA.endDate.toDateString()}`;
            break
        }
        if ((end >= bStart) && (end <= bEnd)){
            errors.endDate = `End date conflicts with an existing booking ${bookingA.startDate.toDateString()} - ${bookingA.endDate.toDateString()}`;
            break
        }
    }

    if (Object.values(errors).length > 0){
        const err = new Error("Sorry, this spot is already booked for the specified dates");
        err.status = 403;
        err.errors = errors
        return next(err)
    }

    await booking.save();


    res.json(booking)
})

router.get('/:spotId/bookings', requireAuth, async (req, res, next) => {
    const {user} = req;

    const id = req.params.spotId;

    const spot = await Spot.findOne({
        where: {
            id
        },
    })

    if (!spot){
        const err = new Error("Spot couldn\'t be found")
        err.status = 404;
        return next(err)
    }
    const bookings = await Booking.findAll({
        where: {
            spotId: spot.id
        },
        include: [
            {
                model: User,
                attributes: {
                    exclude: ['createdAt', 'updatedAt',  'username', 'email', 'hashedPassword']
                }
            },
        ],
        attributes: ['id', 'startDate', 'endDate', 'createdAt', 'updatedAt', 'spotId', 'userId'],
    })


    if (user.id === spot.ownerId){
        console.log(user.id);
        console.log(spot.ownerId)
        return res.json({
            bookings
        })
    } else{
        const Bookings = []
        for (let i = 0; i < bookings.length; i++){
            let booking = bookings[i]
            booking = booking.toJSON();

            delete booking.User;
            delete booking.userId;
            delete booking.createdAt;
            delete booking.updatedAt;
            console.log(booking)
            Bookings.push(booking)
        }


        return res.json({
            bookings: Bookings
        })
    }
})

router.delete('/:spotId', async(req, res, next) => {
    const { user } = req;
    const id = parseInt(req.params.spotId);

    let spot = await Spot.findOne({
        where: {
            id
        },
        include: {
            model: User
        }
    })

    if (!spot){
        const err = new Error('Spot couldn\'t be found');
        err.status = 404;
        err.message = 'Spot couldn\'t be found';
        return next(err);
    }

    if (user.id !== spot.User.id){
        return requireProperAuth(req, res, next);
    }

    await spot.destroy();
    res.status = 200;
    res.json({
        message: "Successfully deleted",
        statusCode: 200
    })

})

router.post('/search', async(req, res, next) => {
    const { user } = req;

    const {search} = req.body;
    const spots = await Spot.findAll({
        where: {
            [Op.or]: [
                {
                    name: {
                        [Op.like]: `%${search}%`
                    }
                },
                {
                    description: {
                        [Op.like]: `%${search}%`
                    }
                }
            ]
        },
    })

    const Spots = []
    for (let i = 0; i < spots.length; i++){
        let spot = spots[i]
        spot = spot.toJSON();
        let image = await SpotImage.findOne({
            where: {
                spotId: spot.id,
                preview: true
            },
            attributes: {
                exclude: ['id', 'spotId', 'createdAt', 'updatedAt']
            },
        });
        if (image){
            const url = image.url
            spot.previewImage = url;

        }
        else{
            spot.previewImage = 'No preview image found'
        }

        let reviews = await Review.findAll({
            where: {
                spotId: spot.id
            },

        })

        let stars = 0;
        count = 0
        if (reviews.length > 0){
            reviews.forEach(review => {
                stars += review.stars
                count++
            })
            stars = stars/count

            spot.avgRating = stars
        } else{
            spot.avgRating = 'This restaurant has not been rated'
        }

        Spots.push(spot)
    }

    res.status = 200;
    console.log('11111111111111111111111111111111111111111111111111', spots)
    res.json({
        search: Spots
    })
})

module.exports = router;
