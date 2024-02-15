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
                            <p>Please enter the OTP to verify your phone.</p>

                            <form class="form-horizontal" action="index.php">

                                <div class="mb-2">
                   
                                    <div class="d-flex otp-input justify-content-between">
                                        <input id="otp-first" class="form-control" type="number" min="0" max="9" step="1" aria-label="first digit" />
                                        <input id="otp-second" class="form-control" type="number" min="0" max="9" step="1" aria-label="second digit" />
                                        <input id="otp-third" class="form-control" type="number" min="0" max="9" step="1" aria-label="third digit" />
                                        <input id="otp-fourth" class="form-control" type="number" min="0" max="9" step="1" aria-label="fourth digit" />
                                    </div>
                                    <div class="invalid-feedback">
                                        Please Enter OTP
                                    </div>
                                </div>



                                <div class="mt-3 d-grid">
                                    <button class="btn btn-primary waves-effect waves-light" type="submit">Submit</button>
                                </div>


                                <div class="mt-4 text-center login-bottom">
                                    <a href="login.php"><i class="mdi mdi-chevron-left me-1"></i> Change Phone Number ?</a>
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

    </div>




    <script src="https://kit.fontawesome.com/16b0815225.js" crossorigin="anonymous"></script>
    <script src="assets/js/vendor/jquery-3.6.0.min.js"></script>
    <script src="assets/js/vendor/bootstrap.bundle.min.js"></script>
    <script src="assets/js/plugins/slick.js"></script>
    <script src="assets/js/plugins/wow.js"></script>
    <script src="assets/js/plugins/magnific-popup.js"></script>
    <script src="assets/js/script.js"></script>



    <!-- otp script -->
    <script>
        console.clear();
        let inputs = document.querySelectorAll("input");
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
</body>

</html>