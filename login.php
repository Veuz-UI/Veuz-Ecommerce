<!doctype html>
<html lang="en">

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

<body class="bg1">
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
        <div class="login-page">
            <div class="container px-0">
                <div class="row">
                    <div class="col-md-6 order-md-1 order-2">
                        <div class="login-right-div">
                            <div class="login-form">
                                <h2>Sign up or Sign in</h2>
                                <p>Welcome Back ! Please enter your Phone Number.</p>
                                <!-- <p>Enter your email and we will send you a OTP to reset your password.</p> -->

                                <form class="form-horizontal" action="otp.php">
        
                                    <div class="mb-3">
        
                                        <input type="tel" class="form-control" id="phone" placeholder="Enter Phone Number" required>  
                                        <div class="invalid-feedback">
                                            Please Enter Phone Number
                                        </div>      
                                    </div>
                                    
                                    <div class="mt-3 d-grid">
                                      <button class="btn btn-primary waves-effect waves-light" type="submit">Submit</button> 
                                    </div>
        
                                    <div class="signup-using text-center">
                                    <h5>Sign in with</h5>

                                    <ul class="list-inline">
                                        <li class="list-inline-item">
                                            <a href="javascript::void()" class="social-list-item bg-primary text-white border-primary">
                                            <i class="fa-brands fa-facebook"></i>
                                            </a>
                                        </li>
                                        <li class="list-inline-item">
                                            <a href="javascript::void()" class="social-list-item bg-info text-white border-info">
                                            <i class="fa-brands fa-x-twitter"></i>
                                            </a>
                                        </li>
                                        <li class="list-inline-item">
                                            <a href="javascript::void()" class="social-list-item bg-danger text-white border-danger">
                                            <i class="fa-brands fa-google"></i>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                                    <!-- <div class="mt-4 text-center login-bottom">
                                        <a href="login.php" class="text-muted"><i class="mdi mdi-chevron-left me-1"></i> Back to login</a>
                                    </div> -->
                                </form>
        
                                
                            </div>
                           
                        </div>
                    </div>
                    <div class="col-md-6 order-md-2 order-1">
                        <div class="login-left-div">
                            <img src="assets/images/login.png" alt="">
                        </div>
                    </div>
              
                </div>
                
        
            </div>
            <!-- <div class="mt-4 text-center login-bottom">
                            
                <div>
                    <p>Don't have an account ? <a href="register.php" class="fw-medium text-primary "> Signup now </a> </p>
                   
                </div>
            </div> -->
        </div>



        <script src="https://kit.fontawesome.com/16b0815225.js" crossorigin="anonymous"></script>
        <script src="assets/js/vendor/jquery-3.6.0.min.js"></script>
        <script src="assets/js/vendor/bootstrap.bundle.min.js"></script>
        <script src="assets/js/plugins/slick.js"></script>
        <script src="assets/js/plugins/wow.js"></script>
        <script src="assets/js/plugins/magnific-popup.js"></script>
        <script src="assets/js/script.js"></script>
    </body>
</html>
