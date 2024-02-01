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

        <section class="section-padding prdcts pb-40">
            <div class="container">
                <div class="row">
                    <div class="col-md-3">
                        <ul class="breadcrumb-list pt-0 mb-2">
                            <li> <a href="index.php">Home</a>
                                <span class="separator" aria-hidden="true">&rsaquo;</span></li>
                            <li class="active-brudcrumb">
                                <a href="voucher.php">Order History</a>

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
                    <div class="col-md-9">
                        <div class="products-list1 history-list">
                            <div class="row">
                                <div class="col-md-12">

                                    <div class="product-list-topbar">
                                        <h3>History</h3>
                                        <div class="rightside-btns">
                                            <h6>12 of 1650</h6>
                                            <button class="filter-btn"><span
                                                    class="fi-rs-filter mr-5"></span>Filter</button>

                                            <select class="form-select">
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
                                <div class="col-md-4">
                                    <div class="history-div">
                                        <h4>Cancelled<i class="fa-solid fa-xmark"></i></h4>
                                        <p>On sun, 28 Aug 2022 as per your request</p>
                                        <h6><span class="refund">Refund Initiated : </span><span class="refund-rs">467 SAR</span> on Sun, 28 Aug 2022.</h6> 
                                        <div class="history-item">
                                            <div class="hist-img">
                                                <img src="assets/imgs/shop/pr3.jpg" alt="">
                                            </div>
                                            <div class="hist-details">
                                                <h3>Jack & Jones Men Solid 
                                                    Bomber jacket</h3>
                                                <h5>Size: <span>L</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="history-div">
                                        <h4>Exchange Delivered<i class="fa-solid fa-right-left"></i></h4>
                                        <p>On sun, 28 Aug 2022 as per your request</p>
                                     
                                        <div class="history-item">
                                            <div class="hist-img">
                                                <img src="assets/imgs/shop/pr2.jpg" alt="">
                                            </div>
                                            <div class="hist-details">
                                                <h3>Jack & Jones Men Solid 
                                                    Bomber jacket</h3>
                                                <h5>Size: <span>L</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="history-div">
                                        <h4>Refund Credited<i class="fa-solid fa-rotate-left"></i></h4>
                                        <p>On sun, 28 Aug 2022 as per your request</p>
                                        <h6><span class="refund">Refund Initiated : </span><span class="refund-rs">467 SAR</span> on Sun, 28 Aug 2022.</h6> 
                                        <div class="history-item">
                                            <div class="hist-img">
                                                <img src="assets/imgs/shop/p2.jpg" alt="">
                                            </div>
                                            <div class="hist-details">
                                                <h3>Jack & Jones Men Solid 
                                                    Bomber jacket</h3>
                                                <h5>Size: <span>L</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="history-div">
                                        <h4>Delivered<i class="fa-solid fa-truck-ramp-box"></i></h4>
                                        <p>On sun, 28 Aug 2022 as per your request</p>
                                       
                                        <div class="history-item">
                                            <div class="hist-img">
                                                <img src="assets/imgs/shop/p2.jpg" alt="">
                                            </div>
                                            <div class="hist-details">
                                                <h3>Jack & Jones Men Solid 
                                                    Bomber jacket</h3>
                                                <h5>Size: <span>L</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="history-div">
                                        <h4>Exchange Delivered<i class="fa-solid fa-right-left"></i></h4>
                                        <p>On sun, 28 Aug 2022 as per your request</p>
                                       
                                        <div class="history-item">
                                            <div class="hist-img">
                                                <img src="assets/imgs/shop/p6.jpg" alt="">
                                            </div>
                                            <div class="hist-details">
                                                <h3>Jack & Jones Men Solid 
                                                    Bomber jacket</h3>
                                                <h5>Size: <span>L</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="history-div">
                                        <h4>Refund Credited<i class="fa-solid fa-rotate-left"></i></h4>
                                        <p>On sun, 28 Aug 2022 as per your request</p>
                                        <h6><span class="refund">Refund Initiated : </span><span class="refund-rs">467 SAR</span> on Sun, 28 Aug 2022.</h6> 
                                        <div class="history-item">
                                            <div class="hist-img">
                                                <img src="assets/imgs/shop/pr1.jpg" alt="">
                                            </div>
                                            <div class="hist-details">
                                                <h3>Jack & Jones Men Solid 
                                                    Bomber jacket</h3>
                                                <h5>Size: <span>L</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="history-div">
                                        <h4>Cancelled<i class="fa-solid fa-xmark"></i></h4>
                                        <p>On sun, 28 Aug 2022 as per your request</p>
                                        <h6><span class="refund">Refund Initiated : </span><span class="refund-rs">467 SAR</span> on Sun, 28 Aug 2022.</h6> 
                                        <div class="history-item">
                                            <div class="hist-img">
                                                <img src="assets/imgs/shop/pr3.jpg" alt="">
                                            </div>
                                            <div class="hist-details">
                                                <h3>Jack & Jones Men Solid 
                                                    Bomber jacket</h3>
                                                <h5>Size: <span>L</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="history-div">
                                        <h4>Exchange Delivered<i class="fa-solid fa-right-left"></i></h4>
                                        <p>On sun, 28 Aug 2022 as per your request</p>
                                     
                                        <div class="history-item">
                                            <div class="hist-img">
                                                <img src="assets/imgs/shop/pr2.jpg" alt="">
                                            </div>
                                            <div class="hist-details">
                                                <h3>Jack & Jones Men Solid 
                                                    Bomber jacket</h3>
                                                <h5>Size: <span>L</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="history-div">
                                        <h4>Refund Credited<i class="fa-solid fa-rotate-left"></i></h4>
                                        <p>On sun, 28 Aug 2022 as per your request</p>
                                        <h6><span class="refund">Refund Initiated : </span><span class="refund-rs">467 SAR</span> on Sun, 28 Aug 2022.</h6> 
                                        <div class="history-item">
                                            <div class="hist-img">
                                                <img src="assets/imgs/shop/p2.jpg" alt="">
                                            </div>
                                            <div class="hist-details">
                                                <h3>Jack & Jones Men Solid 
                                                    Bomber jacket</h3>
                                                <h5>Size: <span>L</span></h5>
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
</body>

</html>