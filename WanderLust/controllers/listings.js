const Listing = require("../models/listing");
const User = require("../models/user");

// Geocode using OpenStreetMap Nominatim (no token required)
async function geocodeLocation(query) {
     if (!query) return null;

     try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
          const res = await fetch(url, { headers: { 'User-Agent': 'WanderLust/1.0 (local)' } });
          if (!res.ok) {
               console.warn('Nominatim responded with status', res.status);
               return null;
          }
          const body = await res.json();
          if (body && body.length > 0) {
               const lat = parseFloat(body[0].lat);
               const lon = parseFloat(body[0].lon);
               return { type: 'Point', coordinates: [lon, lat] };
          }
     } catch (err) {
          console.warn('Nominatim geocoding failed:', err && err.message ? err.message : err);
     }
     return null;
}

//for index routes function
// controllers/listings.js
module.exports.index = async (req, res) => {
     const categories = Listing.schema.path("category").enumValues;

     const requestedCategory = req.query.category;
     const isValidCategory = requestedCategory && categories.includes(requestedCategory);

     const search = (req.query.q || "").trim();
     const sort = req.query.sort || "";
     let minPrice = req.query.minPrice !== undefined && req.query.minPrice !== "" ? Number(req.query.minPrice) : null;
     let maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== "" ? Number(req.query.maxPrice) : null;
     if (Number.isNaN(minPrice)) minPrice = null;
     if (Number.isNaN(maxPrice)) maxPrice = null;

     const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
     const limit = 9;

     const query = {};
     if (isValidCategory) query.category = requestedCategory;
     if (search) {
          const regex = new RegExp(search, "i");
          query.$or = [{ location: regex }, { country: regex }, { title: regex }];
     }
     if (minPrice !== null || maxPrice !== null) {
          query.price = {};
          if (!Number.isNaN(minPrice) && minPrice !== null) query.price.$gte = minPrice;
          if (!Number.isNaN(maxPrice) && maxPrice !== null) query.price.$lte = maxPrice;
     }

     const sortMap = {
          price_asc: { price: 1 },
          price_desc: { price: -1 },
          newest: { _id: -1 },
     };
     const sortOption = sortMap[sort] || {};

     const totalCount = await Listing.countDocuments(query);
     const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
     const safePage = Math.min(page, totalPages);

     const allListings = await Listing.find(query)
          .sort(sortOption)
          .skip((safePage - 1) * limit)
          .limit(limit);

     const favoriteIds = req.user && req.user.favorites
          ? req.user.favorites.map((id) => id.toString())
          : [];

     res.render("./listings/index.ejs", {
          allListings,
          categories,
          activeCategory: isValidCategory ? requestedCategory : null,
          search,
          sort,
          minPrice: minPrice ?? "",
          maxPrice: maxPrice ?? "",
          page: safePage,
          totalPages,
          totalCount,
          limit,
          favoriteIds,
     });
};

// favorites list page
module.exports.favoritesIndex = async (req, res) => {
     const user = await User.findById(req.user._id).populate("favorites");
     const favorites = user && user.favorites ? user.favorites : [];
     res.render("./listings/favorites.ejs", { favorites });
};

//for new routes function
module.exports.renderNewForm = (req, res) => {
     const categories = Listing.schema.path('category').enumValues;
     res.render("./listings/new.ejs", { categories });
};


//for show routes function
module.exports.showListing = async (req, res) => {
     let { id } = req.params;
     const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" }, }).populate("owner");
     if (!listing) {
          req.flash("error", " Listing you requested does not exist!");
          return res.redirect("/listings");
     }
     if (!listing.geometry || !listing.geometry.coordinates || listing.geometry.coordinates.length !== 2) {
          const query = [listing.location, listing.country].filter(Boolean).join(", ");
          if (query) {
               const geometry = await geocodeLocation(query);
               if (geometry) {
                    listing.geometry = geometry;
                    try {
                         await listing.save();
                    } catch (err) {
                         console.warn('Failed to save geometry:', err && err.message ? err.message : err);
                    }
               }
          }
     }
     console.log(listing);
     res.render("./listings/show.ejs", { listing });
};


// for create routes function
module.exports.createListing = async (req, res, next) => {
     try {
          if (!req.file) {
               req.flash("error", "Please upload a listing image.");
               return res.redirect("/listings/new");
          }
          // Geocode using OpenStreetMap (Nominatim)
          let geometry = null;
          try {
               geometry = await geocodeLocation(req.body.listing.location);
          } catch (err) {
               console.warn('Geocoding unexpectedly failed:', err && err.message ? err.message : err);
          }

          const url =
               (req.file && (req.file.path || req.file.secure_url || req.file.url)) || null;
          const filename =
               (req.file && (req.file.filename || req.file.public_id)) || null;
          const newListing = new Listing(req.body.listing);
          newListing.owner = req.user._id;
          if (url && filename) newListing.image = { url, filename };

          if (geometry) newListing.geometry = geometry;

          let saveListing = await newListing.save();
          console.log(saveListing);
          req.flash("success", "New Listing created!");
          res.redirect("/listings");
     } catch (err) {
          next(err);
     }
};


// for edit route function
module.exports.renderEditForm = async (req, res) => {
     let { id } = req.params;
     const listing = await Listing.findById(id);
     if (!listing) {
          req.flash("error", " Listing you requested does not exist!");
          return res.redirect("/listings");
     }
     let originalImageUrl = listing.image && listing.image.url ? listing.image.url : "/images/placeholder.svg";
     if (listing.image && listing.image.url) {
          originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
     }
     const categories = Listing.schema.path('category').enumValues;
     res.render("./listings/edit.ejs", { listing, originalImageUrl, categories });
};


// for Update routes function
module.exports.updateListing = async (req, res) => {
     let { id } = req.params;
     let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
     if (typeof req.file !== "undefined") {
          const url = req.file.path || req.file.secure_url || req.file.url;
          const filename = req.file.filename || req.file.public_id;
          listing.image = { url, filename };
          await listing.save();
     }

     req.flash("success", " Listing Updated!");
     res.redirect(`/listings/${id}`);
};


// for delete routes function
module.exports.destroyListing = async (req, res) => {
     let { id } = req.params;
     let deletedListing = await Listing.findByIdAndDelete(id);
     console.log(deletedListing);
     req.flash("success", " Listing deleted!");
     res.redirect("/listings");
};

// for favorite toggle
module.exports.toggleFavorite = async (req, res) => {
     const { id } = req.params;
     const user = await User.findById(req.user._id);
     const index = user.favorites.findIndex((favId) => favId.toString() === id);
     if (index === -1) {
          user.favorites.push(id);
          req.flash("success", "Added to favorites");
     } else {
          user.favorites.splice(index, 1);
          req.flash("success", "Removed from favorites");
     }
     await user.save();
     res.redirect(req.get("referer") || "/listings");
};
