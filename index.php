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

    <!-- Quick view -->
    <div class="modal fade custom-modal show" id="onloadModal" tabindex="-1" aria-labelledby="onloadModalLabel"
        style="padding-right: 17px; display: block;" aria-modal="true" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                <div class="modal-body">
                    <div class="deal" style="background-image: url('assets/imgs/banner/popup-1.png')">
                        <div class="deal-top">
                            <h6 class="mb-10 text-brand-2">Deal of the Day</h6>
                        </div>
                        <div class="deal-content detail-info">
                            <h4 class="product-title"><a href="#" class="text-heading">Get Up To
                                    25% OFF on Christmas Day 2022</a></h4>
                            <div class="clearfix product-price-cover">
                                <div class="product-price primary-color float-left">
                                    <span class="current-price text-danger">$38</span>
                                    <span>
                                        <span class="save-price font-md color3 ml-15">25% Off</span>
                                        <span class="old-price font-md ml-15">$52</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="deal-bottom">
                            <p class="mb-20">Hurry Up! Offer End In:</p>
                            <div class="deals-countdown pl-5" data-countdown="2025/03/25 00:00:00"><span
                                    class="countdown-section"><span class="countdown-amount hover-up">1066</span><span
                                        class="countdown-period"> days </span></span><span
                                    class="countdown-section"><span class="countdown-amount hover-up">07</span><span
                                        class="countdown-period"> hours </span></span><span
                                    class="countdown-section"><span class="countdown-amount hover-up">54</span><span
                                        class="countdown-period"> mins </span></span><span
                                    class="countdown-section"><span class="countdown-amount hover-up">05</span><span
                                        class="countdown-period"> sec </span></span></div>
                            <div class="product-detail-rating">
                                <div class="product-rate-cover text-end">
                                    <div class="product-rate d-inline-block">
                                        <div class="product-rating" style="width: 90%"></div>
                                    </div>

                                </div>
                            </div>
                            <a href="products.php" class="btn hover-up">Shop Now <i
                                    class="fi-rs-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php include 'header.php';?>

    <div class="mobile-header-active mobile-header-wrapper-style">
        <div class="mobile-header-wrapper-inner">
            <div class="mobile-header-top">
                <div class="mobile-header-logo">
                    <a href="index.php"><img src="assets/imgs/theme/logo.svg" alt="logo" /></a>
                </div>
                <div class="mobile-menu-close close-style-wrap close-style-position-inherit">
                    <button class="close-style search-close">
                        <i class="icon-top"></i>
                        <i class="icon-bottom"></i>
                    </button>
                </div>
            </div>
            <div class="mobile-header-content-area">
                <div class="mobile-search search-style-3 mobile-header-border">
                    <form action="#">
                        <input type="text" placeholder="Search Products ..." />
                        <button type="submit"><i class="fi-rs-search"></i>Search</button>
                    </form>
                </div>
                <div class="mobile-menu-wrap mobile-header-border">
                    <!-- mobile menu start -->
                    <nav>
                        <ul>
                            <li class="hot-deals"><a href="#">Gift Products <i class="fi-rs-plus"></i></a>
                                <ul class="sub-menu">
                                    <li><a href="#">Home 1</a></li>
                                    <li><a href="#">Home 2</a></li>
                                    <li><a href="#">Home 3</a></li>
                                    <li><a href="#">Home 4</a></li>
                                    <li><a href="#">Home 5</a></li>
                                    <li><a href="#">Home 6</a></li>
                                </ul>
                            </li>
                            <li>
                                <a class="" href="#">Accessories <i class="fi-rs-plus"></i></a>
                                <ul class="sub-menu">
                                    <li><a href="#">Home 1</a></li>
                                    <li><a href="#">Home 2</a></li>
                                    <li><a href="#">Home 3</a></li>
                                    <li><a href="#">Home 4</a></li>
                                    <li><a href="#">Home 5</a></li>
                                    <li><a href="#">Home 6</a></li>
                                </ul>
                            </li>
                            <li>
                                <a href="#">Printing Product <i class="fi-rs-plus"></i></a>
                                <ul class="sub-menu">
                                    <li><a href="#">Home 1</a></li>
                                    <li><a href="#">Home 2</a></li>
                                    <li><a href="#">Home 3</a></li>
                                    <li><a href="#">Home 4</a></li>
                                    <li><a href="#">Home 5</a></li>
                                    <li><a href="#">Home 6</a></li>
                                </ul>
                            </li>
                            <li>
                                <a href="#">Digital Cards <i class="fi-rs-plus"></i></a>
                                <ul class="sub-menu">
                                    <li><a href="#">Home 1</a></li>
                                    <li><a href="#">Home 2</a></li>
                                    <li><a href="#">Home 3</a></li>
                                    <li><a href="#">Home 4</a></li>
                                    <li><a href="#">Home 5</a></li>
                                    <li><a href="#">Home 6</a></li>
                                </ul>
                            </li>

                            <li>
                                <a href="#" class="spcl">Special Offers</a>
                            </li>

                        </ul>
                    </nav>
                    <!-- mobile menu end -->
                </div>

            </div>
        </div>
    </div>
    <!--End header-->
    <main class="main">
        <section class="home-slider style-2 position-relative mb-50">
            <div class="container-fluid">
                <div class="row">
                    <div class="col-xl-8 px-0 col-lg-12">
                        <div class="home-slide-cover">
                            <div class="hero-slider-1 style-4 dot-style-1 dot-style-1-position-1">
                                <div class="single-hero-slider single-animation-wrap"
                                    style="background-image: url(assets/imgs/banner/ban1.jpg)">
                                    <div class="slider-content">
                                        <h1 class="display-2 mb-40">
                                            BOX Design & <br />Sticker Printing
                                        </h1>
                                        <a href="products.php" class="ordr">Order Now</a>
                                    </div>
                                </div>
                                <div class="single-hero-slider single-animation-wrap"
                                    style="background-image: url(assets/imgs/banner/ban2.jpg)">
                                    <div class="slider-content">
                                        <h1 class="display-2 mb-40">
                                            Brochure <br />Design
                                        </h1>
                                        <a href="products.php" class="ordr">Order Now</a>
                                    </div>
                                </div>
                                <div class="single-hero-slider single-animation-wrap"
                                    style="background-image: url(assets/imgs/banner/ban3.jpg)">
                                    <div class="slider-content">
                                        <h1 class="display-2 mb-40">
                                            Printed <br />tshirts
                                        </h1>
                                        <a href="products.php" class="ordr">Order Now</a>
                                    </div>
                                </div>
                            </div>
                            <div class="slider-arrow hero-slider-1-arrow"></div>
                        </div>
                    </div>
                    <div class="col-lg-4 px-0 d-none d-xl-block">
                        <div class="banner-img style-3 animated animated">
                            <div class="banner-text mt-30 text-center">
                                <h2 class="mb-10">
                                    BOX DESIGNING
                                </h2>
                                <H5 class="mb-20">TODAY THE LAST OFFER</H5>
                                <H1>120 SR/-</H1>
                                <a href="products.php" class="ordr">Order Now</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!--End hero slider-->
        <!-- <section class="popular-categories section-padding">
            <div class="container wow animate__animated animate__fadeIn">
                <div class="section-title">
                    <div class="title">
                        <h3>Top Categories</h3>

                    </div>
                    <div class="slider-arrow slider-arrow-2 flex-right carausel-10-columns-arrow"
                        id="carausel-10-columns-arrows"></div>
                </div>
                <div class="carausel-10-columns-cover position-relative">
                    <div class="carausel-8-columns" id="carausel-8-columns">
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p1.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">tSHIRTS</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p2.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">Bag print</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".3s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p3.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">Gift Pack</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".4s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p4.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">Paper cup</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".5s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p5.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">Brochure</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".6s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p6.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">hOODIES</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p1.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">tSHIRTS</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p2.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">Bag print</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".3s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p3.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">Gift Pack</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".4s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p4.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">Paper cup</a></h6>

                        </div>
                        <div class="card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".5s">
                            <figure class="img-hover-scale overflow-hidden">
                                <a href="#"><img src="assets/imgs/shop/p5.jpg" alt="" /></a>
                            </figure>
                            <h6><a href="#">Brochure</a></h6>

                        </div>

                    </div>
                </div>
            </div>
        </section> -->
        <!--End category slider-->

        <section class="popular-categories section-padding">
            <div class="container wow animate__animated animate__fadeIn">
                <div class="section-title">
                    <div class="title">
                        <h3>Top Categories</h3>

                    </div>
                    <a class="show-all" href="category.php">
                        View All

                    </a>
                </div>
                <div class="row" style="padding: 0 15px;">

                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p1.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">tSHIRTS</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p2.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">Bag print</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".3s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p3.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">Gift Pack</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".4s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p4.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">Paper cup</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".5s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p5.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">Brochure</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".6s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p6.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">hOODIES</a></h6>

                    </div>
                    <div class="col-md-2 card-2 card-3 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p1.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">tSHIRTS</a></h6>

                    </div>



                </div>
                <!-- <div class="row collapse" style="padding: 0 15px;" id="demo">

                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p1.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">tSHIRTS</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p2.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">Bag print</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".3s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p3.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">Gift Pack</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".4s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p4.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">Paper cup</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".5s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p5.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">Brochure</a></h6>

                    </div>
                    <div class="col-md-2 card-2 wow animate__animated animate__fadeInUp" data-wow-delay=".6s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p6.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">hOODIES</a></h6>

                    </div>
                    <div class="col-md-2 card-2 card-3 wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                        <figure class="img-hover-scale overflow-hidden">
                            <a href="products.php"><img src="assets/imgs/shop/p1.jpg" alt="" /></a>
                        </figure>
                        <h6><a href="products.php">tSHIRTS</a></h6>

                    </div>



                </div> -->
            </div>
        </section>


        <section class="banners mb-25">
            <div class="container">
                <div class="row">
                    <div class="col-lg-6 col-md-6">
                        <div class="banner-img wow animate__animated animate__fadeInUp" data-wow-delay="0">
                            <img src="assets/imgs/banner/b1.jpg" alt="" />
                            <div class="banner-text">
                                <h4>
                                    Booth design
                                </h4>
                                <h6>Exhibition stand</h6>
                                <a href="products.php" class="viewall">VIEW ALL </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6 col-md-6">
                        <div class="banner-img wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
                            <img src="assets/imgs/banner/b2.jpg" alt="" />
                            <div class="banner-text">
                                <h4>
                                    Package design
                                </h4>
                                <h6>New material</h6>
                                <a href="products.php" class="viewall"> VIEW ALL </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
        <!--End banners-->


        <section class="section-padding prdcts pb-5">
            <div class="container">
                <div class="section-tit wow animate__animated animate__fadeIn">
                    <h3 class="">NEW PRODUCTS</h3>

                </div>
                <hr class="hr">
                <div class="row">

                    <div class="col-lg-12 col-md-12 wow animate__animated animate__fadeIn" data-wow-delay=".4s">
                    <div class="carausel-4-columns-cover arrow-center position-relative">
                                    <div class="slider-arrow slider-arrow-2 carausel-4-columns-arrow"
                                        id="carausel-4-columns-arrows"></div>
                                    <div class="carausel-4-columns carausel-arrow-center" id="carausel-4-columns">
                                        <div class="product-cart-wrap">
                                            <div class="product-img-action-wrap">
                                                <div class="product-img product-img-zoom">
                                                    <a href="product-details.php">
                                                        <img class="default-img" src="assets/imgs/shop/pr1.jpg"
                                                            alt="" />
                                                        <!-- <img class="hover-img" src="assets/imgs/shop/product-1-2.jpg"
                                                            alt="" /> -->
                                                    </a>
                                                    <ul class="clrs">
                                                        <li class="first"></li>
                                                        <li class="sec"></li>
                                                        <li class="third"></li>
                                                    </ul>
                                                </div>

                                                <div class="product-badges product-badges-position product-badges-mrg">
                                                    <span class="new">In Stock</span>
                                                </div>

                                                <div class="product-badges product-badge-position product-badges-mrg">
                                                    <span><i class="fi-rs-eye"></i></span> <span><i
                                                            class="fi-rs-heart toggle-heart"></i></span>
                                                </div>
                                            </div>
                                            <div class="product-content-wrap">

                                                <h2><a href="product-details.php">Trending T-shirt
                                                        Limited Model </a></h2>
                                                <div class="product-rate d-flex align-items-center">
                                                    <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                                    <h6 class="d-inline-block">4/5</h6>
                                                    <span class="d-inline-block">2599 - Reviews</span>
                                                </div>
                                                <div class="product-price mt-10 d-flex justify-content-between">
                                                    <span class="old1">399 SR</span>
                                                    <div>
                                                        <span class="newpric"><a href="" class="offr-btn">15%
                                                                OFF</a></span>
                                                        <span class="newprice">199 SR</span>
                                                    </div>
                                                </div>
                                                <hr>
                                                <span class="inclusive">Inclusive of VAT</span>
                                                <a href="#"
                                                    class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                        src="assets/imgs/icons/gift.png"
                                                        class="mr-5 d-inline-block"></i>1 Gift(s) worth 500 SR</a>
                                            </div>
                                        </div>
                                        <!--End product Wrap-->
                                        <div class="product-cart-wrap">
                                            <div class="product-img-action-wrap">
                                                <div class="product-img product-img-zoom">
                                                    <a href="product-details.php">
                                                        <img class="default-img" src="assets/imgs/shop/pr2.jpg"
                                                            alt="" />
                                                        <!-- <img class="hover-img" src="assets/imgs/shop/product-5-2.jpg"
                                                            alt="" /> -->
                                                    </a>
                                                    <ul class="clrs">
                                                        <li class="first"></li>
                                                        <li class="sec"></li>
                                                        <li class="third"></li>
                                                    </ul>
                                                </div>

                                                <div class="product-badges product-badges-position product-badges-mrg">
                                                    <span class="new">In Stock</span>
                                                </div>
                                                <div class="product-badges product-badge-position product-badges-mrg">
                                                    <span><i class="fi-rs-eye"></i></span> <span><i
                                                            class="fi-rs-heart toggle-heart"></i></span>
                                                </div>
                                            </div>
                                            <div class="product-content-wrap">

                                                <h2><a href="product-details.php">T-shirt Branding 
                                                        2022 Model </a></h2>
                                                <div class="product-rate d-flex align-items-center">
                                                    <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                                    <h6 class="d-inline-block">4/5</h6>
                                                    <span class="d-inline-block">2599 - Reviews</span>
                                                </div>
                                                <div class="product-price mt-10 d-flex justify-content-between">
                                                    <span class="newpric">199 SR</span>

                                                </div>
                                                <hr>
                                                <span class="inclusive">Inclusive of VAT</span>
                                                <a href="#"
                                                    class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                        src="assets/imgs/icons/gift.png"
                                                        class="mr-5 d-inline-block"></i>1 Gift(s) worth 500 SR</a>
                                            </div>
                                        </div>
                                        <!--End product Wrap-->
                                        <div class="product-cart-wrap">
                                            <div class="product-img-action-wrap">
                                                <div class="product-img product-img-zoom">
                                                    <a href="product-details.php">
                                                        <img class="default-img" src="assets/imgs/shop/pr3.jpg"
                                                            alt="" />
                                                        <!-- <img class="hover-img" src="assets/imgs/shop/product-2-2.jpg"
                                                            alt="" /> -->
                                                    </a>
                                                    <ul class="clrs">
                                                        <li class="first"></li>
                                                        <li class="sec"></li>
                                                        <li class="third"></li>
                                                    </ul>
                                                </div>

                                                <div class="product-badges product-badges-position product-badges-mrg">
                                                    <span class="hot">Limited Stock</span>
                                                </div>
                                                <div class="product-badges product-badge-position product-badges-mrg">
                                                    <span><i class="fi-rs-eye"></i></span> <span><i
                                                            class="fi-rs-heart toggle-heart"></i></span>
                                                </div>
                                            </div>
                                            <div class="product-content-wrap">

                                                <h2><a href="product-details.php">Hoodie New Black Color
                                                        2022 Model </a></h2>
                                                <div class="product-rate d-flex align-items-center">
                                                    <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                                    <h6 class="d-inline-block">4/5</h6>
                                                    <span class="d-inline-block">2599 - Reviews</span>
                                                </div>
                                                <div class="product-price mt-10 d-flex justify-content-between">
                                                    <span class="newpric">299 SR</span>

                                                </div>
                                                <hr>
                                                <span class="inclusive">Inclusive of VAT</span>
                                                <a href="#"
                                                    class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                        src="assets/imgs/icons/gift.png"
                                                        class="mr-5 d-inline-block"></i>1 Gift(s) worth 500 SR</a>
                                            </div>
                                        </div>
                                        <!--End product Wrap-->

                                        <div class="product-cart-wrap">
                                            <div class="product-img-action-wrap">
                                                <div class="product-img product-img-zoom">
                                                    <a href="product-details.php">
                                                        <img class="default-img" src="assets/imgs/shop/pr1.jpg"
                                                            alt="" />
                                                        <!-- <img class="hover-img" src="assets/imgs/shop/product-1-2.jpg"
                                                                alt="" /> -->
                                                    </a>
                                                    <ul class="clrs">
                                                        <li class="first"></li>
                                                        <li class="sec"></li>
                                                        <li class="third"></li>
                                                    </ul>
                                                </div>

                                                <div class="product-badges product-badges-position product-badges-mrg">
                                                    <span class="new">In Stock</span>
                                                </div>
                                                <div class="product-badges product-badge-position product-badges-mrg">
                                                    <span><i class="fi-rs-eye"></i></span> <span><i
                                                            class="fi-rs-heart toggle-heart"></i></span>
                                                </div>
                                            </div>
                                            <div class="product-content-wrap">

                                                <h2><a href="product-details.php">Trending T-shirt
                                                        Limited Model </a></h2>
                                                <div class="product-rate d-flex align-items-center">
                                                    <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                                    <h6 class="d-inline-block">4/5</h6>
                                                    <span class="d-inline-block">2599 - Reviews</span>
                                                </div>
                                                <div class="product-price mt-10 d-flex justify-content-between">
                                                    <span class="old1">399 SR</span>
                                                    <div>
                                                        <span class="newpric"><a href="" class="offr-btn">15%
                                                                OFF</a></span>
                                                        <span class="newprice">199 SR</span>
                                                    </div>
                                                </div>
                                                <hr>
                                                <span class="inclusive">Inclusive of VAT</span>
                                                <a href="#"
                                                    class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                        src="assets/imgs/icons/gift.png"
                                                        class="mr-5 d-inline-block"></i>1 Gift(s) worth 500 SR</a>
                                            </div>
                                        </div>
                                        <!--End product Wrap-->
                                        <div class="product-cart-wrap">
                                            <div class="product-img-action-wrap">
                                                <div class="product-img product-img-zoom">
                                                    <a href="product-details.php">
                                                        <img class="default-img" src="assets/imgs/shop/pr2.jpg"
                                                            alt="" />
                                                        <!-- <img class="hover-img" src="assets/imgs/shop/product-5-2.jpg"
                                                                alt="" /> -->
                                                    </a>
                                                    <ul class="clrs">
                                                        <li class="first"></li>
                                                        <li class="sec"></li>
                                                        <li class="third"></li>
                                                    </ul>
                                                </div>

                                                <div class="product-badges product-badges-position product-badges-mrg">
                                                    <span class="new">In Stock</span>
                                                </div>
                                                <div class="product-badges product-badge-position product-badges-mrg">
                                                    <span><i class="fi-rs-eye"></i></span> <span><i
                                                            class="fi-rs-heart toggle-heart"></i></span>
                                                </div>
                                            </div>
                                            <div class="product-content-wrap">

                                                <h2><a href="product-details.php">Trending T-shirt
                                                        Limited Model </a></h2>
                                                <div class="product-rate d-flex align-items-center">
                                                    <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                                    <h6 class="d-inline-block">4/5</h6>
                                                    <span class="d-inline-block">2599 - Reviews</span>
                                                </div>
                                                <div class="product-price mt-10 d-flex justify-content-between">
                                                    <span class="newpric">199 SR</span>

                                                </div>
                                                <hr>
                                                <span class="inclusive">Inclusive of VAT</span>
                                                <a href="#"
                                                    class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                        src="assets/imgs/icons/gift.png"
                                                        class="mr-5 d-inline-block"></i>1 Gift(s) worth 500 SR</a>
                                            </div>
                                        </div>
                                        <!--End product Wrap-->
                                        <div class="product-cart-wrap">
                                            <div class="product-img-action-wrap">
                                                <div class="product-img product-img-zoom">
                                                    <a href="product-details.php">
                                                        <img class="default-img" src="assets/imgs/shop/pr3.jpg"
                                                            alt="" />
                                                        <!-- <img class="hover-img" src="assets/imgs/shop/product-2-2.jpg"
                                                                alt="" /> -->
                                                    </a>
                                                    <ul class="clrs">
                                                        <li class="first"></li>
                                                        <li class="sec"></li>
                                                        <li class="third"></li>
                                                    </ul>
                                                </div>

                                                <div class="product-badges product-badges-position product-badges-mrg">
                                                    <span class="hot">Limited Stock</span>
                                                </div>
                                                <div class="product-badges product-badge-position product-badges-mrg">
                                                    <span><i class="fi-rs-eye"></i></span> <span><i
                                                            class="fi-rs-heart toggle-heart"></i></span>
                                                </div>
                                            </div>
                                            <div class="product-content-wrap">

                                                <h2><a href="product-details.php">Trending T-shirt
                                                        Limited Model </a></h2>
                                                <div class="product-rate d-flex align-items-center">
                                                    <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                                    <h6 class="d-inline-block">4/5</h6>
                                                    <span class="d-inline-block">2599 - Reviews</span>
                                                </div>
                                                <div class="product-price mt-10 d-flex justify-content-between">
                                                    <span class="newpric">399 SR</span>

                                                </div>
                                                <hr>
                                                <span class="inclusive">Inclusive of VAT</span>
                                                <a href="#"
                                                    class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                        src="assets/imgs/icons/gift.png"
                                                        class="mr-5 d-inline-block"></i>1 Gift(s) worth 500 SR</a>
                                            </div>
                                        </div>
                                        <!--End product Wrap-->
                                        <div class="product-cart-wrap">
                                            <div class="product-img-action-wrap">
                                                <div class="product-img product-img-zoom">
                                                    <a href="product-details.php">
                                                        <img class="default-img" src="assets/imgs/shop/pr2.jpg"
                                                            alt="" />
                                                        <!-- <img class="hover-img" src="assets/imgs/shop/product-3-2.jpg"
                                                                alt="" /> -->
                                                    </a>
                                                    <ul class="clrs">
                                                        <li class="first"></li>
                                                        <li class="sec"></li>
                                                        <li class="third"></li>
                                                    </ul>

                                                </div>

                                                <div class="product-badges product-badges-position product-badges-mrg">
                                                    <span class="hot">Limited Stock</span>
                                                </div>
                                                <div class="product-badges product-badge-position product-badges-mrg">
                                                    <span><i class="fi-rs-eye"></i></span> <span><i
                                                            class="fi-rs-heart toggle-heart"></i></span>
                                                </div>
                                            </div>
                                            <div class="product-content-wrap">

                                                <h2><a href="product-details.php">Trending T-shirt
                                                        Limited Model </a></h2>
                                                <div class="product-rate d-flex align-items-center">
                                                    <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                                    <h6 class="d-inline-block">4/5</h6>
                                                    <span class="d-inline-block">2599 - Reviews</span>
                                                </div>
                                                <div class="product-price mt-10 d-flex justify-content-between">
                                                    <span class="newpric">299 SR</span>

                                                </div>
                                                <hr>
                                                <span class="inclusive">Inclusive of VAT</span>
                                                <a href="#"
                                                    class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                        src="assets/imgs/icons/gift.png"
                                                        class="mr-5 d-inline-block"></i>1 Gift(s) worth 500 SR</a>
                                            </div>
                                        </div>
                                        <!--End product Wrap-->
                                    </div>
                                </div>
                    </div>
                    <!--End Col-lg-9-->
                </div>
            </div>
        </section>
        <!--End Best Sales-->


        <section class="section-padding prdcts">
            <div class="container">
                <div class="section-title wow animate__animated animate__fadeIn">
                    <h3 class="">Right now at VEUZ</h3>

                </div>

                <div class="row">
                    <div class="col-md-4">
                        <div class="item-box itm1">
                            <img src="assets/imgs/shop/cup.jpg" alt="">
                            <div class="itm-cntnt">
                                <h3>Coffe cup design</h3>
                                <h6>Now in all Color Varient Available..</h6>
                                <div class="circl"><i class="fi-rs-arrow-small-right"></i></div>
                            </div>

                        </div>
                    </div>
                    <div class="col-md-4 d-flex justify-content-center">
                        <div class="item-box itm2">
                            <img src="assets/imgs/shop/card.jpg" alt="">
                            <div class="itm-cntnt">
                                <h3>Business card print</h3>
                                <h6>Now in all Color Varient Available..</h6>
                                <div class="circl"><i class="fi-rs-arrow-small-right"></i></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 d-flex justify-content-end">
                        <div class="item-box itm3">
                            <img src="assets/imgs/shop/tshrt.jpg" alt="">
                            <div class="itm-cntnt">
                                <h3>T-shirt print</h3>
                                <h6>Now in all Color Varient Available..</h6>
                                <div class="circl"><i class="fi-rs-arrow-small-right"></i></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row mar-top">
                    <div class="col-lg-4 col-md-6">
                        <div class="banner-img wow animate__ animate__fadeInUp animated" data-wow-delay="0"
                            style="visibility: visible; animation-name: fadeInUp;">
                            <img src="assets/imgs/banner/bg1.jpg" alt="">
                            <div class="banner-tex banner-text">
                                <h4>
                                    Package Print
                                </h4>
                                <h6>New Model</h6>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6">
                        <div class="banner-img wow animate__ animate__fadeInUp animated" data-wow-delay=".2s"
                            style="visibility: visible; animation-delay: 0.2s; animation-name: fadeInUp;">
                            <img src="assets/imgs/banner/bg2.jpg" alt="">
                            <div class="banner-text">
                                <h4>
                                    Stationary
                                </h4>
                                <h6>New Model</h6>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 d-md-none d-lg-flex">
                        <div class="banner-img mb-sm-0 wow animate__ animate__fadeInUp animated" data-wow-delay=".4s"
                            style="visibility: visible; animation-delay: 0.4s; animation-name: fadeInUp;">
                            <img src="assets/imgs/banner/bg3.jpg" alt="">
                            <div class="banner-tex banner-text">
                                <h4>Sticker Print</h4>
                                <h6>New Arrival 2022</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>



        <section class="section-padding pb-5 onsal">
            <div class="container">
                <div class="section-title wow animate__animated animate__fadeIn" data-wow-delay="0">
                    <h3 class="">ONSALE PRODUCTS</h3>
                    <a class="show-all" href="products.php">
                        View All

                    </a>
                </div>
                <hr>
                <div class="row">
                    <div class="col-md-4">
                        <div class="product-cart-wrap">
                            <div class="product-img-action-wrap">



                                <div class="product-badges product-badges-position product-badges-mrg">
                                    <span class="hot">Limited Stock</span>
                                </div>
                                <div class="product-badges product-badge-position product-badges-mrg">
                                    <span><i class="fi-rs-eye"></i></span> <span><i class="fi-rs-heart toggle-heart"></i></span>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <img src="assets/imgs/shop/prdct1.jpg" alt="">
                                </div>
                                <div class="col-md-8 onsale-prdct">
                                    <div class="product-content-wrap">

                                        <h2><a href="product-details.php">Trending T-shirt
                                                Limited Model </a></h2>
                                        <hr>
                                        <div class="product-rate d-flex align-items-center">
                                            <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                            <h6 class="d-inline-block">4/5</h6>
                                            <span class="d-inline-block">2599 - Reviews</span>
                                        </div>
                                        <div class="product-price mt-10 d-flex justify-content-between">
                                            <span class="newpric">399 SR</span>

                                        </div>

                                        <span class="inclusive">Inclusive of VAT</span>
                                        <a href="#"
                                            class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                src="assets/imgs/icons/gift.png" class="mr-5 d-inline-block"></i>1
                                            Gift(s) worth 500 SR</a>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="product-cart-wrap wra">
                            <div class="product-img-action-wrap">



                                <div class="product-badges product-badges-position product-badges-mrg">
                                    <span class="new">In Stock</span>
                                </div>
                                <div class="product-badges product-badge-position product-badges-mrg">
                                    <span><i class="fi-rs-eye"></i></span> <span><i class="fi-rs-heart toggle-heart"></i></span>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <img src="assets/imgs/shop/prdct2.jpg" alt="">
                                </div>
                                <div class="col-md-8 onsale-prdct">
                                    <div class="product-content-wrap">

                                        <h2><a href="product-details.php">Trending T-shirt
                                                Limited Model </a></h2>
                                        <hr>
                                        <div class="product-rate d-flex align-items-center">
                                            <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                            <h6 class="d-inline-block">4/5</h6>
                                            <span class="d-inline-block">2599 - Reviews</span>
                                        </div>
                                        <div class="product-price mt-10 d-flex justify-content-between">
                                            <span class="newpric">399 SR</span>

                                        </div>

                                        <span class="inclusive">Inclusive of VAT</span>
                                        <a href="#"
                                            class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                src="assets/imgs/icons/gift.png" class="mr-5 d-inline-block"></i>1
                                            Gift(s) worth 500 SR</a>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="product-cart-wrap">
                            <div class="product-img-action-wrap">



                                <div class="product-badges product-badges-position product-badges-mrg">
                                    <span class="hot">Limited Stock</span>
                                </div>
                                <div class="product-badges product-badge-position product-badges-mrg">
                                    <span><i class="fi-rs-eye"></i></span> <span><i class="fi-rs-heart toggle-heart"></i></span>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <img src="assets/imgs/shop/prdct3.jpg" alt="">
                                </div>
                                <div class="col-md-8 onsale-prdct">
                                    <div class="product-content-wrap">

                                        <h2><a href="product-details.php">Trending T-shirt
                                                Limited Model </a></h2>
                                        <hr>
                                        <div class="product-rate d-flex align-items-center">
                                            <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                            <h6 class="d-inline-block">4/5</h6>
                                            <span class="d-inline-block">2599 - Reviews</span>
                                        </div>
                                        <div class="product-price mt-10 d-flex justify-content-between">
                                            <span class="newpric">399 SR</span>

                                        </div>

                                        <span class="inclusive">Inclusive of VAT</span>
                                        <a href="#"
                                            class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                src="assets/imgs/icons/gift.png" class="mr-5 d-inline-block"></i>1
                                            Gift(s) worth 500 SR</a>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div class="row mar-t">

                    <div class="col-md-4">
                        <div class="product-cart-wrap wra1">
                            <div class="product-img-action-wrap">



                                <div class="product-badges product-badges-position product-badges-mrg">
                                    <span class="sale">Out of stock</span>
                                </div>
                                <div class="product-badges product-badge-position product-badges-mrg">
                                    <span><i class="fi-rs-eye"></i></span> <span><i class="fi-rs-heart toggle-heart"></i></span>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <img src="assets/imgs/shop/prdct4.jpg" alt="">
                                </div>
                                <div class="col-md-8 onsale-prdct">
                                    <div class="product-content-wrap">

                                        <h2><a href="product-details.php">Trending T-shirt
                                                Limited Model </a></h2>
                                        <hr>
                                        <div class="product-rate d-flex align-items-center">
                                            <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                            <h6 class="d-inline-block">4/5</h6>
                                            <span class="d-inline-block">2599 - Reviews</span>
                                        </div>
                                        <div class="product-price mt-10 d-flex justify-content-between">
                                            <div class="old">
                                                <span class="newpric">399 SR</span>
                                                <span class="inclusive">Inclusive of VAT</span>
                                            </div>

                                            <div class="off">
                                                <span class="newpric"><a href="" class="offr-btn">15% OFF</a></span>

                                            </div>
                                            <div class="new">
                                                <span class="newprice">199 SR</span>
                                                <span class="inclusiv">Inclusive of VAT</span>
                                            </div>

                                        </div>
                                        <a href="#"
                                            class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                src="assets/imgs/icons/gift.png" class="mr-5 d-inline-block"></i>1
                                            Gift(s) worth 500 SR</a>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="product-cart-wrap">
                            <div class="product-img-action-wrap">



                                <div class="product-badges product-badges-position product-badges-mrg">
                                    <span class="hot">Limited Stock</span>
                                </div>
                                <div class="product-badges product-badge-position product-badges-mrg">
                                    <span><i class="fi-rs-eye"></i></span> <span><i class="fi-rs-heart toggle-heart"></i></span>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <img src="assets/imgs/shop/prdct5.jpg" alt="">
                                </div>
                                <div class="col-md-8 onsale-prdct">
                                    <div class="product-content-wrap">

                                        <h2><a href="product-details.php">Trending T-shirt
                                                Limited Model </a></h2>
                                        <hr>
                                        <div class="product-rate d-flex align-items-center">
                                            <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                            <h6 class="d-inline-block">4/5</h6>
                                            <span class="d-inline-block">2599 - Reviews</span>
                                        </div>
                                        <div class="product-price mt-10 d-flex justify-content-between">
                                            <div class="old">
                                                <span class="newpric">399 SR</span>
                                                <span class="inclusive">Inclusive of VAT</span>
                                            </div>

                                            <div class="off">
                                                <span class="newpric"><a href="" class="offr-btn">15% OFF</a></span>

                                            </div>
                                            <div class="new">
                                                <span class="newprice">199 SR</span>
                                                <span class="inclusiv">Inclusive of VAT</span>
                                            </div>

                                        </div>
                                        <a href="#"
                                            class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                src="assets/imgs/icons/gift.png" class="mr-5 d-inline-block"></i>1
                                            Gift(s) worth 500 SR</a>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="product-cart-wrap wra">
                            <div class="product-img-action-wrap">



                                <div class="product-badges product-badges-position product-badges-mrg">
                                    <span class="new">In Stock</span>
                                </div>
                                <div class="product-badges product-badge-position product-badges-mrg">
                                    <span><i class="fi-rs-eye"></i></span> <span><i class="fi-rs-heart toggle-heart"></i></span>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <img src="assets/imgs/shop/prdct6.jpg" alt="">
                                </div>
                                <div class="col-md-8 onsale-prdct">
                                    <div class="product-content-wrap">

                                        <h2><a href="product-details.php">Trending T-shirt
                                                Limited Model </a></h2>
                                        <hr>
                                        <div class="product-rate d-flex align-items-center">
                                            <img src="assets/imgs/icons/star.png" alt="" class="d-inline-block">
                                            <h6 class="d-inline-block">4/5</h6>
                                            <span class="d-inline-block">2599 - Reviews</span>
                                        </div>
                                        <div class="product-price mt-10 d-flex justify-content-between">
                                            <div class="old">
                                                <span class="newpric">399 SR</span>
                                                <span class="inclusive">Inclusive of VAT</span>
                                            </div>

                                            <div class="off">
                                                <span class="newpric"><a href="" class="offr-btn">15% OFF</a></span>

                                            </div>
                                            <div class="new">
                                                <span class="newprice">199 SR</span>
                                                <span class="inclusiv">Inclusive of VAT</span>
                                            </div>

                                        </div>



                                        <a href="#"
                                            class="btn w-100 hover-up cart-btn d-flex align-items-center justify-content-center"><img
                                                src="assets/imgs/icons/gift.png" class="mr-5 d-inline-block"></i>1
                                            Gift(s) worth 500 SR</a>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
        <!--End Deals-->




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
    $(document).ready(function() {
      $('.toggle-heart').on('click', function() {
        $(this).toggleClass('fi-rs-heart fi-ss-heart');
      });
    });
  </script>
</body>

</html>