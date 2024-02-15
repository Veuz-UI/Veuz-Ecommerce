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
                            <a href="#">Cart</a>
                           
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
                                <h3>Shopping Cart</h3>
                                <hr>
                            </div>
                        </div>
                        <div class="col-xl-8 col-lg-7">
                            <div class="cart-list">
                                <div class="single-cart">
                                    <div class="cart-img">
                                       <a href="product-details.php"><img src="assets/imgs/shop/pr1.jpg" alt=""></a> 
                                    </div>
                                    <div class="cart-content">
                                        <div class="cart-details">
                                            <h5>New  Trending T-shirt Limited Model</h5>
                                            <h4>SAR 250<span>(50%OFF)</span></h4>
                                            <div class="save-sar">Save <span class="dis-price">SAR 250</span><span class="old-price">SAR
                                                500</span>(Inc of all taxes)</div>
                                                <div class="prdct-feature">Color : <span>Black</span></div>
                                                <div class="qty-container">
                                                    <button class="qty-btn-minus btn-light" type="button"><i
                                                            class="fa fa-minus"></i></button>
                                                    <input type="text" name="qty" value="0" class="input-qty" />
                                                    <button class="qty-btn-plus btn-light" type="button"><i
                                                            class="fa fa-plus"></i></button>
                                                </div>
                                            
                                        </div>
                                        <div class="cart-btns">
                                            <button class="fav-btn">
                                                <i class="fi-rs-heart toggle-heart"></i>
                                            </button>
                                            <button class="dlt-btn">
                                                <i class="fi-rs-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="single-cart">
                                    <div class="cart-img">
                                        <a href="product-details.php"><img src="assets/imgs/shop/prdct4.jpg" alt=""></a>
                                    </div>
                                    <div class="cart-content">
                                        <div class="cart-details">
                                            <h5>New  Trending T-shirt Limited Model</h5>
                                            <h4>SAR 250<span>(50%OFF)</span></h4>
                                            <div class="save-sar">Save <span class="dis-price">SAR 250</span><span class="old-price">SAR
                                                500</span>(Inc of all taxes)</div>
                                               <div class="prdct-feature">Color : <span>Black</span></div>
                                                <div class="qty-container">
                                                    <button class="qty-btn-minus btn-light" type="button"><i
                                                            class="fa fa-minus"></i></button>
                                                    <input type="text" name="qty" value="0" class="input-qty" />
                                                    <button class="qty-btn-plus btn-light" type="button"><i
                                                            class="fa fa-plus"></i></button>
                                                </div>
                                            
                                        </div>
                                        <div class="cart-btns">
                                            <button class="fav-btn">
                                                <i class="fi-rs-heart toggle-heart"></i>
                                            </button>
                                            <button class="dlt-btn">
                                                <i class="fi-rs-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-4 col-lg-5">
                            <div class="cart-rightside">
                                <div class="cart-price-div">
                                    <h5>Order Summary</h5>
                                    <div class="billing-sum">
                                        <div class="form-group">
                                            <label>Promo Code</label>
                                            <div class="promo-coupn">
                                                <input type="text" class="form-control" placeholder="Enter Promo Code">
                                                <button class="check-btn">Apply</button>
                                            </div>
                                        </div>
                                        <hr>
                                        <div class="bill-sums">
                                            <div class="single-bill">Total MRP <span class="total-sub">827 SAR</span></div>
                                            <div class="single-bill">Offer Discount <span class="green-price">- 210 SAR</span></div>
                                            <div class="single-bill">Shipping & Convenience Fee <span class="green-price">Free</span></div>
                                            <div class="single-bill">Coupon Applied <span>0 SAR</span></div>
                                            <hr>
                                            <div class="total-price">Total <span>617 SAR</span></div>
                                            <div class="single-bill estimated-delivery">Estimated Delivery By <span>01 Feb, 2023</span></div>
                                        </div>
                                        <button class="proceed-btn" data-bs-toggle="modal" data-bs-target="#modal-signup">Proceed to Checkout</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    
    
                    </div>
                </div>
                
            </section>

    
    </main>

<div class="modal fade signup-modal" id="modal-signup" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-md">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="signup-modaldiv">
            <h3>Sign up or Sign in</h3>

            <div class="form-group">
                <label for="">Mobile Number</label>
                <input type="text" class="form-control" placeholder="Enter Your Mobile Number">
            </div>
            <button type="button" class="btn-modal show-otp">Continue</button>
        </div>
        <div class="otp-modaldiv" style="display: none;">
            <h3>Verify with OTP</h3>

            <div class="form-group">
                <label for="">Sent to +918782334422 <a href="javascript: void(0);" class="change-phone">Change ?</a></label>
                <div class="otp-input">
                    <input id="otp-first" class="form-control input-otp" type="number" min="0" max="9" step="1" aria-label="first digit" />
                    <input id="otp-second" class="form-control input-otp" type="number" min="0" max="9" step="1" aria-label="second digit" />
                    <input id="otp-third" class="form-control input-otp" type="number" min="0" max="9" step="1" aria-label="third digit" />
                    <input id="otp-fourth" class="form-control input-otp" type="number" min="0" max="9" step="1" aria-label="fourth digit" />
                </div>
            </div>
            <a href="checkout.php"><button type="button" class="btn-modal">Submit</button></a>
        </div>
      </div>
 
    </div>
  </div>
</div>

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
    <!-- otp script -->
    <script>
        console.clear();
        let inputs = document.querySelectorAll(".input-otp");
        let values = Array(4);
        let clipData;
        inputs[0].focus();

        inputs.forEach((tag, index) => {
            tag.addEventListener('keyup', (event) => {
                if (event.code === "Backspace" && hasNoValue(index)) {
                    if (index > 0) inputs[index - 1].focus();
                }

                //else if any input move focus to next or out
                else if (tag.value !== "") {
                    (index < inputs.length - 1) ? inputs[index + 1].focus(): tag.blur();
                }

                //add val to array to track prev vals
                values[index] = event.target.value;
            });

            tag.addEventListener('input', () => {
                //replace digit if already exists
                if (tag.value > 10) {
                    tag.value = tag.value % 10;
                }
            });

            tag.addEventListener('paste', (event) => {
                event.preventDefault();
                clipData = event.clipboardData.getData("text/plain").split('');
                filldata(index);
            })
        })

        function filldata(index) {
            for (let i = index; i < inputs.length; i++) {
                inputs[i].value = clipData.shift();
            }
        }

        function hasNoValue(index) {
            if (values[index] || values[index] === 0)
                return false;

            return true;
        }
    </script>
    <script>
        $(document).ready(function() {
            $('.show-otp').click(function() {
                $('.signup-modaldiv').hide();
                $('.otp-modaldiv').show();
            });
    
            $('.change-phone').click(function() {
                $('.otp-modaldiv').hide();
                $('.signup-modaldiv').show();
            });
        });
    </script>
</body>

</html>