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
                        <div class="col-md-8">
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
                        <div class="col-md-4">
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
                                         <a href="checkout.php"><button class="proceed-btn">Proceed to Checkout</button></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    
    
                    </div>
                </div>
                
            </section>

    
    </main>

    <?php include 'footer.php';?>
    <!-- Preloader Start -->
    <div id="preloader-active">
        <div class="preloader d-flex align-items-center justify-content-center">
            <div class="preloader-inner position-relative">
                <div class="text-center">
                    <img src="assets/imgs/theme/loading.gif" alt="" />
                </div>
            </div>
        </div>
    </div>
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
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 4
                    }
                }, {
                    breakpoint: 520,
                    settings: {
                        slidesToShow: 3
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

</body>

</html>