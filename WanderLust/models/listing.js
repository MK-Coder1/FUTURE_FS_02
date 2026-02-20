const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");
const { string } = require("joi");

const listingSchema = new Schema({
     title: {
          type: String,
          required: true,
     },
     description: String,
     image: {
          url: String,
          filename: String,
     },
     price: Number,
     location: String,
     country: String,
     reviews: [
          {
               type: Schema.Types.ObjectId,
               ref: "Review",
          }
     ],
     owner: {
          type: Schema.Types.ObjectId,
          ref: "User",
     },
     geometry: {
          type: {
               type: String, // Don't do `{ location: { type: String } }`
               enum: ['Point'], // 'location.type' must be 'Point'
               required: true
          },
          coordinates: {
               type: [Number],
               required: true
          },
     },
     category: {
          type: String,
          enum: ['Trending', 'Rooms', 'Iconic Cities', 'Mountains', 'Castles', 'Amazing Pool', 'Camping', 'Farms', 'Arctic', 'Beach', 'Domes', 'HouseBoat', 'A-frames', 'Amazing views', 'Barns', 'Beachfront', 'Bed & breakfasts', 'Boats', 'Cabins', 'Campers', 'Casas particulers', 'Caves', "Chief's kitchen", 'Containers', 'Countryside', 'Cretive spaces', 'Cycladic home', 'Dammusos', 'Desert', 'Design', 'Earth homes', 'Golfing', 'Grand pianos', 'Historicals homes', 'HouseBoats', 'islands', 'Kezhans', 'Lake', 'Lakefront', 'Luxe', 'Mansions', 'Minsus', 'National Parks', 'Off-the-grid', 'OMG!', 'Riads', 'Ryokans', 'Shared homes', "shepherd's huts", 'Sky-in/out', 'Skiing', 'Surfing', 'Tiny homes', 'Towers', 'Treehouses', 'Tropical', 'Trulli', 'Vineyards', 'Windmills', 'Yurts'],
          required: true
     }

});

listingSchema.post("findOneAndDelete", async (listing) => {
     if (listing) {
          await Review.deleteMany({ _id: { $in: listing.reviews } })
     }
})

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;