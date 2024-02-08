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

        <section class="section-padding prdcts pb-40 pb-sm-0">
            <div class="container">
                <div class="row">
                    <div class="col-xl-3 col-lg-4">
                        <ul class="breadcrumb-list pt-md-0 mb-md-2">
                            <li> <a href="index.php">Home</a>
                                <span class="separator" aria-hidden="true">&rsaquo;</span></li>
                            <li class="active-brudcrumb">
                                <a href="voucher.php">Vouchers</a>

                            </li>
                        </ul>
                        <div class="products-leftfilter">
                            <div class="products-filter-div">
                                <h4>Filter by Brand</h4>
                                <div class="search-wrapper">
                                    <div class="input-holder">
                                        <input type="text" class="search-input" placeholder="Type to search" />
                                        <button class="search-icon" onclick="searchToggle(this, event);"><i class="fi-rs-search"></i></button>
                                    </div>
                                    <span class="close" onclick="searchToggle(this, event);"><i class="fa-solid fa-xmark delete-search"></i></span>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox11" value="">
                                    <label class="form-check-label"
                                        for="exampleCheckbox11"><span>Himalaya</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox12" value="">
                                    <label class="form-check-label" for="exampleCheckbox12"><span>Flipcart</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox13" value="">
                                    <label class="form-check-label" for="exampleCheckbox13"><span>Kalyan Jewellers</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox14" value="">
                                    <label class="form-check-label" for="exampleCheckbox14"><span>Lifestyle</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox15" value="">
                                    <label class="form-check-label" for="exampleCheckbox15"><span>Joyalukkas</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox16" value="">
                                    <label class="form-check-label" for="exampleCheckbox16"><span>Pantaloons</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox17" value="">
                                    <label class="form-check-label" for="exampleCheckbox17"><span>Tanishq</span></label>
                                </div>
                            </div>
                            <div class="products-filter-div">
                                <h4>Filter by Price</h4>
                                
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox21" value="">
                                    <label class="form-check-label" for="exampleCheckbox21"><span>$50 -
                                            $100</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox22" value="">
                                    <label class="form-check-label"
                                        for="exampleCheckbox22"><span>$100-$150</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox23" value="">
                                    <label class="form-check-label"
                                        for="exampleCheckbox23"><span>$150-$200</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox24" value="">
                                    <label class="form-check-label"
                                        for="exampleCheckbox34"><span>$250-$300</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox25" value="">
                                    <label class="form-check-label"
                                        for="exampleCheckbox25"><span>$300-$500</span></label>
                                </div>
                            </div>
                            <div class="products-filter-div">
                                <h4>Filter by Customer Rating</h4>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox31" value="">
                                    <label class="form-check-label" for="exampleCheckbox31"><span>4 & Above</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox32" value="">
                                    <label class="form-check-label" for="exampleCheckbox32"><span>3 & Above</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox33" value="">
                                    <label class="form-check-label" for="exampleCheckbox33"><span>2 & Above</span></label>
                                </div>
                                <div class="custome-checkbox">
                                    <input class="form-check-input" type="checkbox" name="checkbox"
                                        id="exampleCheckbox34" value="">
                                    <label class="form-check-label" for="exampleCheckbox34"><span>1 & Above</span></label>
                                </div>
                               
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-9 col-lg-8">
                        <div class="products-list1 voucher-list">
                            <div class="row">
                                <div class="col-md-12">

                                    <div class="product-list-topbar">
                                        <h3>My <span>Vouchers</span></h3>
                                        <div class="rightside-btns">
                                            <h6>12 of 1650</h6>
                                            <button class="filter-btn"><span
                                                    class="fi-rs-filter mr-5"></span>Filter</button>

                                            <select class="form-select">
                                                <option value="">Featured</option>
                                                <option value="">Best selling</option>
                                                <option value="">Alphabetically, A-Z</option>
                                                <option value="">Alphabetically, Z-A</option>
                                                <option value="">Price, low to high</option>
                                                <option value="">Price, high to low</option>
                                                <option value="">Date, old to new</option>
                                                <option value="">Date, new to old</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div class="row g-4">
                                <div class="col-xl-4 col-lg-6">
                                    <div class="product-cart-wrap">
                                        <div class="product-img-action-wrap">
                                            <div class="product-img product-img-zoom">
                                                <a href="voucher-details.php">
                                                    <img class="default-img" src="assets/imgs/shop/gift.jpg" alt="" />
                                                   
                                                </a>
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

                                            <h2><a href="voucher-details.php">Kalyan Jewellers Diamond Jewellery 
                                                Physical Gift Card</a></h2>
                                          
                                            <div class="voucher-price">
                                                <div class="d-flex">
                                                    <span class="new-voucher-price">399 SR</span>
                                                    <span class="old-voucher-price">499 SR</span>
                                                </div>
                                      
                                                <span class="voucher-price-off">3% OFF</span>
                                            </div>
                                         
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-4 col-lg-6">
                                    <div class="product-cart-wrap">
                                        <div class="product-img-action-wrap">
                                            <div class="product-img product-img-zoom">
                                                <a href="voucher-details.php">
                                                    <img class="default-img" src="assets/imgs/shop/gift1.jpg" alt="" />
                                                   
                                                </a>
                                               
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

                                            <h2><a href="voucher-details.php">Kalyan Jewellers Diamond Jewellery 
                                                Physical Gift Card</a></h2>
                                          
                                            <div class="voucher-price">
                                                <div class="d-flex">
                                                    <span class="new-voucher-price">399 SR</span>
                                                    <span class="old-voucher-price">499 SR</span>
                                                </div>
                                      
                                                <span class="voucher-price-off">3% OFF</span>
                                            </div>
                                          
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-4 col-lg-6">
                                    <div class="product-cart-wrap">
                                        <div class="product-img-action-wrap">
                                            <div class="product-img product-img-zoom">
                                                <a href="voucher-details.php">
                                                    <img class="default-img" src="assets/imgs/shop/gift2.jpg" alt="" />
                                               
                                                </a>
                                                
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

                                            <h2><a href="voucher-details.php">Kalyan Jewellers Diamond Jewellery 
                                                Physical Gift Card</a></h2>
                                           
                                            <div class="voucher-price">
                                                <div class="d-flex">
                                                    <span class="new-voucher-price">399 SR</span>
                                                    <span class="old-voucher-price">499 SR</span>
                                                </div>
                                      
                                                <span class="voucher-price-off">3% OFF</span>
                                            </div>
                                          
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-4 col-lg-6">
                                    <div class="product-cart-wrap">
                                        <div class="product-img-action-wrap">
                                            <div class="product-img product-img-zoom">
                                                <a href="voucher-details.php">
                                                    <img class="default-img" src="assets/imgs/shop/gift3.jpg" alt="" />
                                                  
                                                </a>
                                               
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

                                            <h2><a href="voucher-details.php">Kalyan Jewellers Diamond Jewellery 
                                                Physical Gift Card</a></h2>
                                           
                                            <div class="voucher-price">
                                                <div class="d-flex">
                                                    <span class="new-voucher-price">399 SR</span>
                                                    <span class="old-voucher-price">499 SR</span>
                                                </div>
                                      
                                                <span class="voucher-price-off">3% OFF</span>
                                            </div>
                                          
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-4 col-lg-6">
                                    <div class="product-cart-wrap">
                                        <div class="product-img-action-wrap">
                                            <div class="product-img product-img-zoom">
                                                <a href="voucher-details.php">
                                                    <img class="default-img" src="assets/imgs/shop/gift4.jpg" alt="" />
                                                   
                                                </a>
                                               
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

                                            <h2><a href="voucher-details.php">Kalyan Jewellers Diamond Jewellery 
                                                Physical Gift Card</a></h2>
                                           
                                            <div class="voucher-price">
                                                <div class="d-flex">
                                                    <span class="new-voucher-price">399 SR</span>
                                                    <span class="old-voucher-price">499 SR</span>
                                                </div>
                                      
                                                <span class="voucher-price-off">3% OFF</span>
                                            </div>
                                           
                                        </div>
                                    </div>
                                </div>
                                <div class="col-xl-4 col-lg-6">
                                    <div class="product-cart-wrap">
                                        <div class="product-img-action-wrap">
                                            <div class="product-img product-img-zoom">
                                                <a href="voucher-details.php">
                                                    <img class="default-img" src="assets/imgs/shop/gift5.jpg" alt="" />
                                                   
                                                </a>
                                               

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

                                            <h2><a href="voucher-details.php">Kalyan Jewellers Diamond Jewellery 
                                                Physical Gift Card</a></h2>
                                          
                                            <div class="voucher-price">
                                                <div class="d-flex">
                                                    <span class="new-voucher-price">399 SR</span>
                                                    <span class="old-voucher-price">499 SR</span>
                                                </div>
                                      
                                                <span class="voucher-price-off">3% OFF</span>
                                            </div>
                                          
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="pagination-area mt-20 mb-20">
                                <nav aria-label="Page navigation example">
                                    <ul class="pagination justify-content-center">
                                        <li class="page-item">
                                            <a class="page-link" href="#"><i class="fi-rs-arrow-small-left"></i></a>
                                        </li>
                                        <li class="page-item"><a class="page-link" href="#">1</a></li>
                                        <li class="page-item active"><a class="page-link" href="#">2</a></li>
                                        <li class="page-item"><a class="page-link" href="#">3</a></li>
                                   
                                        <li class="page-item">
                                            <a class="page-link" href="#"><i class="fi-rs-arrow-small-right"></i></a>
                                        </li>
                                    </ul>
                                </nav>
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
        $(document).ready(function () {
            $('.delete-search').on('click', function () {
                $(this).closest('li').remove();
                if ($('.filter-results li').length === 0) {
                    $('.filter-results').addClass('no-margin');
                } else {
                    $('.filter-results').removeClass('no-margin');
                }
            });

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
        $(document).ready(function() {
            $('.product-color-filter li').on('click', function() {
                $(this).siblings().removeClass('active');
                $(this).toggleClass('active');
            });
        });
  </script>

  <script>
    function searchToggle(obj, evt){
    var container = $(obj).closest('.search-wrapper');
        if(!container.hasClass('active')){
            container.addClass('active');
            evt.preventDefault();
        }
        else if(container.hasClass('active') && $(obj).closest('.input-holder').length == 0){
            container.removeClass('active');
            // clear input
            container.find('.search-input').val('');
        }
}
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
</body>

</html>