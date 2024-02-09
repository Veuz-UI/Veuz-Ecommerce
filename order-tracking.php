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
                        <a href="#">My Orders</a>

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
                            <h3>My Orders</h3>
                            <hr>
                        </div>
                    </div>
                    <div class="col-xl-12">
                        <div class="row">
                            <div class="col-xl-3 col-lg-6">
                                <div class="card-box">
                                    <h3>Shipping Address</h3>
                                    <h4>Mad Jack</h4>

                                    <div class="box-addrs">
                                        <svg width="20" height="22" viewBox="0 0 16 18" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M14.4839 7.5C14.4839 12.5556 8.75562 16.8889 7.74194 16.8889C6.72826 16.8889 1 12.5556 1 7.5C1 5.77609 1.71031 4.12279 2.97467 2.90381C4.23902 1.68482 5.95386 1 7.74194 1C9.53001 1 11.2448 1.68482 12.5092 2.90381C13.7736 4.12279 14.4839 5.77609 14.4839 7.5Z"
                                                stroke="#747474" stroke-width="1.28816" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                            <path
                                                d="M7.74267 9.66659C8.98383 9.66659 9.98998 8.69654 9.98998 7.49992C9.98998 6.3033 8.98383 5.33325 7.74267 5.33325C6.50152 5.33325 5.49536 6.3033 5.49536 7.49992C5.49536 8.69654 6.50152 9.66659 7.74267 9.66659Z"
                                                stroke="#747474" stroke-width="1.28816" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>

                                        <h6>Govt Cyberpark Palazhi, Gov Cyberpark Kozhikode
                                            673008, Kerala</h6>
                                    </div>

                                    <div class="box-addrs">
                                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M9.09631 3.4847C9.72682 3.60307 10.3063 3.8998 10.7605 4.33691C11.2148 4.77401 11.5231 5.33161 11.6461 5.93833M9.09631 1C10.4063 1.14004 11.6278 1.70452 12.5604 2.60077C13.4929 3.49702 14.0811 4.67176 14.2283 5.93212M13.5827 10.8891V12.7526C13.5835 12.9256 13.5466 13.0968 13.4746 13.2554C13.4026 13.4139 13.297 13.5562 13.1645 13.6731C13.032 13.7901 12.8756 13.8791 12.7053 13.9345C12.535 13.9899 12.3545 14.0105 12.1755 13.995C10.1891 13.7873 8.281 13.1341 6.60457 12.088C5.04486 11.1342 3.7225 9.86177 2.7314 8.36091C1.64044 6.74039 0.961514 4.89538 0.749624 2.97533C0.733493 2.80356 0.754708 2.63043 0.811918 2.46698C0.869128 2.30353 0.961081 2.15333 1.08192 2.02594C1.20276 1.89856 1.34984 1.79679 1.51379 1.7271C1.67775 1.65741 1.85499 1.62134 2.03423 1.62117H3.97081C4.28409 1.61821 4.5878 1.72496 4.82534 1.92153C5.06287 2.1181 5.21802 2.39109 5.26187 2.68959C5.34361 3.28596 5.49519 3.87152 5.71374 4.43509C5.80059 4.65742 5.81939 4.89906 5.7679 5.13135C5.71642 5.36365 5.59681 5.57688 5.42325 5.74577V5.74577C4.94276 6.20813 4.83447 6.94733 5.23727 7.47875C5.87195 8.31608 6.63894 9.05284 7.51028 9.66213C8.06512 10.0501 8.80858 9.94225 9.29642 9.47281V9.47281C9.47193 9.3058 9.69352 9.1907 9.93492 9.14116C10.1763 9.09162 10.4274 9.10971 10.6585 9.19328C11.2442 9.40358 11.8527 9.54945 12.4724 9.62811C12.786 9.67067 13.0724 9.82266 13.2771 10.0552C13.4818 10.2877 13.5906 10.5844 13.5827 10.8891Z"
                                                stroke="#747474" stroke-width="1.33017" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>

                                        <h6>98974562310</h6>
                                    </div>
                                </div>
                            </div>
                            <div class="col-xl-3 col-lg-6">
                                <div class="card-box reward-box">
                                    <h3>Your Rewards</h3>

                                    <div class="box-addrs">
                                        <img src="assets/imgs/icons/coin.png" alt="">
                                        <div class="rewards">
                                            <h5>12 Supercoins Cashback</h5>
                                            <p>Use it to save on your next order</p>
                                        </div>

                                    </div>

                                    <div class="box-addrs">
                                        <img src="assets/imgs/icons/axis.png" alt="">
                                        <div class="rewards">
                                            <h5>5% Cashback on Flipkart Axis Bank Card</h5>
                                            <p>To be adjusted in your March statemen</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <div class="col-xl-4 col-lg-8">
                                <div class="card-box">

                                    <div class="row">
                                        <div class="col-md-3">
                                            <img src="assets/imgs/shop/pr1.jpg" alt="" class="shopping-img">
                                        </div>
                                        <div class="col-md-9">
                                            <div class="shipping-order-details">
                                                <h3>New Trending T-shirt Limited Model</h3>
                                                <div class="prdct-ftrs">
                                                    <p> Color : <span>Black</span></p>
                                                    <p> Seller : <span>Company Name</span></p>
                                                </div>
                                                <h2>827 SAR</h2>
                                                <h6>7 Offer & 1 Coupon Applied</h6>
                                                <h4>Return Policy Valid thill Feb 05</h4>
                                            </div>


                                        </div>
                                    </div>

                                </div>
                            </div>
                            <div class="col-xl-2 col-lg-4">
                                <div class="card-box download-invoice">
                                    <i class="fi-rs-download downld-icn"></i>
                                    <h3>Download Invoice</h3>
                                    <a href="#" download><button class="download-btn"><i class="fa-regular fa-file-lines"></i>Invoice</button></a>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="hh-grayBox pt45 pb20">
                                    <div class="row justify-content-between">
                                        <div class="order-tracking completed">
                                            <span class="is-complete"></span>
                                            <p>Ordered<br><span>Mon, June 24</span></p>
                                        </div>
                                        <div class="order-tracking completed">
                                            <span class="is-complete"></span>
                                            <p>Shipped<br><span>Tue, June 25</span></p>
                                        </div>
                                        <div class="order-tracking completed">
                                            <span class="is-complete"></span>
                                            <p>Out for Delivery<br><span>Fri, June 28</span></p>
                                        </div>
                                        <div class="order-tracking">
                                            <span class="is-complete"></span>
                                            <p>Delivered<br><span>Fri, June 28</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="delivery-updates-div">
                                    <h3>Delivery Updates</h3>
                                    <div class="delivery-update">
                                        <div class="row align-items-center">
                                            <div class="col-lg-2">
                                                <h4>Mon, June 24 <span>10:30</span></h4>
                                            </div>
                                            <div class="col-lg-10">
                                                <h6>Order Received</h6>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="delivery-update">
                                        <div class="row align-items-center">
                                            <div class="col-lg-2">
                                                <h4>Mon, June 24 <span>12:35</span></h4>
                                            </div>
                                            <div class="col-lg-10">
                                                <h6>Your order is being processed in Dubai - UAE warehouse.</h6>
                                            </div>
                                        </div>
                                    </div>
                                   
                                    <div class="delivery-update">
                                        <div class="row align-items-center">
                                            <div class="col-lg-2">
                                                <h4>Mon, June 24 <span>17:15</span></h4>
                                            </div>
                                            <div class="col-lg-10">
                                                <h6>Your order is ready to be shipped from Dubai - UAE warehouse.</h6>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="delivery-update">
                                        <div class="row align-items-center">
                                            <div class="col-lg-2">
                                                <h4>Tue, June 25 <span>10:30</span></h4>
                                            </div>
                                            <div class="col-lg-10">
                                                <h6>Your order is shipped</h6>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="delivery-update">
                                        <div class="row align-items-center">
                                            <div class="col-lg-2">
                                                <h4>Wed, June 26 <span>16:30</span></h4>
                                            </div>
                                            <div class="col-lg-10">
                                                <h6>Your order has arrived in Riyadh - KSA warehouse.</h6>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="delivery-update">
                                        <div class="row align-items-center">
                                            <div class="col-lg-2">
                                                <h4>Thu, June 27 <span>10:30</span></h4>
                                            </div>
                                            <div class="col-lg-10">
                                                <h6>Your order has been picked up by ARAMEX and on the way to Jeddah</h6>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="delivery-update">
                                        <div class="row align-items-center">
                                            <div class="col-lg-2">
                                                <h4>Thu, June 27 <span>19:30</span></h4>
                                            </div>
                                            <div class="col-lg-10">
                                                <h6>Your order has arrived in Jeddah.</h6>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="delivery-update">
                                        <div class="row align-items-center">
                                            <div class="col-lg-2">
                                                <h4>Fri, June 28 <span>11:30</span></h4>
                                            </div>
                                            <div class="col-lg-10">
                                                <h6>Your order is out for delivery</h6>
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
                    breakpoint: 1200,
                    settings: {
                        slidesToShow: 5
                    }
                }, {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 3
                    }
                }, {
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
        $(document).ready(function () {
            $('.toggle-heart').on('click', function () {
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
        $offCanvasNavSubMenu.parent().prepend(
        '<span class="menu-expand"><i class="fi-rs-angle-small-down"></i></span>');

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
</body>

</html>