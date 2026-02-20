const User = require("../models/user");

// for signup user
module.exports.renderSignupForm = (req, res) => {
     res.render("users/signup.ejs")
};

// profile page
module.exports.renderProfile = async (req, res) => {
     const user = await User.findById(req.user._id).populate("favorites");
     res.render("users/profile.ejs", { user });
};

module.exports.signup = async (req, res, next) => {
     try {
          let { username, email, password } = req.body
          const newUser = new User({ email, username })
          const registeredUser = await User.register(newUser, password)
          console.log(registeredUser)
          req.login(registeredUser, (err) => {
               if (err) {
                    next(err);
               }
               req.flash("success", "welcome to Wanderlust!")
               res.redirect("/listings")
          });
     } catch (e) {
          req.flash("error", e.message)
          res.redirect("/signup")
     }
};

// for login user
module.exports.renderLoginForm = (req, res) => {
     res.render("users/login.ejs")
};

module.exports.login = async (req, res) => {
     req.flash("success", "Welcome back to Wanderlust!;");
     let redirectUrl = res.locals.redirectUrl || "/listings";
     res.redirect(redirectUrl);
};

// for logout user
module.exports.logout = (req, res, next) => {
     req.logout((err) => {
          if (err) {
               return next(err);
          }
          req.flash("success", "you are logged out!");
          res.redirect("/listings");
     });
};
