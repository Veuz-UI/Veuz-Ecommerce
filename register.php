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
    <div class="login-page">
        <div class="container px-0">
            <div class="row">
                <div class="col-md-6 order-md-1 order-2">
                    <div class="login-right-div">
                        <div class="login-form">
                            <h2>Register Now</h2>
                            <p>Please enter your details.</p>

                            <form class="needs-validation register-form" novalidate action="login.php">

                                <div class="mb-md-3 mb-2">
               
                                    <input type="text" class="form-control" id="username" placeholder="Enter username" required>
                                    <div class="invalid-feedback">
                                        Please Enter Username
                                    </div>
                                </div>

                                <div class="mb-md-3 mb-2">
                              
                                    <input type="email" class="form-control" id="useremail" placeholder="Enter email" required>
                                    <div class="invalid-feedback">
                                        Please Enter Email
                                    </div>
                                </div>

                                <div class="mb-md-3 mb-2">
                      
                                    <input type="password" class="form-control" id="userpassword" placeholder="Enter password" required>
                                    <div class="invalid-feedback">
                                        Please Enter Password
                                    </div>
                                </div>
                                <div class="mb-4">
                             
                                    <input type="password" class="form-control" id="userpassword" placeholder="Confirm password" required>
                                    <div class="invalid-feedback">
                                        Please Enter Password
                                    </div>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="remember-check">
                                    <label class="form-check-label" for="remember-check">
                                            I agree to the <a href="#">Terms of service</a> and <a href="#">Privacy policies</a> of Veuz concepts
                                        </label>
                                </div>
                                <div class="mt-3 d-grid">
                                    <button class="btn btn-primary waves-effect waves-light" type="submit">Register</button>
                                </div>

                                <div class="signup-using text-center">
                                    <h5 class="mb-3">Sign up using</h5>

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
        <div class="mt-4 text-center login-bottom">

            <div>
                <p>Already have an account ? <a href="login.php" class="fw-medium text-primary"> Login</a> </p>
                <!-- <p>© <script>document.write(new Date().getFullYear())</script> All Rights Reserved. Design & Develop by Veuz concepts.</p> -->
            </div>
        </div>
    </div>


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

</body>

</html>