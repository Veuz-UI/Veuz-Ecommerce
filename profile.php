<!DOCTYPE html>
<html class="no-js" lang="en">

<head>
    <meta charset="utf-8" />
    <title>Veuz</title>
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="description" content="" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta property="og:title" content="" />
    <meta property="og:type" content="" />
    <meta property="og:url" content="" />
    <meta property="og:image" content="" />
    <!-- Favicon -->
    <link rel="shortcut icon" type="image/x-icon" href="assets/imgs/favicon.ico" />
    <!-- Template CSS -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="assets/css/vendors/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/plugins/animate.min.css" />
    <link rel="stylesheet" href="assets/css/style.css" />

</head>

<body>
    <?php include 'header.php';?>
    <main class="main">
   
            <!-- brudcrumbs -->
            <section class="breadcrumb-div">
                <div class="container">
                    <ul class="breadcrumb-list">
                        <li> <a href="index.php">Home</a>
                            <span class="separator" aria-hidden="true">&rsaquo;</span></li>
                        <li class="active-brudcrumb">
                            <a href="#">Profile</a>
                           
                        </li>

                    </ul>
                </div>
            </section>
            <section class="common-v-padding pt-0">
                <div class="container">   
                    <!-- product slider section -->
                    <div class="row">
                        <div class="col-md-12">
                            <div class="section-title1 wow animate__animated animate__fadeIn" data-wow-delay="0">
                                <h3>My Profile</h3>
                                <hr class="mb-0">
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-4">
                            <div class="profile-leftside">
                                <h3>Manage My Account</h3>
                                <ul class="nav flex-column" role="tablist">
                                    <li class="nav-item">
                                        <a class="nav-link active" id="profile-tab" data-bs-toggle="tab" href="#profile" role="tab" aria-controls="profile" aria-selected="true">
                                            <i class="fa-solid fa-user"></i> <span>My Profile</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" id="address-tab" data-bs-toggle="tab" href="#shipping-address" role="tab" aria-controls="address" aria-selected="false">
                                            <i class="fa-solid fa-truck-fast"></i>
                                                 <span>Shipping Address</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="col-lg-9 col-md-8">
                            <div class="profile-rightside">
                                <div class="tab-content">
                                    <div class="tab-pane fade active show" id="profile" role="tabpanel" aria-labelledby="profile">
                                        <div class="user-profile-div" id="user-profile-div">
                                            <div class="row">
                                                <div class="col-xl-3">
                                                    <div class="img-upload-form">
                                                        <img src="assets/imgs/users/avatar-2.jpg" id="upld-image1">
                                                        <!-- <i class="fi-rs-pencil edit-user-image" onclick="makeimg(1)" ;></i> -->
                                                        <input type="file" oninput="previewFile(1)" accept="image/*"
                                                            id="imgfile1" />
                                                            <!-- <i class="fi-rs-trash delete-user-image" onclick="deleteimg(1)" ;></i> -->
                                                    </div>
                                                    <div class="user-details">
                                                        <h3>Mad Jack</h3>
                                                        <ul>
                                                            <li><a href="#"><i class="fa-brands fa-facebook"></i></a></li>
                                                            <li><a href="#"><i class="fa-brands fa-x-twitter"></i></a></li>
                                                            <li><a href="#"><i class="fa-brands fa-instagram"></i></a></li>
                                                            <li><a href="#"><i class="fa-brands fa-linkedin-in"></i></a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div class="col-xl-9">
                                                    <div class="user-info">
                                                        <div class="user-head">
                                                            <h4>Account Details</h4>
                                                            <button class="edit-user-btn" id="edit-userinfo">Edit</button>
                                                        </div>
                                                        <div class="user-body">
                                                            <div class="row">
                                                                <div class="col-md-6">
                                                                    <h5><span>Name</span>Mad Jack</h5>
                                                                    <h5><span>Phone No</span>+96763266563</h5>
                                                                    <h5><span>Email ID</span>madjack@gmail.com</h5>
                                                                    <h5><span>Gender</span>Male</h5>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <h5><span>Location</span>Calicut, Cyberpark</h5>
                                                                    <h5><span>Alternate Mobile</span>+96763266563</h5>
                                                                    <h5><span>Hint Name</span>Mad</h5>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="profile-edit-div d-none" id="profile-edit-div">
                                            <div class="row">
                                                <div class="col-xl-3">
                                                    <div class="img-upload-form">
                                                        <img src="assets/imgs/users/avatar-2.jpg" id="upld-image2">
                                                        <i class="fi-rs-pencil edit-user-image" onclick="makeimg(2)" ;></i>
                                                        <input type="file" oninput="previewFile(2)" accept="image/*"
                                                            id="imgfile2" />
                                                            <!-- <i class="fi-rs-trash delete-user-image" onclick="deleteimg(1)" ;></i> -->
                                                    </div>
                                                    <div class="user-details">
                                                        <h3>Mad Jack</h3>
                                                        <ul>
                                                            <li><a href="#"><i class="fa-brands fa-facebook"></i></a></li>
                                                            <li><a href="#"><i class="fa-brands fa-x-twitter"></i></a></li>
                                                            <li><a href="#"><i class="fa-brands fa-instagram"></i></a></li>
                                                            <li><a href="#"><i class="fa-brands fa-linkedin-in"></i></a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div class="col-xl-9">
                                                    <div class="user-info">
                                                        <div class="user-head">
                                                            <h4>Account Details</h4>
                                                           
                                                        </div>
                                                        <div class="user-body">
                                                            <div class="row">
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label for="name">Name</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Full Name">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label for="email">E-Mail</label>
                                                                        <input type="email" class="form-control" placeholder="Enter Email Id">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label for="number">Mobile Number</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Mobile Number">
                                                                    </div>
                                                                </div>
                                                               
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label for="alt-number">Alternate Number</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Alternate Number">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label for="location">Location</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Your Street Details">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label for="landmark">Landmark <span>(Optional)</span></label>
                                                                        <input type="text" class="form-control" placeholder="Enter Landmark Details">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label for="name">Gender</label>
                                                                        <select class="form-select">
                                                                            <option value="" selected>Male</option>
                                                                            <option value="">Female</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label for="hintname">Hint Name</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Hint Name">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-12">
                                                                    <div class="form-group">
                                                                        <label for="socialmedia">Add Social media Links</label>
                                                                        <div class="input-group socialmedia-links">

                                                                            <div class="dropdown">
                                                                                <a class="socialmedia-icn dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                                    <i class="fa-brands fa-facebook"></i> Facebook
                                                                                </a>
                                                                              
                                                                                <ul class="dropdown-menu">
                                                                                  <li><a class="dropdown-item" href="#"><i class="fa-brands fa-facebook"></i>Facebook</a></li>
                                                                                  <li><a class="dropdown-item" href="#"><i class="fa-brands fa-x-twitter"></i>Instagram</a></li>
                                                                                  <li><a class="dropdown-item" href="#"><i class="fa-brands fa-instagram"></i>Facebook</a></li>
                                                                                  <li><a class="dropdown-item" href="#"><i class="fa-brands fa-linkedin-in"></i>Instagram</a></li>
                                                                                </ul>
                                                                              </div>
                                                                            <input type="text" class="form-control" placeholder="https://www.twitter.com/xyz">
                                                                            <div class="input-group-append">
                                                                                <button type="button" class="socialmedia-add-btn">Add <i class="fi-rs-plus"></i> </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="socialmedia-links-edit">
                                                                        <div class="row">
                                                                            <div class="col-md-6">
                                                                                <div class="input-group">
                                                                                    <i class="fa-brands fa-facebook link-icn"></i>
                                                                                    <input type="text" class="form-control" value="https://www.facebook.com/xyz">
                                                                                    <i class="fi-rs-trash dlt-link"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-md-6">
                                                                                <div class="input-group">
                                                                                    <i class="fa-brands fa-x-twitter link-icn"></i>
                                                                                    <input type="text" class="form-control" value="https://www.twitter.com/xyz">
                                                                                    <i class="fi-rs-trash dlt-link"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-md-6">
                                                                                <div class="input-group">
                                                                                    <i class="fa-brands fa-instagram link-icn"></i>
                                                                                    <input type="text" class="form-control" value="https://www.instagram.com/xyz">
                                                                                    <i class="fi-rs-trash dlt-link"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-md-6">
                                                                                <div class="input-group">
                                                                                    <i class="fa-brands fa-linkedin-in link-icn"></i>
                                                                                    <input type="text" class="form-control" value="https://www.linkedin.com/xyz">
                                                                                    <i class="fi-rs-trash dlt-link"></i>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-12 mt-md-3 mt-2 text-end">
                                                                    <button class="update-btn" id="update-userinfo">Update</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="tab-pane fade" id="shipping-address" role="tabpanel" aria-labelledby="address">
                                        <div class="user-address-div" id="user-address-div">
                                            <div class="row">
                                
                                                <div class="col-xl-12">
                                                    <div class="user-info">
                                                        <div class="user-head">
                                                            <h4>Shipping Address</h4>
                                                            <button class="edit-user-btn" id="edit-addressinfo">Add <i class="fa-solid fa-plus"></i></button>
                                                        </div>
                                                        <div class="user-body">
                                                            <div class="row">
                                                                <div class="col-md-6">
                                                                  <div class="address-box default-address">
                                                                    <div class="address-head">
                                                                        <h3>Home Address <span>(Default)</span></h3>
                                                                        <div class="address-icons">
                                                                          
                                                                            <i class="fa-regular fa-pen-to-square edit-addressinfo1"></i>
                                                                            <i class="fa-regular fa-trash-can"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="address-body">
                                                                        <h6><span>Full Name </span>: Mad Jack</h6>
                                                                        <h6><span>Address </span>: 4898 Joanne Lane Street</h6>
                                                                        <h6><span>City </span>: Boston</h6>
                                                                        <h6><span>State </span>: Massachusetts</h6>
                                                                        <h6><span>Country </span>: United States</h6>
                                                                        <h6><span>Zip Code </span>: 02110</h6>
                                                                        <h6><span>Phone </span>: +96763266563</h6>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="address-box">
                                                                        <div class="address-head">
                                                                            <h3>Office Address</h3>
                                                                            <div class="address-icons">
                                                                                <svg viewBox="0 0 15 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                    <path d="M7.75198 20.1709L8.75198 18.1709V15.1709H13.752C14.0172 15.1709 14.2716 15.0655 14.4591 14.878C14.6466 14.6905 14.752 14.4361 14.752 14.1709V12.5849C14.752 12.0589 14.538 11.5429 14.166 11.1709L12.752 9.7569V6.1709C13.0172 6.1709 13.2716 6.06554 13.4591 5.87801C13.6466 5.69047 13.752 5.43611 13.752 5.1709V2.1709C13.752 1.0679 12.855 0.170898 11.752 0.170898H3.75198C2.64898 0.170898 1.75198 1.0679 1.75198 2.1709V5.1709C1.75198 5.43611 1.85734 5.69047 2.04488 5.87801C2.23241 6.06554 2.48677 6.1709 2.75198 6.1709V9.7569L1.33798 11.1709C0.963811 11.5465 0.753189 12.0547 0.751984 12.5849V14.1709C0.751984 14.4361 0.857341 14.6905 1.04488 14.878C1.23241 15.0655 1.48677 15.1709 1.75198 15.1709H6.75198V18.1709L7.75198 20.1709ZM3.75198 2.1709H11.752V4.1709H3.75198V2.1709ZM2.75198 12.5849L4.45898 10.8779C4.55203 10.7852 4.62581 10.675 4.6761 10.5537C4.72638 10.4323 4.75217 10.3022 4.75198 10.1709V6.1709H10.752V10.1709C10.752 10.4369 10.857 10.6909 11.045 10.8779L12.752 12.5849V13.1709H2.75198V12.5849Z" fill="black"/>
                                                                                    </svg>
                                                                                    
                                                                                <i class="fa-regular fa-pen-to-square edit-addressinfo1"></i>
                                                                                <i class="fa-regular fa-trash-can"></i>
                                                                            </div>
                                                                        </div>
                                                                        <div class="address-body">
                                                                            <h6><span>Full Name </span>: Mad Jack</h6>
                                                                            <h6><span>Address </span>: 4898 Joanne Lane Street</h6>
                                                                            <h6><span>City </span>: Boston</h6>
                                                                            <h6><span>State </span>: Massachusetts</h6>
                                                                            <h6><span>Country </span>: United States</h6>
                                                                            <h6><span>Zip Code </span>: 02110</h6>
                                                                            <h6><span>Phone </span>: +96763266563</h6>
                                                                        </div>
                                                                      </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="address-edit-div d-none" id="address-edit-div">
                                            <div class="row">
                                            
                                                <div class="col-xl-12">
                                                    <div class="user-info">
                                                        <div class="user-head">
                                                            <h4>Add New Address</h4>
                                                           
                                                        </div>
                                                        <div class="user-body">
                                                            <div class="row">
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label>Full Name</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Your Name">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label>Mobile Number</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Mobile Number">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label>Pincode</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Your Pincode">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label>City</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Your City">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label>State</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Your State">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label>Building name or number</label>
                                                                        <input type="text" class="form-control" placeholder="Enter Building Details">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label>Street name or number</label>
                                                                        <input type="text" class="form-control" placeholder="Enter your street details">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label>Landmark <span>(Optional)</span></label>
                                                                        <input type="text" class="form-control" placeholder="Enter landmark details">
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-12">
                                                                    <div class="form-group">
                                                                        <label>Address Type <span>(Optional)</span></label>
                                                                        <div class="address-type">
                                                                            <div class="custome-radio">
                                                                                <input class="form-check-input" required="" type="radio" name="address-type" id="exampleRadios3" checked="">
                                                                                <label class="form-check-label" for="exampleRadios3">Home</label>
                                                                            </div>
                                                                            <div class="custome-radio">
                                                                                <input class="form-check-input" required="" type="radio" name="address-type" id="exampleRadios4">
                                                                                <label class="form-check-label" for="exampleRadios4">Office</label>
                                                                            </div>
                                                                          
                                                                        </div>
                                                                        <div class="default-shipping">
                                                                            <div class="custome-checkbox">
                                                                                <input class="form-check-input" type="checkbox" name="checkbox" id="exampleCheckbox11" value="">
                                                                                <label class="form-check-label" for="exampleCheckbox11"><span>Use this as my default shipping address.</span></label>
                                                                            </div>
                                                                          
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-12 mt-md-3">
                                                                    <button class="update-btn" id="update-addressinfo">Add Address</button>
                                                                </div>
                                                            </div>
                                                        
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    
    
                    </div>
                </div>
                
            </section>

    
    </main>

    <?php include 'footer.php';?>

    <!-- Vendor JS-->
    <script src="https://kit.fontawesome.com/16b0815225.js" crossorigin="anonymous"></script>
    <script src="assets/js/vendor/jquery-3.6.0.min.js"></script>
    <script src="assets/js/vendor/bootstrap.bundle.min.js"></script>
    <script src="assets/js/plugins/slick.js"></script>
    <script src="assets/js/plugins/wow.js"></script>
    <script src="assets/js/plugins/magnific-popup.js"></script>
    <script src="assets/js/script.js"></script>
    <script>
        $(document).ready(function () {
            $('.customer-logos').slick({
                slidesToShow: 8,
                slidesToScroll: 1,
                autoplay: true,
                autoplaySpeed: 1500,
                arrows: false,
                dots: false,
                pauseOnHover: false,
                responsive: [{
                    breakpoint: 1200,
                    settings: {
                        slidesToShow: 5
                    }
                },{
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 3
                    }
                },{
                    breakpoint: 520,
                    settings: {
                        slidesToShow: 2
                    }
                    
                }]
            });
        });
    </script>


    <script>
        var buttonPlus = $(".qty-btn-plus");
        var buttonMinus = $(".qty-btn-minus");

        var incrementPlus = buttonPlus.click(function () {
            var $n = $(this)
                .parent(".qty-container")
                .find(".input-qty");
            $n.val(Number($n.val()) + 1);
        });

        var incrementMinus = buttonMinus.click(function () {
            var $n = $(this)
                .parent(".qty-container")
                .find(".input-qty");
            var amount = Number($n.val());
            if (amount > 0) {
                $n.val(amount - 1);
            }
        });
    </script>

<script>
    $(document).ready(function() {
      $('.toggle-heart').on('click', function() {
        $(this).toggleClass('fi-rs-heart fi-ss-heart');
      });
    });
  </script>
  <script>
    $(document).ready(function () {
        $("body").prepend('<div class="body-overlay-1"></div>');

        $(".burger-icon").on("click", function (e) {
            
            e.preventDefault();
            $(".mobile-header-active").addClass("sidebar-visible");
            $("body").addClass("mobile-menu-active");
        });

        $(".mobile-menu-close").on("click", function () {
            $(".mobile-header-active").removeClass("sidebar-visible");
            $("body").removeClass("mobile-menu-active");
        });

        $(".body-overlay-1").on("click", function () {
            $(".mobile-header-active").removeClass("sidebar-visible");
            $("body").removeClass("mobile-menu-active");
        });
    });
</script>
<script>
        var $offCanvasNav = $(".mobile-menu"),
        $offCanvasNavSubMenu = $offCanvasNav.find(".dropdown");

    /*Add Toggle Button With Off Canvas Sub Menu*/
    $offCanvasNavSubMenu.parent().prepend('<span class="menu-expand"><i class="fi-rs-angle-small-down"></i></span>');

    /*Close Off Canvas Sub Menu*/
    $offCanvasNavSubMenu.slideUp();

    /*Category Sub Menu Toggle*/
    $offCanvasNav.on("click", "li a, li .menu-expand", function (e) {
        var $this = $(this);
        if (
            $this
                .parent()
                .attr("class")
                .match(/\b(menu-item-has-children|has-children|has-sub-menu)\b/) &&
            ($this.attr("href") === "#" || $this.hasClass("menu-expand"))
        ) {
            e.preventDefault();
            if ($this.siblings("ul:visible").length) {
                $this.parent("li").removeClass("active");
                $this.siblings("ul").slideUp();
            } else {
                $this.parent("li").addClass("active");
                $this.closest("li").siblings("li").removeClass("active").find("li").removeClass("active");
                $this.closest("li").siblings("li").find("ul:visible").slideUp();
                $this.siblings("ul").slideDown();
            }
        }
    });
</script>
<script>
    function makeimg(val1) {

        document.getElementById("imgfile" + val1).click();
    }

    function previewFile(value) {

        const preview = document.getElementById('upld-image1');
        const preview1 = document.getElementById('upld-image2');
        const file = document.getElementById("imgfile" + value).files[0];
        const reader = new FileReader();

        reader.addEventListener("load", function () {
            preview.src = reader.result;
            preview1.src = reader.result;
        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    }
    function deleteimg(value) {
        const preview = document.getElementById('upld-image' + value);
        preview.src = 'assets/imgs/users/default.png';

        const fileInput = document.getElementById("imgfile" + value);
        fileInput.value = null;
    }
</script>
<script>
    $(document).ready(function() {
      $('.socialmedia-links .dropdown-item').on('click', function(e) {
        e.preventDefault();
        var newIcon = $(this).find('i').clone();
        var newText = $(this).text();
        $('.socialmedia-icn').html('').append(newIcon).append(' ' + newText);
      });
    });
  </script>
  <script>
    $(document).ready(function() {
      $('#edit-userinfo').on('click', function() {
        $('#user-profile-div').addClass('d-none'); 
        $('#profile-edit-div').removeClass('d-none');
      });
      $('#update-userinfo').on('click', function() {
        $('#profile-edit-div').addClass('d-none'); 
        $('#user-profile-div').removeClass('d-none');
      });
    });
  </script>
    <script>
        $(document).ready(function() {
          $('#edit-addressinfo').on('click', function() {
            $('#user-address-div').addClass('d-none'); 
            $('#address-edit-div').removeClass('d-none');
          });
          $('#update-addressinfo').on('click', function() {
            $('#address-edit-div').addClass('d-none'); 
            $('#user-address-div').removeClass('d-none');
          });
          $('.edit-addressinfo1').on('click', function() {
            $('#user-address-div').addClass('d-none'); 
            $('#address-edit-div').removeClass('d-none');
          });
        });
      </script>
</body>

</html>